import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Settings as SettingsIcon,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Store,
  Package,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
  const { auth, logoutUser, apiFetch, formatCurrency } = useApp();
  const navigate = useNavigate();

  // Tab control
  const [activeTab, setActiveTab] = useState('reports'); // reports, menu, orders, settings

  // Dashboard Data states
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [salesReport, setSalesReport] = useState({
    summary: { totalRevenue: 0, totalOrders: 0 },
    dailySales: [],
    monthlySales: [],
    popularItems: []
  });
  
  // Settings Local Form State
  const [storeName, setStoreName] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [contactPhone, setContactPhone] = useState('');
  const [announcement, setAnnouncement] = useState('');

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null if adding new
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    isAvailable: true
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Secure route check
  useEffect(() => {
    if (!auth.isAuthenticated || auth.user?.role !== 'admin') {
      navigate('/login');
    }
  }, [auth, navigate]);

  // Load Data based on active tab
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchSalesReport();
    } else if (activeTab === 'menu') {
      fetchMenuItems();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/orders/sales-report');
      if (!res.ok) throw new Error('Failed to retrieve sales reports');
      const data = await res.json();
      setSalesReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/menu');
      if (!res.ok) throw new Error('Failed to load menu catalog');
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/orders?limit=100');
      if (!res.ok) throw new Error('Failed to fetch store orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/settings');
      if (!res.ok) throw new Error('Failed to retrieve application settings');
      const data = await res.json();
      setStoreName(data.storeName);
      setIsStoreOpen(data.isStoreOpen);
      setDeliveryCharge(data.deliveryCharge);
      setContactPhone(data.contactPhone);
      setAnnouncement(data.announcement);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          storeName,
          isStoreOpen,
          deliveryCharge,
          contactPhone,
          announcement
        })
      });

      if (!res.ok) throw new Error('Failed to update configurations');
      
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenMenuModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setMenuForm({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        isAvailable: item.isAvailable
      });
    } else {
      setEditingItem(null);
      setMenuForm({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        isAvailable: true
      });
    }
    setIsMenuModalOpen(true);
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!menuForm.name || !menuForm.description || !menuForm.price || !menuForm.category) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const url = editingItem ? `/api/menu/${editingItem._id}` : '/api/menu';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(menuForm)
      });

      if (!res.ok) throw new Error('Could not save menu item changes');

      setSuccess(editingItem ? 'Menu item updated!' : 'Menu item created!');
      setIsMenuModalOpen(false);
      fetchMenuItems();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    setError('');
    
    try {
      const res = await apiFetch(`/api/menu/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete menu item');
      
      setSuccess('Menu item deleted!');
      fetchMenuItems();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Could not update status');
      
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!auth.isAuthenticated || auth.user?.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 animate-slide-up">
      {/* Dashboard Top Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold text-heading flex items-center space-x-2">
            <TrendingUp className="text-brand-500 w-8 h-8" />
            <span>Admin <span className="text-gradient-orange font-black">Control Hub</span></span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Welcome back, <span className="text-body font-semibold">@{auth.user.username}</span>
          </p>
        </div>

        <button
          onClick={async () => {
            await logoutUser();
            navigate('/');
          }}
          className="py-2.5 px-5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-red-400 text-xs font-semibold flex items-center space-x-2"
        >
          <Package className="w-4 h-4" />
          <span>Secure Sign Out</span>
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-surface p-1.5 rounded-2xl mb-8 border border-border overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center space-x-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'reports' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25' : 'text-muted hover:text-heading'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Sales & Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center space-x-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'menu' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25' : 'text-muted hover:text-heading'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Menu Editor</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center space-x-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'orders' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25' : 'text-muted hover:text-heading'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>All Orders</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25' : 'text-muted hover:text-heading'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Store Settings</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
          {success}
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'reports' && (
        <div className="space-y-8 animate-slide-up">
          {/* Sales Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass rounded-3xl p-6 border border-border flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-600/10 text-brand-500 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-muted font-semibold block uppercase">Total Revenue</span>
                <h4 className="text-2xl font-black text-heading mt-0.5">
                  {formatCurrency(salesReport.summary?.totalRevenue)}
                </h4>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-border flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-muted font-semibold block uppercase">Completed Orders</span>
                <h4 className="text-2xl font-black text-heading mt-0.5">
                  {salesReport.summary?.totalOrders}
                </h4>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-border flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-muted font-semibold block uppercase">Average Order Value</span>
                <h4 className="text-2xl font-black text-heading mt-0.5">
                  {formatCurrency(
                    salesReport.summary?.totalOrders > 0
                      ? salesReport.summary.totalRevenue / salesReport.summary.totalOrders
                      : 0
                  )}
                </h4>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Daily Sales Table (Col 6) */}
            <div className="lg:col-span-6 glass rounded-3xl p-6 border border-border">
              <h3 className="text-lg font-bold text-heading mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-brand-500" />
                <span>Daily Sales Summary</span>
              </h3>
              
              <div className="overflow-x-auto max-h-[300px] no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted pb-3">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Orders</th>
                      <th className="py-2.5 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {salesReport.dailySales?.map((day) => (
                      <tr key={day.date} className="hover:bg-surface transition-colors text-body">
                        <td className="py-3 font-semibold">{day.date}</td>
                        <td className="py-3">{day.count}</td>
                        <td className="py-3 text-right text-heading font-extrabold">{formatCurrency(day.revenue)}</td>
                      </tr>
                    ))}
                    {salesReport.dailySales?.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-6 text-muted">No daily sales logs found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Sales Table (Col 6) */}
            <div className="lg:col-span-6 glass rounded-3xl p-6 border border-border">
              <h3 className="text-lg font-bold text-heading mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                <span>Monthly Sales Summary</span>
              </h3>

              <div className="overflow-x-auto max-h-[300px] no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted pb-3">
                      <th className="py-2.5">Month</th>
                      <th className="py-2.5">Orders</th>
                      <th className="py-2.5 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {salesReport.monthlySales?.map((mon) => (
                      <tr key={mon.month} className="hover:bg-surface transition-colors text-body">
                        <td className="py-3 font-semibold">{mon.month}</td>
                        <td className="py-3">{mon.count}</td>
                        <td className="py-3 text-right text-heading font-extrabold">{formatCurrency(mon.revenue)}</td>
                      </tr>
                    ))}
                    {salesReport.monthlySales?.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-6 text-muted">No monthly sales logs found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Popular Items Card */}
          <div className="glass rounded-3xl p-6 border border-border">
            <h3 className="text-lg font-bold text-heading mb-4">Top-Selling Menu Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted pb-3">
                    <th className="py-3">Dish Name</th>
                    <th className="py-3">Quantity Sold</th>
                    <th className="py-3 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-body">
                  {salesReport.popularItems?.map((item) => (
                    <tr key={item.id} className="hover:bg-surface transition-colors">
                      <td className="py-3.5 font-semibold text-heading">{item.name}</td>
                      <td className="py-3.5">{item.quantity}</td>
                      <td className="py-3.5 text-right text-brand-500 font-extrabold">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                  {salesReport.popularItems?.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center py-6 text-muted">No item popularity stats available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-6 animate-slide-up">
          {/* Menu Management Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-heading">Menu Catalog ({menuItems.length} items)</h3>
            <button
              onClick={() => handleOpenMenuModal()}
              className="py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          {/* Menu Items Table */}
          <div className="glass rounded-3xl overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface/80 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted py-3 px-6">
                    <th className="py-4 px-6">Dish Name</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6">Availability</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-body">
                  {menuItems.map((item) => (
                    <tr key={item._id} className="hover:bg-surface transition-colors">
                      <td className="py-4 px-6 font-semibold text-heading">{item.name}</td>
                      <td className="py-4 px-6">{item.category}</td>
                      <td className="py-4 px-6 font-semibold">{formatCurrency(item.price)}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            item.isAvailable
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {item.isAvailable ? 'Available' : 'Sold Out'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right flex justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenMenuModal(item)}
                          className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item._id)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {menuItems.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-muted">Menu catalog is empty</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6 animate-slide-up">
          <h3 className="text-lg font-bold text-heading">Full Store Order Logs ({orders.length} orders)</h3>

          <div className="glass rounded-3xl overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface/80 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted py-3 px-6">
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Items</th>
                    <th className="py-4 px-6">Total Amount</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-body">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-surface transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-muted">{order._id}</td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-heading">{order.customerName}</div>
                        <div className="text-[11px] text-muted">{order.customerPhone}</div>
                      </td>
                      <td className="py-4 px-6">
                        <ul className="text-xs space-y-0.5">
                          {order.items.map((i, idx) => (
                            <li key={idx}>x{i.quantity} {i.name}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-4 px-6 font-bold text-heading">{formatCurrency(order.totalAmount)}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border ${
                            order.status === 'pending'
                              ? 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                              : order.status === 'preparing'
                              ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                              : order.status === 'ready'
                              ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                              : order.status === 'completed'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right flex justify-end gap-2.5">
                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'completed')}
                              className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                              title="Complete / Deliver"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Cancel Order"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-muted">No store orders logged yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="glass rounded-3xl p-6 md:p-8 border border-border animate-slide-up max-w-3xl">
          <h3 className="text-lg font-bold text-heading mb-6 flex items-center space-x-2">
            <Store className="w-5 h-5 text-brand-500" />
            <span>Store Configuration</span>
          </h3>

          <form onSubmit={handleUpdateSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">Store Name</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-2xl py-3 px-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">Customer Support Phone</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-surface border border-border rounded-2xl py-3 px-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                />
              </div>

              

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">Flat Delivery Charge (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className="w-full bg-surface border border-border rounded-2xl py-3 px-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted">Announcement Bar Text</label>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Announcements visible to customers on Menu page..."
                rows="3"
                className="w-full bg-surface border border-border rounded-2xl py-3 px-4 text-sm text-heading focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isStoreOpen"
                type="checkbox"
                checked={isStoreOpen}
                onChange={(e) => setIsStoreOpen(e.target.checked)}
                className="w-5 h-5 accent-brand-500 rounded border-border cursor-pointer"
              />
              <label htmlFor="isStoreOpen" className="text-sm font-semibold text-body cursor-pointer select-none">
                Accepting Orders (Store Open)
              </label>
            </div>

            <button
              type="submit"
              className="py-3.5 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.01]"
            >
              Save Configuration
            </button>
          </form>
        </div>
      )}

      {/* Menu item modal (Create / Edit) */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-lg p-6 md:p-8 animate-slide-up relative">
            <button
              onClick={() => setIsMenuModalOpen(false)}
              className="absolute right-4 top-4 p-2 bg-surface/80 hover:bg-surface/90 rounded-xl text-muted hover:text-heading"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">
              {editingItem ? 'Modify Menu Item' : 'Create New Menu Item'}
            </h3>

            <form onSubmit={handleMenuSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted">Item Name</label>
                  <input
                    type="text"
                    required
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                      className="w-full bg-surface border border-border rounded-2xl py-2.5 px-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted">Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pizza, Salad"
                      value={menuForm.category}
                      onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                      className="w-full bg-surface border border-border rounded-2xl py-2.5 px-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={menuForm.price}
                      onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                      className="w-full bg-surface border border-border rounded-2xl py-2.5 px-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted">Image URL</label>
                    <input
                      type="url"
                      value={menuForm.image}
                      placeholder="https://..."
                      onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })}
                      className="w-full bg-surface border border-border rounded-2xl py-2.5 px-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted">Description</label>
                    <textarea
                      required
                      rows="3"
                      value={menuForm.description}
                      onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                      className="w-full bg-surface border border-border rounded-2xl py-2.5 px-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                    ></textarea>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-surface/90 p-3.5 border border-border rounded-2xl max-w-xs">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={menuForm.isAvailable}
                  onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })}
                  className="w-5 h-5 accent-brand-500 rounded cursor-pointer"
                />
                <label htmlFor="isAvailable" className="text-sm font-semibold text-body cursor-pointer select-none">
                  Available in Stock
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-surface border border-border text-body text-xs font-semibold hover:bg-surface/90"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md"
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
