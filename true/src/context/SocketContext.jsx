import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});

  // Main chat WebSocket handlers
  const chatHandlers = {
    connection_established: (data) => {
      console.log('Chat WebSocket connected:', data.message);
    },
    message: (data) => {},
    typing: (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.room_id]: {
          ...prev[data.room_id],
          [data.user_id]: data.is_typing ? data.username : null
        }
      }));
    },
    user_joined: (data) => console.log(`${data.username} joined the room`),
    user_left: (data) => console.log(`${data.username} left the room`),
    user_status: (data) => {
      if (data.is_online) {
        setOnlineUsers(prev => new Set([...prev, data.user_id]));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.user_id);
          return newSet;
        });
      }
    }
  };

  // Notification handlers
  const notificationHandlers = {
    notification: (data) => {
      setNotifications(prev => [
        ...prev,
        {
          id: Date.now(),
          title: data.title,
          message: data.message,
          type: data.notification_type,
          timestamp: data.timestamp || new Date().toISOString()
        }
      ]);
    }
  };

  // FIXED VERSION — uses import.meta.env for Vite
  const getWebSocketUrl = useCallback((endpoint) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = import.meta.env.VITE_WS_HOST || "localhost:8000";
    return `${protocol}//${host}/ws${endpoint}`;
  }, []);

  // Initialize WebSocket connections
  const chatSocket = useWebSocket(getWebSocketUrl('/chat/'), chatHandlers);
  const notificationSocket = useWebSocket(getWebSocketUrl('/notifications/'), notificationHandlers);

  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(prev => ({ ...prev }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    chat: {
      ...chatSocket,
      onlineUsers,
      typingUsers,
      isChatConnected: chatSocket.isConnected
    },
    notifications: {
      socket: notificationSocket,
      notifications,
      clearNotification,
      clearAllNotifications,
      isNotificationConnected: notificationSocket.isConnected
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
