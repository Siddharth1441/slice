import mongoose from 'mongoose';

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food-ordering-system';
  const fallbackUri = 'mongodb://127.0.0.1:27017/food-ordering-system';

  try {
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    if (primaryUri !== fallbackUri) {
      console.warn(`Primary MongoDB connection failed (${error.message}). Trying local fallback...`);
      try {
        const conn = await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
      } catch (fallbackError) {
        console.error(`MongoDB Connection Error: ${fallbackError.message}`);
        return false;
      }
    }

    console.error(`MongoDB Connection Error: ${error.message}`);
    return false;
  }
};

export default connectDB;
