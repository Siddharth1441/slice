import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Check, ClipboardList, Flame, Utensils, Award, Search, Sparkles, MessageSquareDot } from 'lucide-react';

export default function TrackOrder() {
  const { socket, backendUrl } = useApp();
  const [searchParams] = useSearchParams();
  
  const [orderIdInput, setOrderIdInput] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusAnimation, setStatusAnimation] = useState(false);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  // Hook up Socket listeners
  useEffect(() => {
    if (!socket || !order) return;

    // Join order room
    socket.emit('joinOrder', order._id);

    // Listen to updates
    const handleStatusUpdate = (updatedOrder) => {
      if (updatedOrder._id === order._id) {
        setOrder(updatedOrder);
        
        // Trigger visual highlight animation
        setStatusAnimation(true);
        setTimeout(() => setStatusAnimation(false), 2000);
      }
    };

    socket.on('orderStatusUpdated', handleStatusUpdate);

    return () => {
      socket.off('orderStatusUpdated', handleStatusUpdate);
    };
  }, [socket, order]);

  const fetchOrder = async (id) => {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      setError('Invalid Order ID format');
      setOrder(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${backendUrl}/api/orders/track/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Order not found');
      }

      setOrder(data);
      setOrderIdInput('');
    } catch (err) {
      setError(err.message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      fetchOrder(orderIdInput.trim());
    }
  };

  // Status mapping
  const statuses = [
    { label: 'Placed', value: 'pending', desc: 'Sent to the kitchen', icon: ClipboardList },
    { label: 'Preparing', value: 'preparing', desc: 'Chef is crafting your meal', icon: Flame },
    { label: 'Ready', value: 'ready', desc: 'Delicious food is ready!', icon: Utensils },
    { label: 'Completed', value: 'completed', desc: 'Delivered and enjoyed', icon: Award },
  ];

  const getStatusIndex = (status) => {
    return statuses.findIndex((s) => s.value === status);
  };

  const activeIndex = order ? getStatusIndex(order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 animate-slide-up">
      {/* Search Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          Track Your <span className="text-gradient-orange">Order Live</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Enter your Order ID to monitor preparation status, chef acceptance, and pickup readiness.
        </p>

        {/* Input box */}
        <form onSubmit={handleSearch} className="relative w-full max-w-lg mx-auto group">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
          <input
            type="text"
            placeholder="Paste your 24-character Order ID here..."
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 pl-12 pr-28 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition-all hover:scale-[1.02]"
          >
            Locate
          </button>
        </form>
      </div>

      {/* Loading & Errors */}
      {loading && (
        <div className="text-center py-10">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Fetching live order status...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-red-400 text-sm mb-6 max-w-lg mx-auto">
          {error}
        </div>
      )}

      {/* Live Order Card */}
      {order && !loading && (
        <div className="space-y-6">
          {/* Order Details & Alert */}
          <div className="glass-premium rounded-3xl p-6 md:p-8 space-y-6 border border-white/5 relative overflow-hidden">
            {statusAnimation && (
              <div className="absolute inset-0 bg-brand-500/5 animate-pulse border border-brand-500 pointer-events-none rounded-3xl"></div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Order ID</span>
                <p className="text-xs sm:text-sm font-mono font-bold text-slate-300">{order._id}</p>
              </div>
              <div className="sm:text-right">
                <span className="text-xs text-slate-500 uppercase font-semibold">Status</span>
                <div className="flex items-center sm:justify-end space-x-1.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${order.status === 'cancelled' ? 'bg-red-500' : 'bg-brand-500 animate-ping'}`}></div>
                  <span className={`text-sm font-extrabold capitalize ${order.status === 'cancelled' ? 'text-red-400' : 'text-brand-500'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Live indicator details */}
            {order.status === 'cancelled' ? (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                This order has been cancelled by the staff. Please contact us for support.
              </div>
            ) : (
              <div className="py-4">
                {/* Desktop timeline tracker */}
                <div className="relative hidden md:flex items-center justify-between">
                  {/* Background progress bar */}
                  <div className="absolute left-0 top-6 w-full h-[3px] bg-white/5 -z-10"></div>
                  
                  {/* Colored progress bar */}
                  <div
                    className="absolute left-0 top-6 h-[3px] bg-gradient-to-r from-brand-600 to-brand-500 -z-10 transition-all duration-1000"
                    style={{ width: `${(activeIndex / (statuses.length - 1)) * 100}%` }}
                  ></div>

                  {/* Steps */}
                  {statuses.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isCompleted = idx < activeIndex;
                    const isActive = idx === activeIndex;

                    return (
                      <div key={step.value} className="flex flex-col items-center w-1/4 text-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                            isCompleted
                              ? 'bg-brand-500 border-brand-500 text-white'
                              : isActive
                              ? 'bg-slate-900 border-brand-500 text-brand-500 shadow-lg shadow-brand-500/20 scale-110'
                              : 'bg-slate-950 border-white/10 text-slate-600'
                          }`}
                        >
                          {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <StepIcon className="w-5 h-5" />}
                        </div>
                        <h4 className={`text-sm font-bold mt-3 ${isActive ? 'text-brand-500' : 'text-slate-300'}`}>
                          {step.label}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-[120px] leading-tight">
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile list timeline tracker */}
                <div className="md:hidden space-y-6 relative pl-8">
                  {/* Progress Line */}
                  <div className="absolute left-4 top-2 bottom-2 w-[2px] bg-white/10"></div>

                  {statuses.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isCompleted = idx < activeIndex;
                    const isActive = idx === activeIndex;

                    return (
                      <div key={step.value} className="relative flex items-start space-x-4">
                        <div
                          className={`absolute -left-7 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                            isCompleted
                              ? 'bg-brand-500 border-brand-500 text-white'
                              : isActive
                              ? 'bg-slate-950 border-brand-500 text-brand-500 scale-110'
                              : 'bg-slate-950 border-white/10 text-slate-600'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <StepIcon className="w-3 h-3" />}
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${isActive ? 'text-brand-500' : 'text-slate-300'}`}>
                            {step.label}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Order Details & Summary */}
          <div className="glass rounded-3xl p-6 md:p-8 border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4">Items Ordered</h3>
            
            <div className="divide-y divide-white/5 space-y-3.5 pb-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex justify-between items-center text-sm pt-3.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-brand-500">x{item.quantity}</span>
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <span className="text-sm text-slate-400 font-medium">Grand Total</span>
              <span className="text-lg font-extrabold text-brand-500">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-between bg-slate-950/40 border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center space-x-3 text-left">
                <MessageSquareDot className="w-6 h-6 text-brand-500 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-white">Need support with this order?</h5>
                  <p className="text-[11px] text-slate-500">Call customer service and quote your Order ID.</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-300 bg-white/5 py-1.5 px-3 rounded-lg border border-white/5">
                📞 +1 234 567 8900
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No Order Located view */}
      {!order && !loading && (
        <div className="text-center py-16 bg-slate-900/30 border border-white/5 rounded-3xl">
          <div className="w-16 h-16 bg-slate-950/80 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-brand-500" />
          </div>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Place an order to see live updates, or enter a valid Order ID in the search bar above.
          </p>
        </div>
      )}
    </div>
  );
}
