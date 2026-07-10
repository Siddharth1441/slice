import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Models for seeding
import User from './models/User.js';
import MenuItem from './models/MenuItem.js';
import Settings from './models/Settings.js';

// Load env vars
dotenv.config();

// Connect to Database
const dbConnected = await connectDB();
global.dbConnected = dbConnected;

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Set Socket.io instance on express app to access in controllers
app.set('io', io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: true, // Allow request origin
    credentials: true,
  })
);

// Route Middlewares
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);

// Root path message
app.get('/', (req, res) => {
  res.json({ message: 'Antigravity Food Ordering System API is running...' });
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Room for tracking specific orders
  socket.on('joinOrder', (orderId) => {
    socket.join(orderId);
    console.log(`Socket ${socket.id} joined order room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Database Seeding Logic
const seedDatabase = async () => {
  try {
    // 1. Seed Settings
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({});
      console.log('Seeded default settings.');
    }

    // 2. Seed Users (Admin & Chef)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // Create admin
      await User.create({
        username: 'admin',
        email: 'admin@food.com',
        password: 'admin123',
        role: 'admin',
      });
      // Create chef
      await User.create({
        username: 'chef',
        email: 'chef@food.com',
        password: 'chef123',
        role: 'chef',
      });
      console.log('Seeded default accounts: admin (admin123), chef (chef123).');
    }

    // 3. Seed Menu Items
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      const mockItems = [
        {
          name: 'Margherita Pizza',
          description: 'Classic tomato sauce, fresh buffalo mozzarella, fresh basil, and extra virgin olive oil.',
          price: 1299,
          category: 'Pizza',
          image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=60',
          isAvailable: true,
        },
        {
          name: 'Pepperoni Supreme',
          description: 'Spicy pepperoni slices, jalapenos, black olives, mozzarella, and marinara sauce.',
          price: 1499,
          category: 'Pizza',
          image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=60',
          isAvailable: true,
        },
        {
          name: 'Classic Cheeseburger',
          description: 'Flame-grilled Angus beef patty, cheddar cheese, crisp lettuce, sliced tomato, onions, and signature burger sauce on a toasted brioche bun.',
          price: 999,
          category: 'Burgers',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
          isAvailable: true,
        },
        {
          name: 'Smoky BBQ Burger',
          description: 'Grilled patty, crispy bacon, cheddar, onion rings, and smoky barbecue sauce.',
          price: 1149,
          category: 'Burgers',
          image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=60',
          isAvailable: true,
        },
        {
          name: 'Grilled Chicken Caesar Salad',
          description: 'Tender grilled chicken breast, fresh romaine lettuce, parmesan garlic croutons, and creamy Caesar dressing.',
          price: 899,
          category: 'Salads',
          image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&auto=format&fit=crop&q=60',
          isAvailable: true,
        },
        {
          name: 'Greek Garden Salad',
          description: 'Crisp cucumbers, vine-ripened tomatoes, red onions, kalamata olives, and feta cheese drizzled with greek dressing.',
          price: 799,
          category: 'Salads',
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&auto=format&fit=crop&q=60',
          isAvailable: true,
        },
        {
          name: 'Loaded Nachos',
          description: 'Crispy tortilla chips topped with cheese sauce, black beans, jalapenos, sour cream, and fresh pico de gallo.',
          price: 1029,
          category: 'Appetizers',
          image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=60',
          isAvailable: true,
        },
        {
          name: 'Warm Chocolate Lava Cake',
          description: 'Decadent chocolate cake with a molten fudge core, served warm with vanilla bean ice cream.',
          price: 699,
          category: 'Desserts',
          image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60',
          isAvailable: true,
        },
        {
          name: 'Fresh Mint Lemonade',
          description: 'Chilled lemonade infused with fresh garden mint leaves and a touch of honey.',
          price: 349,
          category: 'Beverages',
          image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
          isAvailable: true,
        },
      ];
      await MenuItem.insertMany(mockItems);
      console.log('Seeded menu items catalog.');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Seed database (real MongoDB or mock JSON file fallback)
  await seedDatabase();
});
