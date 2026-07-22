import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ChefHat, Play, CheckCircle, Clock, Volume2, VolumeX, LogOut } from 'lucide-react';

export default function ChefDashboard() {
  const { auth, logoutUser, socket, apiFetch } = useApp();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Secure route check
  useEffect(() => {
    if (!auth.isAuthenticated || auth.user?.role !== 'chef') {
      navigate('/login');
    }
  }, [auth, navigate]);

  // Load active orders on load
  useEffect(() => {
    fetchOrders();
  }, []);

  // WebSockets live updates
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      // Add new order to top of list if it is pending
      setOrders((prev) => [newOrder, ...prev]);
      
      // Play Synthesized Notification Tone
      if (soundEnabled) {
        playNotificationSound();
      }
    };

    const handleOrderUpdated = (updatedOrder) => {
      setOrders((prev) => {
        // If order was cancelled or completed, remove it from the active kitchen view
        if (['completed', 'cancelled'].includes(updatedOrder.status)) {
          return prev.filter((o) => o._id !== updatedOrder._id);
        }
        
        // Otherwise, update its status
        return prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o));
      });
    };

    socket.on('orderCreated', handleNewOrder);
    socket.on('orderUpdated', handleOrderUpdated);

    return () => {
      socket.off('orderCreated', handleNewOrder);
      socket.off('orderUpdated', handleOrderUpdated);
    };
  }, [socket, soundEnabled]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/orders');
      if (!res.ok) throw new Error('Could not retrieve kitchen orders');
      
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Synthesize notification sound using Web Audio API (no external file needed!)
  const playNotificationSound = () => {
    try {
      // Haptic Vibration - Max intensity pattern
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 300]); // 5 vibration pulses
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Tone 1 - Increased volume and duration
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 523.25; // C5
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05); // Increased to 0.5 (max volume)
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8); // Extended to 0.8s
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.8); // Duration increased from 0.35s to 0.8s

      // Tone 2 (Higher) - Increased volume and duration
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 659.25; // E5
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05); // Increased to 0.5 (max volume)
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8); // Extended to 0.8s
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.8); // Duration increased from 0.35s to 0.8s
      }, 150);

      // Tone 3 (Highest) - Added extra tone for more intensity
      setTimeout(() => {
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.frequency.value = 783.99; // G5
        osc3.type = 'sine';
        gain3.gain.setValueAtTime(0, ctx.currentTime);
        gain3.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.05);
        gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc3.start(ctx.currentTime);
        osc3.stop(ctx.currentTime + 0.6);
      }, 300);
    } catch (err) {
      console.warn('Audio Context block:', err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update order');
      }
      
      // Update local state directly
      const data = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? data.order : o))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  // Grouping orders for stats
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  if (!auth.isAuthenticated || auth.user?.role !== 'chef') return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 animate-slide-up">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10 pb-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-heading">
              Kitchen <span className="text-gradient-chef">Console</span>
            </h1>
            <p className="text-xs text-muted">
              Logged in as chef: <span className="text-body font-semibold">@{auth.user.username}</span>
            </p>
          </div>
        </div>

        {/* Console Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all flex items-center space-x-2 text-xs font-semibold ${
              soundEnabled
                ? 'bg-sky-600/10 border-sky-500/20 text-sky-400 hover:bg-sky-600/20'
                : 'bg-surface border-border text-body hover:bg-surface/90'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Alerts On' : 'Alerts Muted'}</span>
          </button>
          <button
            onClick={async () => {
              await logoutUser();
              navigate('/');
            }}
            className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-red-400 flex items-center space-x-2 text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Queue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass rounded-2xl p-5 border border-border">
          <span className="text-xs text-muted font-medium">Incoming (Pending)</span>
          <h4 className="text-3xl font-black mt-2 text-heading">{pendingOrders.length}</h4>
        </div>
        <div className="glass rounded-2xl p-5 border border-border">
          <span className="text-xs text-sky-400 font-medium">Active (Preparing)</span>
          <h4 className="text-3xl font-black mt-2 text-sky-400">{preparingOrders.length}</h4>
        </div>
        <div className="glass rounded-2xl p-5 border border-border">
          <span className="text-xs text-emerald-400 font-medium">Ready (Awaiting Delivery)</span>
          <h4 className="text-3xl font-black mt-2 text-emerald-400">{readyOrders.length}</h4>
        </div>
      </div>

      {/* Main Order Queue Layout */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted text-sm">Synchronizing live queue...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-surface/80 border border-border rounded-3xl">
          <p className="text-body text-lg mb-2">Kitchen Queue is Empty</p>
          <p className="text-muted text-sm">New customer orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {orders.map((order) => (
            <div
              key={order._id}
              className={`glass-premium rounded-3xl p-6 flex flex-col justify-between border transition-all duration-300 relative ${
                order.status === 'pending'
                  ? 'border-brand-500/20 shadow-lg shadow-brand-500/5 animate-pulse-slow'
                  : order.status === 'preparing'
                  ? 'border-sky-500/20 shadow-lg shadow-sky-500/5'
                  : 'border-emerald-500/10'
              }`}
            >
              {/* Order Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-muted uppercase font-semibold">Order ID</span>
                    <h5 className="font-mono text-[11px] font-bold text-muted">{order._id.substring(18)}</h5>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                      order.status === 'pending'
                        ? 'bg-brand-500/10 border-brand-500/20 text-brand-500'
                        : order.status === 'preparing'
                        ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-heading leading-tight">{order.customerName}</h4>
                  <p className="text-xs text-muted flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-muted" />
                    <span>Ordered {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>

                {/* Items List */}
                <div className="bg-surface/90 rounded-2xl p-4 border border-border">
                  <span className="text-[10px] text-muted font-semibold block mb-2 uppercase tracking-wide">Menu Items</span>
                  <ul className="space-y-2 text-sm">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-body">
                        <span className="font-semibold text-heading">
                          x{item.quantity} <span className="font-normal text-body ml-1.5">{item.name}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-5 border-t border-border flex gap-3">
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(order._id, 'preparing')}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/10 transition-all hover:scale-[1.01]"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Accept Order</span>
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => handleUpdateStatus(order._id, 'ready')}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-lg shadow-sky-500/10 transition-all hover:scale-[1.01]"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark as Ready</span>
                  </button>
                )}
                {order.status === 'ready' && (
                  <div className="w-full text-center py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    Awaiting Handover
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
