import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const backendUrl = 'https://slice-2.onrender.com';

  // State Declarations
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('food_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [auth, setAuth] = useState(() => {
    const savedUser = localStorage.getItem('user_profile');
    const savedToken = localStorage.getItem('auth_token');
    return {
      token: savedToken || null,
      user: savedUser ? JSON.parse(savedUser) : null,
      isAuthenticated: !!savedToken,
    };
  });

  const [settings, setSettings] = useState({
    storeName: 'Antigravity Foods',
    isStoreOpen: true,
    taxRate: 5,
    deliveryCharge: 0,
    contactPhone: '+1 234 567 8900',
    announcement: '',
  });

  const [socket, setSocket] = useState(null);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Synchronize cart with localStorage
  useEffect(() => {
    localStorage.setItem('food_cart', JSON.stringify(cart));
  }, [cart]);

  // Synchronize auth with localStorage
  useEffect(() => {
    if (auth.token) {
      localStorage.setItem('auth_token', auth.token);
      localStorage.setItem('user_profile', JSON.stringify(auth.user));
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
    }
  }, [auth]);

  // Load Settings on Start
  useEffect(() => {
    fetchSettings();
  }, []);

  // Initialize Socket.io Connection
  useEffect(() => {
    const newSocket = io(backendUrl, {
      autoConnect: true,
    });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  // API Request Wrapper with Auto Refresh on Token Expiry
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    }

    let res = await fetch(`${backendUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // Check for expired token
    if (res.status === 401) {
      try {
        // Try refreshing token
        const refreshRes = await fetch(`${backendUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          // Update auth state
          setAuth({
            token: refreshData.token,
            user: refreshData.user,
            isAuthenticated: true,
          });

          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${refreshData.token}`;
          res = await fetch(`${backendUrl}${endpoint}`, {
            ...options,
            headers,
          });
        } else {
          // Refresh failed - logout
          logoutUser();
        }
      } catch (err) {
        console.error('Error during token refresh:', err);
        logoutUser();
      }
    }

    return res;
  };

  // Cart Operations
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.menuItem === item._id);
      if (existing) {
        return prevCart.map((i) =>
          i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prevCart,
        {
          menuItem: item._id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((i) => i.menuItem !== itemId));
  };

  const updateCartQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((i) => (i.menuItem === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Auth Operations
  const loginUser = (userData, token) => {
    setAuth({
      token,
      user: userData,
      isAuthenticated: true,
    });
  };

  const logoutUser = async () => {
    try {
      await fetch(`${backendUrl}/api/auth/logout`, { method: 'POST' });
    } catch (err) {
      console.error('Logout request error:', err);
    }
    setAuth({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  };

  const updateProfile = (updatedUser) => {
    setAuth((prev) => ({
      ...prev,
      user: { ...prev.user, ...updatedUser },
    }));
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        auth,
        loginUser,
        logoutUser,
        updateProfile,
        settings,
        fetchSettings,
        socket,
        apiFetch,
        formatCurrency,
        backendUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
