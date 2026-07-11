import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Plus, Minus, Trash2, ArrowLeft, ArrowRight, ClipboardCheck } from 'lucide-react';

export default function CartView() {
  const { cart, updateCartQuantity, removeFromCart, clearCart, settings, backendUrl, formatCurrency } = useApp();
  const navigate = useNavigate();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Cart calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const delivery = subtotal > 0 ? settings.deliveryCharge : 0;
  const grandTotal = subtotal + delivery;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (cart.length === 0) {
      setValidationError('Your cart is empty');
      return;
    }

    if (!settings.isStoreOpen) {
      setValidationError('The store is currently closed. Order placement is disabled.');
      return;
    }

    if (!customerName.trim()) {
      setValidationError('Please enter your name');
      return;
    }

    // Basic 10 digit or international phone validation
    const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
    if (!phoneRegex.test(customerPhone.trim())) {
      setValidationError('Please enter a valid phone number (10-15 digits)');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: cart.map((item) => ({
          menuItem: item.menuItem,
          quantity: item.quantity,
        })),
      };

      const res = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong while placing your order');
      }

      // Success
      clearCart();
      // Redirect to tracking page
      navigate(`/track?orderId=${data.order._id}`);
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center animate-slide-up">
        <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trash2 className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Your Cart is Empty</h2>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
          Looks like you haven't added anything to your cart yet. Head back to the menu to explore.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-brand-500/20 hover:scale-[1.02] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Menu</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 animate-slide-up">
      <div className="mb-10">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </Link>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4">
          Your <span className="text-gradient-orange">Shopping Cart</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart items list (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          {cart.map((item) => (
            <div
              key={item.menuItem}
              className="glass rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/5"
            >
              {/* Product Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">
                      No Image
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white leading-tight">{item.name}</h4>
                  <span className="text-brand-500 text-sm font-semibold">
                    {formatCurrency(item.price)} each
                  </span>
                </div>
              </div>

              {/* Quantity Counter & Delete */}
              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-white/10 rounded-2xl p-1">
                  <button
                    onClick={() => updateCartQuantity(item.menuItem, item.quantity - 1)}
                    className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-sm w-8 text-center text-white select-none">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.menuItem, item.quantity + 1)}
                    className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right shrink-0 min-w-[70px]">
                  <span className="font-extrabold text-white text-base">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(item.menuItem)}
                  className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Quick Info Box */}
          <div className="p-5 rounded-3xl bg-slate-900/30 border border-white/5 text-slate-400 text-xs leading-relaxed space-y-1">
            <p className="font-semibold text-slate-300">Ordering Guidelines:</p>
            <p>• Cooking starts immediately after the chef accepts the order.</p>
            <p>• You can track progress in real-time on our live status page.</p>
          </div>
        </div>

        {/* Checkout Form & Invoice (Col 5) */}
        <div className="lg:col-span-5 glass-premium rounded-3xl p-6 md:p-8 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-brand-500" />
            <span>Order Summary</span>
          </h3>

          {/* Invoice Breakdown */}
          <div className="space-y-3.5 text-sm border-b border-white/5 pb-5">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-medium text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Delivery Charge</span>
              <span className="font-medium text-white">
                {delivery > 0 ? formatCurrency(delivery) : 'FREE'}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2">
              <span>Grand Total</span>
              <span className="text-xl text-brand-500 font-extrabold">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Customer details form */}
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <h4 className="font-bold text-white text-sm">Customer Details</h4>
            
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-slate-400">Your Full Name</label>
              <input
                id="name"
                type="text"
                required
                disabled={!settings.isStoreOpen}
                placeholder="Enter name (e.g. John Doe)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-500 placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-semibold text-slate-400">Phone Number</label>
              <input
                id="phone"
                type="tel"
                required
                disabled={!settings.isStoreOpen}
                placeholder="Enter 10 digit number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-500 placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>

            {/* Error notifications */}
            {validationError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {validationError}
              </div>
            )}

            {/* Checkout CTA */}
            <button
              type="submit"
              disabled={isSubmitting || !settings.isStoreOpen}
              className={`w-full flex items-center justify-center space-x-2 py-4 rounded-2xl text-base font-bold transition-all shadow-lg ${
                !settings.isStoreOpen
                  ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                  : isSubmitting
                  ? 'bg-brand-500/50 text-white cursor-wait'
                  : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20 hover:scale-[1.01] hover:shadow-xl'
              }`}
            >
              <span>{isSubmitting ? 'Placing Order...' : 'Place Order'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
