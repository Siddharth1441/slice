import MenuItem from '../models/MenuItem.js';

// Get all menu items with search and category filters
export const getMenu = async (req, res) => {
  const { search, category, availability } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (category && category !== 'All') {
    query.category = category;
  }

  if (availability === 'true') {
    query.isAvailable = true;
  }

  try {
    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new menu item (Admin only)
export const createMenuItem = async (req, res) => {
  const { name, description, price, category, image, isAvailable } = req.body;

  if (!name || !description || price === undefined || !category) {
    return res.status(400).json({ message: 'Name, description, price and category are required' });
  }

  try {
    const menuItem = await MenuItem.create({
      name,
      description,
      price: Number(price),
      category,
      image: image || '',
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    res.status(201).json({ message: 'Menu item created successfully', menuItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an existing menu item (Admin only)
export const updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, image, isAvailable } = req.body;

  try {
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (name) menuItem.name = name;
    if (description) menuItem.description = description;
    if (price !== undefined) menuItem.price = Number(price);
    if (category) menuItem.category = category;
    if (image !== undefined) menuItem.image = image;
    if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

    const updatedItem = await menuItem.save();
    res.json({ message: 'Menu item updated successfully', menuItem: updatedItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a menu item (Admin only)
export const deleteMenuItem = async (req, res) => {
  const { id } = req.params;

  try {
    const menuItem = await MenuItem.findByIdAndDelete(id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
