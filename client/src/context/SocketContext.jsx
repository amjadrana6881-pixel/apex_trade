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
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      auth: { token }
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

    socket.on('trading:pairs:update', (payload) => {
      if (payload && payload.success && Array.isArray(payload.data)) {
        setPairs(payload.data);
      }
    });

    // Fallback fetch if socket is delayed
    const fetchInitial = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/trading-pairs`);
        const data = await res.json();
        if (data.success && data.data) {
          setPairs(data.data);
        }
      } catch (e) {
        console.warn('Fallback pairs fetch failed:', e);
      }
    };
    fetchInitial();

    return () => {
      socket.emit('trading:unsubscribe');
      socket.disconnect();
    };
  }, [token, user?.id]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, pairs, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
