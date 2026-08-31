import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [pairs, setPairs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Only attempt socket connection if we have a direct backend host or custom VITE_API_URL
    const isNetlifyDomain = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app') && !import.meta.env.VITE_API_URL;

    let socket = null;

    if (!isNetlifyDomain && API_BASE) {
      try {
        socket = io(API_BASE, {
          transports: ['websocket', 'polling'],
          auth: { token },
          reconnectionAttempts: 3,
          timeout: 5000
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          setIsConnected(true);
          socket.emit('trading:subscribe');
          if (user?.id) {
            socket.emit('identify', { userId: user.id, token });
          }
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
        });

        socket.on('connect_error', () => {
          setIsConnected(false);
        });

        socket.on('trading:pairs:update', (payload) => {
          if (payload && payload.success && Array.isArray(payload.data)) {
            setPairs(payload.data);
          }
        });
      } catch (err) {
        console.warn('Socket connection skipped/failed:', err);
      }
    }

    // Reliable HTTP Polling Fallback (Works 100% on Netlify, Render, and Localhost)
    const fetchTradingPairs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/trading-pairs`);
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data && data.success && Array.isArray(data.data)) {
            setPairs(data.data);
          }
        } catch (jsonErr) {
          // Ignore HTML response if route is still initializing
        }
      } catch (e) {}
    };

    fetchTradingPairs();
    const interval = setInterval(fetchTradingPairs, 3000);

    return () => {
      clearInterval(interval);
      if (socket) {
        try {
          socket.emit('trading:unsubscribe');
          socket.disconnect();
        } catch (e) {}
      }
    };
  }, [token, user?.id]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, pairs, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
