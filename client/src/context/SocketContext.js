// SocketContext.js
// This creates a "shared socket" that any component in the app can access.
// Without context, you'd have to pass the socket as a prop through every component.

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export function SocketProvider({ children }) {
  // useRef keeps the socket stable - it won't re-create on every render
  const socketRef = useRef(null);

  if (!socketRef.current) {
    console.log('🔌 Initializing socket connection to:', SERVER_URL);
    socketRef.current = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      forceNew: false,
      rejectUnauthorized: false // For self-signed certs in development
    });

    // Add connection event logging
    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message || error);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('⚠️ Socket disconnected:', reason);
    });

    socketRef.current.on('reconnect_attempt', () => {
      console.log('🔄 Reconnecting to server...');
    });

    socketRef.current.on('reconnect', () => {
      console.log('✅ Reconnected to server');
    });
  }

  useEffect(() => {
    // Clean up socket connection when app unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook: any component can call useSocket() to get the socket
export function useSocket() {
  return useContext(SocketContext);
}
