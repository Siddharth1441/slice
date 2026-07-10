import Settings from '../models/Settings.js';

// Get current settings (Public)
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Seed default settings
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update settings (Admin only)
export const updateSettings = async (req, res) => {
  const { storeName, isStoreOpen, deliveryCharge, contactPhone, announcement } = req.body;

  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (storeName !== undefined) settings.storeName = storeName;
    if (isStoreOpen !== undefined) settings.isStoreOpen = isStoreOpen;
    if (deliveryCharge !== undefined) settings.deliveryCharge = Number(deliveryCharge);
    if (contactPhone !== undefined) settings.contactPhone = contactPhone;
    if (announcement !== undefined) settings.announcement = announcement;

    const updatedSettings = await settings.save();
    res.json({ message: 'Settings updated successfully', settings: updatedSettings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
