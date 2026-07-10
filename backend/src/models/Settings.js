import mongoose from 'mongoose';
import getModel from './modelFallback.js';

const settingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'Antigravity Foods',
    },
    isStoreOpen: {
      type: Boolean,
      default: true,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    contactPhone: {
      type: String,
      default: '+1 234 567 8900',
    },
    announcement: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const MongooseSettings = mongoose.model('Settings', settingsSchema);
const Settings = getModel('Settings', MongooseSettings);
export default Settings;
