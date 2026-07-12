import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Shield, ChefHat, KeyRound, Mail, ArrowRight, UserSquare2, RefreshCw } from 'lucide-react';

export default function LoginPortal() {
  const { loginUser, backendUrl } = useApp();
  const navigate = useNavigate();

  // Navigation / View states
  const [activeTab, setActiveTab] = useState('chef'); // chef or admin
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = request token, 2 = enter token & new password

  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Password Reset Form States
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // UI feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: activeTab }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid username or password');
      }

      // Successful login
      loginUser(data.user, data.token);
      setSuccess('Login successful! Redirecting...');
      
      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/chef');
        }
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: activeTab }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to request password reset');
      }

      setSuccess(`Reset code generated! Code: ${data.resetToken}`);
      setResetToken(data.resetToken); // Pre-fill reset code for easier demo testing
      setResetStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, password: newPassword, role: activeTab }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess('Password updated successfully! Please login.');
      setTimeout(() => {
        setIsForgotMode(false);
        setResetStep(1);
        setEmail('');
        setNewPassword('');
        setResetToken('');
        setPassword('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 md:py-24 animate-slide-up">
      <div className="glass-premium rounded-3xl p-8 border border-border relative overflow-hidden shadow-2xl">
        {/* Decorative lights */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl"></div>
        
        {/* Tabs for Admin / Chef */}
        {!isForgotMode && (
          <div className="flex bg-surface p-1 rounded-2xl mb-8 border border-border">
            <button
              onClick={() => {
                setActiveTab('chef');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'chef'
                  ? 'bg-white text-brand-500 border border-brand-500/20 shadow-md'
                  : 'text-muted hover:text-heading'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Chef Kitchen</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-brand-500 border border-brand-500/20 shadow-md'
                  : 'text-muted hover:text-heading'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-display text-heading">
            {isForgotMode
              ? 'Reset Staff Password'
              : activeTab === 'admin'
              ? 'Admin Login'
              : 'Chef Login'}
          </h2>
          <p className="text-xs text-muted mt-1">
            {isForgotMode
              ? `Verification for ${activeTab.toUpperCase()}`
              : `Access the ${activeTab.toUpperCase()} dashboard portal`}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold break-all">
            {success}
          </div>
        )}

        {/* Login Form */}
        {!isForgotMode && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted">Username</label>
              <div className="relative">
                <UserSquare2 className="absolute left-4 top-3.5 w-4 h-4 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. chef or admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface border border-border rounded-2xl py-3 pl-12 pr-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-muted">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-xs text-brand-500 hover:text-brand-600 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-4 top-3.5 w-4 h-4 text-muted" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-2xl py-3 pl-12 pr-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20 hover:scale-[1.01] transition-all"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Password Reset Flows */}
        {isForgotMode && (
          <div>
            {resetStep === 1 ? (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-muted" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. chef@food.com or admin@food.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl py-3 pl-12 pr-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all"
                >
                  <span>{loading ? 'Requesting...' : 'Request Reset Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted">Verification Code</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter generated code"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full bg-surface border border-border rounded-2xl py-3 px-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-surface border border-border rounded-2xl py-3 px-4 text-sm text-heading focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{loading ? 'Resetting...' : 'Change Password'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Seeding credentials tip */}
        <div className="mt-8 pt-6 border-t border-border text-[11px] text-body leading-relaxed text-center space-y-1">
          <p className="font-semibold text-heading">Default Sandbox Credentials:</p>
          <p>• Chef: <span className="text-muted">chef</span> / <span className="text-muted">chef123</span> (email: chef@food.com)</p>
          <p>• Admin: <span className="text-muted">admin</span> / <span className="text-muted">admin123</span> (email: admin@food.com)</p>
        </div>
      </div>
    </div>
  );
}
