'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export const API_BASE = '';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync with native Android app if running inside WebView
  const syncWithNativeApp = (userData, authToken) => {
    if (typeof window !== 'undefined' && userData?._id) {
      if (window.ApexNative?.saveAuthToken) {
        try {
          window.ApexNative.saveAuthToken(userData._id.toString(), authToken || '');
        } catch (e) {}
      }
      if (window.ApexNative?.getFcmToken) {
        try {
          const nativeFcmToken = window.ApexNative.getFcmToken();
          if (nativeFcmToken && typeof nativeFcmToken === 'string' && nativeFcmToken.trim().length > 10) {
            fetch(`${API_BASE}/api/auth/save-fcm-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
              },
              body: JSON.stringify({
                token: nativeFcmToken,
                app_type: 'user',
                device_os: 'android',
                user_id: userData._id.toString()
              })
            }).catch(() => {});
          }
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('apextrade_token');
    const savedUser = localStorage.getItem('apextrade_user');

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          syncWithNativeApp(parsed, savedToken);
        } catch (e) {}
      }
      fetchProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (authToken) => {
    const activeToken = authToken || token || localStorage.getItem('apextrade_token');
    if (!activeToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('apextrade_user', JSON.stringify(data.user));
        syncWithNativeApp(data.user, activeToken);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('apextrade_token', newToken);
    localStorage.setItem('apextrade_user', JSON.stringify(userData));
    syncWithNativeApp(userData, newToken);
    fetchProfile(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('apextrade_token');
    localStorage.removeItem('apextrade_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

