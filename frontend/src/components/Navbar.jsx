import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Compass, Clock, ShieldAlert, LogOut, Menu, X, User } from 'lucide-react';

export default function Navbar() {
  const { cart, auth, logoutUser } = useApp();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Menu', icon: Compass },
    { to: '/track', label: 'Track Order', icon: Clock },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center space-x-2 select-none group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-orange-400 flex items-center justify-center shadow-lg shadow-brand-600/30 transform group-hover:rotate-12 transition-transform duration-300">
          <img className='rounded-2xl' src="https://ik.imagekit.io/boks6a8adw/logo.jpg" alt="" />
        </div>
        <span className="text-xl font-bold font-display tracking-tight text-white group-hover:text-brand-500 transition-colors">
          cheesy slice<span className="text-brand-500"> pizza</span>
        </span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center space-x-2 text-slate-300 hover:text-white hover:translate-y-[-1px] transition-all"
            >
              <Icon className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-medium">{link.label}</span>
            </Link>
          );
        })}

        {/* Cart Link */}
        <Link
          to="/cart"
          className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
        >
          <ShoppingBag className="w-5 h-5 text-white group-hover:text-brand-500 transition-colors" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
              {cartCount}
            </span>
          )}
        </Link>

        {/* Portal Access / Logout */}
        {auth.isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <Link
              to={auth.user?.role === 'admin' ? '/admin' : '/chef'}
              className="flex items-center space-x-2 py-2 px-4 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-brand-500 border border-brand-500/20 transition-all font-medium text-sm"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{auth.user?.role === 'admin' ? 'Admin Hub' : 'Chef Kitchen'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-red-400 hover:text-red-300 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center space-x-2 py-2.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium"
          >
            <User className="w-4 h-4 text-slate-400" />
            <span>Staff Portal</span>
          </Link>
        )}
      </div>

      {/* Mobile Toggle */}
      <div className="flex items-center space-x-4 md:hidden">
        <Link
          to="/cart"
          className="relative p-2 rounded-xl bg-white/5 border border-white/5"
        >
          <ShoppingBag className="w-5 h-5 text-white" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-500 text-white font-bold text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-[73px] left-0 w-full glass border-b border-white/10 p-6 flex flex-col space-y-6 md:hidden animate-slide-up">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-4 text-slate-300 hover:text-white font-medium py-2"
              >
                <Icon className="w-5 h-5 text-brand-500" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="h-px bg-white/5 my-2"></div>

          {auth.isAuthenticated ? (
            <div className="flex flex-col space-y-4">
              <Link
                to={auth.user?.role === 'admin' ? '/admin' : '/chef'}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-orange-600/20 text-brand-500 border border-brand-500/20 font-medium text-sm w-full"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{auth.user?.role === 'admin' ? 'Admin Hub' : 'Chef Kitchen'}</span>
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/10 text-sm font-medium w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium w-full"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Staff Portal</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
