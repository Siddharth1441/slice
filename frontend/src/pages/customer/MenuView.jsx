import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  const storeStatusLabel = settings.isStoreOpen ? 'Store is open' : 'Store is closed';
  const announcementText = settings.announcement?.trim();
  const showAnnouncement = announcementText && !['Store is open', 'Store is closed'].includes(announcementText);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-8 md:py-14">
      <section className="relative overflow-hidden rounded-[3rem] bg-white shadow-[0_30px_70px_rgba(255,122,26,0.15)] border border-brand-100/80">
        <div className="absolute inset-x-0 top-0 h-64 sm:h-72 bg-brand-50/80" />
        <div className="absolute right-0 top-0 h-64 w-64 sm:h-72 sm:w-72 md:h-80 md:w-80 rounded-full bg-brand-100/80 blur-3xl" />
        <div className="relative px-5 py-8 sm:px-6 md:px-10 lg:px-14 md:py-12">
          <div className="text-center mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-600 shadow-sm">
              <Award className="w-4 h-4" />
              Premium chef-crafted · Made fresh daily
            </span>
            <h1 className="mt-8 text-3xl sm:text-4xl md:text-5xl lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.02] text-heading">
              Satisfy Your <span className="text-gradient-orange">Cravings</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-body max-w-xl sm:max-w-2xl mx-auto leading-7 sm:leading-8">
              Wood-fired pizzas, juicy burgers and handmade pasta — delivered warm, fast and full of flavor. Your next favorite bite is one tap away.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4">
              <span className={`inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold ${settings.isStoreOpen ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                {storeStatusLabel}
              </span>

              {showAnnouncement && (
                <div className={`rounded-3xl border px-5 py-3 text-sm font-medium ${settings.isStoreOpen ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}>
                  {announcementText}
                </div>
              )}
            </div>

            <div className="mt-8 w-full max-w-full sm:max-w-3xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search pizzas, burgers, pasta, drinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-card w-full rounded-full border border-border bg-white/95 py-4 pl-14 pr-5 text-sm sm:text-base text-heading placeholder:text-muted shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-50/80 p-4 sm:p-5 shadow-[0_18px_50px_rgba(255,122,26,0.12)] border border-brand-100/80 w-full">
          <p className="text-xs sm:text-sm uppercase tracking-[0.22em] text-brand-500">Browse by category</p>
          <div className="mt-4 flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white text-heading/90 hover:bg-brand-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Store Closed Warning */}
      {!settings.isStoreOpen && (
        <div className="mt-8 rounded-3xl bg-error/10 border border-error/20 p-5 text-center">
          <p className="text-error font-semibold mb-1">Store is Currently Closed</p>
          <p className="text-body text-xs">You can still browse the menu, but ordering is temporarily disabled.</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-error text-lg mb-4">Error loading menu: {error}</p>
          <button
            onClick={fetchMenu}
            className="px-6 py-2 rounded-2xl bg-card border border-border hover:bg-surface text-heading"
          >
            Retry
          </button>
        </div>
      )}

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="glass-premium rounded-3xl p-5 animate-pulse space-y-4">
              <div className="w-full aspect-video bg-surface rounded-2xl"></div>
              <div className="h-6 bg-surface rounded w-2/3"></div>
              <div className="h-4 bg-surface rounded w-5/6"></div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 bg-surface rounded w-1/4"></div>
                <div className="h-10 bg-surface rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : menu.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-3xl mt-10">
          <p className="text-body text-lg mb-2">No menu items found</p>
          <p className="text-muted text-sm">Try modifying your category selection or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {menu.map((item) => (
            <div
              key={item._id}
              className="glass-premium rounded-3xl p-5 flex flex-col justify-between group hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Product Header / Image */}
              <div className="space-y-4">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface border border-border">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted bg-surface">
                      No Image Available
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-border px-3 py-1 rounded-xl text-xs font-semibold text-heading uppercase">
                    {item.category}
                  </span>
                </div>

                {/* Product Text */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-heading group-hover:text-brand-500 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-body line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Product Footer */}
              <div className="flex items-center justify-between pt-5 mt-5 border-t border-border">
                <span className="text-xl font-extrabold text-heading">
                  {formatCurrency(item.price)}
                </span>
                
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={!settings.isStoreOpen || !item.isAvailable}
                  className={`flex items-center space-x-2 py-2.5 px-5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                    !settings.isStoreOpen || !item.isAvailable
                      ? 'bg-card text-muted border border-border cursor-not-allowed'
                      : addedItemIds[item._id]
                      ? 'bg-success text-card shadow-lg shadow-success/20'
                      : 'bg-brand-500 hover:bg-brand-600 text-card shadow-lg shadow-brand-500/20 hover:scale-[1.02]'
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
