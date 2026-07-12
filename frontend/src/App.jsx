import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';

// Page Imports
import MenuView from './pages/customer/MenuView';
import CartView from './pages/customer/CartView';
import TrackOrder from './pages/customer/TrackOrder';
import LoginPortal from './pages/auth/LoginPortal';
import ChefDashboard from './pages/chef/ChefDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-page text-heading selection:bg-brand-500 selection:text-white">
          {/* Main Navigation */}
          <Navbar />

          {/* Page Routing */}
          <main className="flex-1 pb-16">
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<MenuView />} />
              <Route path="/cart" element={<CartView />} />
              <Route path="/track" element={<TrackOrder />} />

              {/* Staff Authentication Portal */}
              <Route path="/login" element={<LoginPortal />} />

              {/* Kitchen / Chef Dashboard */}
              <Route path="/chef" element={<ChefDashboard />} />

              {/* Administrative Dashboard */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Fallback Route redirects to home */}
              <Route path="*" element={<MenuView />} />
            </Routes>
          </main>

          {/* Glassy Minimalist Footer */}
          <footer className="py-6 border-t border-divider bg-surface text-center text-xs text-body">
            <p>© {new Date().getFullYear()} cheesy slice Foods Inc. All rights reserved.</p>
          </footer>
        </div>
      </Router>
    </AppProvider>
  );
}
