import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [queueUpdates, setQueueUpdates] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          userId: user._id,
          role: user.role
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        
        // Join appropriate rooms based on user role
        if (user.role === 'doctor') {
          newSocket.emit('join-doctor', user._id);
        }
        
        // Join queue updates room for all users
        newSocket.emit('join-queue');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      // Listen for queue updates
      newSocket.on('queue-updated', (data) => {
        console.log('Queue updated:', data);
        setQueueUpdates(prev => [...prev, data]);
      });

      // Listen for next patient notification (doctors only)
      newSocket.on('next-patient', (patient) => {
        console.log('Next patient:', patient);
        // This can be handled by individual components
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const joinQueue = (campId) => {
    if (socket) {
      socket.emit('join-queue', { campId });
    }
  };

  const leaveQueue = (campId) => {
    if (socket) {
      socket.emit('leave-queue', { campId });
    }
  };

  const emitQueueUpdate = (data) => {
    if (socket) {
      socket.emit('queue-update', data);
    }
  };

  const clearQueueUpdates = () => {
    setQueueUpdates([]);
  };

  const value = {
    socket,
    connected,
    queueUpdates,
    joinQueue,
    leaveQueue,
    emitQueueUpdate,
    clearQueueUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};