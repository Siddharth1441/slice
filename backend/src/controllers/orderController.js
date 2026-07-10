import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';

// Place a new order (Public)
export const placeOrder = async (req, res) => {
  const { customerName, customerPhone, items } = req.body;

  if (!customerName || !customerPhone || !items || !items.length) {
    return res.status(400).json({ message: 'Customer details and order items are required' });
  }

  try {
    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item with ID ${item.menuItem} not found` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ message: `Menu item "${menuItem.name}" is currently unavailable` });
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
      });
    }

    const order = await Order.create({
      customerName,
      customerPhone,
      items: validatedItems,
      totalAmount,
      status: 'pending',
    });

    // Broadcast to Chef/Admin via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('orderCreated', order);
    }

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Track order status (Public)
export const trackOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get orders list (RBAC: Admin gets all, Chef gets active/pending)
export const getOrders = async (req, res) => {
  const { status, limit = 50, skip = 0 } = req.query;
  const filter = {};

  // Admin filter or Chef filter
  if (req.user.role === 'chef') {
    // Chefs only need active kitchen queue
    filter.status = { $in: ['pending', 'preparing', 'ready'] };
  } else if (status) {
    filter.status = status;
  }

  try {
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));
    
    const total = await Order.countDocuments(filter);

    res.json({ orders, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status (Chef: pending->preparing->ready, Admin: any transition)
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status' });
  }

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Role-based restrictions on transitions
    if (req.user.role === 'chef') {
      if (!['preparing', 'ready'].includes(status)) {
        return res.status(403).json({ message: 'Chefs can only mark orders as preparing or ready' });
      }
    }

    order.status = status;
    const updatedOrder = await order.save();

    // Broadcast update via socket
    const io = req.app.get('io');
    if (io) {
      // Broadcast to specific order tracking room
      io.to(id).emit('orderStatusUpdated', updatedOrder);
      // Broadcast to all logged-in dashboards
      io.emit('orderUpdated', updatedOrder);
    }

    res.json({ message: `Order status updated to ${status}`, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Sales Report (Admin only: Daily, Monthly, and Popular Items)
export const getSalesReport = async (req, res) => {
  try {
    // Only aggregate completed orders
    const completedFilter = { status: 'completed' };

    // 1. Overall Totals
    const overallStats = await Order.aggregate([
      { $match: completedFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = overallStats[0]?.totalRevenue || 0;
    const totalOrders = overallStats[0]?.totalOrders || 0;

    // 2. Daily Sales Report
    const dailySales = await Order.aggregate([
      { $match: completedFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }, // Last 30 days
    ]);

    // 3. Monthly Sales Report
    const monthlySales = await Order.aggregate([
      { $match: completedFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 }, // Last 12 months
    ]);

    // 4. Popular Menu Items
    const popularItems = await Order.aggregate([
      { $match: completedFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          quantitySold: { $sum: '$items.quantity' },
          revenueGenerated: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 }, // Top 10 items
    ]);

    res.json({
      summary: {
        totalRevenue,
        totalOrders,
      },
      dailySales: dailySales.map((d) => ({ date: d._id, revenue: d.revenue, count: d.count })),
      monthlySales: monthlySales.map((m) => ({ month: m._id, revenue: m.revenue, count: m.count })),
      popularItems: popularItems.map((p) => ({
        id: p._id,
        name: p.name,
        quantity: p.quantitySold,
        revenue: p.revenueGenerated,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
