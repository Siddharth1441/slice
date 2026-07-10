import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, ShoppingCart, Info, Award } from 'lucide-react';

export default function MenuView() {
  const { addToCart, settings, backendUrl, formatCurrency } = useApp();
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedItemIds, setAddedItemIds] = useState({});

  useEffect(() => {
    fetchMenu();
  }, [selectedCategory, searchQuery]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      let url = `${backendUrl}/api/menu?availability=true`;
      if (selectedCategory && selectedCategory !== 'All') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load menu items');
      
      const data = await res.json();
      setMenu(data);

      // Extract unique categories for filter tabs (only run once or when full list is loaded)
      if (selectedCategory === 'All' && !searchQuery) {
        const uniqueCats = ['All', ...new Set(data.map((item) => item.category))];
        setCategories(uniqueCats);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    
    // Toggle added visual feedback
    setAddedItemIds((prev) => ({ ...prev, [item._id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item._id]: false }));
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      {/* Announcement Banner */}
      {settings.announcement && settings.announcement !== 'Welcome to Antigravity Foods! Enjoy our chef-crafted delights.' && (
        <div className="mb-10 p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center space-x-3 text-orange-200 text-sm animate-pulse-slow">
          <Info className="w-5 h-5 text-brand-500 shrink-0" />
          <span>{settings.announcement}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-brand-500 text-xs font-semibold uppercase tracking-wider mb-4">
          <Award className="w-4 h-4" />
          <span>Chef-Crafted Gastronomy</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Satisfy Your <span className="text-gradient-orange">Cravings</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
          Welcome to <span className="text-white font-medium">{settings.storeName}</span>. Browse our curated selection of fresh ingredients, flame-grilled classics, and custom chef specials.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-10">
        {/* Search */}
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
          <input
            type="text"
            placeholder="Search menu items (e.g. Pizza, Burger)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto w-full md:w-auto no-scrollbar py-2 -mx-6 px-6 md:mx-0 md:px-0 space-x-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
                selectedCategory === cat
                  ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Store Closed Warning */}
      {!settings.isStoreOpen && (
        <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-red-400 font-semibold mb-1">Store is Currently Closed</p>
          <p className="text-slate-400 text-xs">You can still browse the menu, but ordering is temporarily disabled.</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-400 text-lg mb-4">Error loading menu: {error}</p>
          <button
            onClick={fetchMenu}
            className="px-6 py-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="glass-premium rounded-3xl p-5 animate-pulse space-y-4">
              <div className="w-full aspect-video bg-slate-800 rounded-2xl"></div>
              <div className="h-6 bg-slate-800 rounded w-2/3"></div>
              <div className="h-4 bg-slate-800 rounded w-5/6"></div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 bg-slate-800 rounded w-1/4"></div>
                <div className="h-10 bg-slate-800 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : menu.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 border border-white/5 rounded-3xl">
          <p className="text-slate-400 text-lg mb-2">No menu items found</p>
          <p className="text-slate-500 text-sm">Try modifying your category selection or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menu.map((item) => (
            <div
              key={item._id}
              className="glass-premium rounded-3xl p-5 flex flex-col justify-between group hover:border-brand-500/30 transition-all duration-300 hover:translate-y-[-4px]"
            >
              {/* Product Header / Image */}
              <div className="space-y-4">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/5">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
                      No Image Available
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-xl text-xs font-semibold text-slate-300 uppercase">
                    {item.category}
                  </span>
                </div>

                {/* Product Text */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-500 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Product Footer */}
              <div className="flex items-center justify-between pt-5 mt-5 border-t border-white/5">
                <span className="text-xl font-extrabold text-white">
                  {formatCurrency(item.price)}
                </span>
                
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={!settings.isStoreOpen || !item.isAvailable}
                  className={`flex items-center space-x-2 py-2.5 px-5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                    !settings.isStoreOpen || !item.isAvailable
                      ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                      : addedItemIds[item._id]
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 hover:scale-[1.02]'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {!item.isAvailable
                      ? 'Sold Out'
                      : !settings.isStoreOpen
                      ? 'Closed'
                      : addedItemIds[item._id]
                      ? 'Added! ✓'
                      : 'Add to Cart'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
