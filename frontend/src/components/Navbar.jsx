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
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-brand-100/70 shadow-sm shadow-brand-500/5">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 select-none">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center shadow-brand-500/20 shadow-lg">
            <img className="w-7 h-7 rounded-xl" src="https://ik.imagekit.io/boks6a8adw/logo.jpg" alt="Cheesy Slice logo" />
          </div>
          <div className="space-y-0.5">
            <p className="text-base font-semibold tracking-tight text-heading">Cheesy Slice</p>
            <p className="text-xs text-muted uppercase tracking-[0.2em]">Pizza</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative inline-flex items-center justify-center rounded-2xl border border-border bg-brand-50 p-3 text-brand-600 transition-all hover:bg-brand-100"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white px-1.5">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            to="/login"
            className="hidden sm:inline-flex items-center justify-center rounded-2xl border border-brand-100 bg-white px-4 py-2 text-sm font-semibold text-heading transition-all hover:border-brand-200 hover:shadow-sm"
          >
            Staff Portal
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 lg:hidden"
            aria-label="Open navigation menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden border-t border-brand-100/70 bg-white/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 space-y-3">
            <Link to="/login" onClick={() => setIsOpen(false)} className="block rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-600 text-center">
              Staff Portal
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
