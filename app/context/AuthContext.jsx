'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export const API_BASE = '';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('apextrade_token');
    const savedUser = localStorage.getItem('apextrade_user');

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
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
