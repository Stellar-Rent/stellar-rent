import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BookingUpdate,
  MessageUpdate,
  Notification,
  PaymentUpdate,
  RealTimeUpdate,
} from '../types/shared';

interface UseRealTimeUpdatesProps {
  userId?: string;
  onBookingUpdate?: (data: BookingUpdate) => void;
  onPaymentUpdate?: (data: PaymentUpdate) => void;
  onNotificationUpdate?: (data: Notification) => void;
  onMessageUpdate?: (data: MessageUpdate) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export const useRealTimeUpdates = ({
  userId,
  onBookingUpdate,
  onPaymentUpdate,
  onNotificationUpdate,
  onMessageUpdate,
  onError,
  enabled = true,
}: UseRealTimeUpdatesProps) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isSimulationConnectedRef = useRef(false);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  const connect = useCallback(() => {
    if (!enabled || !userId) return;

    try {
      // In a real implementation, you would connect to your WebSocket server
      // For now, we'll simulate WebSocket behavior
      const _wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://localhost:3001/ws';

      // Simulate WebSocket connection
      console.log('🔌 Connecting to real-time updates...');

      // Simulate connection success
      setTimeout(() => {
        console.log('✅ Connected to real-time updates');
        reconnectAttemptsRef.current = 0;
        isSimulationConnectedRef.current = true;
      }, 100);

      // Simulate incoming messages
      const simulateMessages = () => {
        const messages = [
          {
            type: 'booking',
            data: {
              id: 'booking-123',
              status: 'confirmed',
              propertyTitle: 'Luxury Apartment',
              checkIn: '2025-06-15',
              checkOut: '2025-06-20',
            },
          },
          {
            type: 'payment',
            data: {
              id: 'payment-456',
              amount: 250,
              status: 'completed',
              bookingId: 'booking-123',
            },
          },
          {
            type: 'notification',
            data: {
              id: 'notif-789',
              title: 'New Booking Request',
              message: 'You have a new booking request for Luxury Apartment',
              priority: 'medium',
            },
          },
        ];

        // Send a random message every 10-30 seconds
        const sendRandomMessage = () => {
          const message = messages[Math.floor(Math.random() * messages.length)];
          const update: RealTimeUpdate = {
            ...message,
            timestamp: new Date(),
          };

          handleMessage(update);

          // Schedule next message
          const nextDelay = Math.random() * 20000 + 10000; // 10-30 seconds
          setTimeout(sendRandomMessage, nextDelay);
        };

        // Start sending messages after initial delay
        setTimeout(sendRandomMessage, 5000);
      };

      simulateMessages();
    } catch (error) {
      console.error('❌ Failed to connect to real-time updates:', error);
      onError?.(error as Error);
      scheduleReconnect();
    }
  }, [enabled, userId, onError]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    // Reset simulation connection state
    isSimulationConnectedRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    console.log('🔌 Disconnected from real-time updates');
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = reconnectDelay * 2 ** reconnectAttemptsRef.current;
    reconnectAttemptsRef.current++;

    console.log(
      `🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const handleMessage = useCallback(
    (update: RealTimeUpdate) => {
      console.log('📨 Received real-time update:', update);

      switch (update.type) {
        case 'booking':
          onBookingUpdate?.(update.data);
          break;
        case 'payment':
          onPaymentUpdate?.(update.data);
          break;
        case 'notification':
          onNotificationUpdate?.(update.data);
          break;
        case 'message':
          onMessageUpdate?.(update.data);
          break;
        default:
          console.warn('⚠️ Unknown update type:', update.type);
      }
    },
    [onBookingUpdate, onPaymentUpdate, onNotificationUpdate, onMessageUpdate]
  );

  const sendMessage = useCallback((message: RealTimeUpdate) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }, []);

  // Connection management
  useEffect(() => {
    if (enabled && userId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, userId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN || isSimulationConnectedRef.current,
    sendMessage,
    connect,
    disconnect,
  };
};

// Hook for managing real-time notifications
export const useRealTimeNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Notification) => {
    const newNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/logo.png',
      });
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  const deleteAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Set up real-time updates for notifications
  useRealTimeUpdates({
    userId,
    onNotificationUpdate: addNotification,
    enabled: !!userId,
  });

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
};

// Hook for managing real-time booking updates
export const useRealTimeBookings = (userId?: string) => {
  const [bookings, setBookings] = useState<BookingUpdate[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const updateBooking = useCallback((bookingData: BookingUpdate) => {
    setBookings((prev) => {
      const existingIndex = prev.findIndex((b) => b.id === bookingData.id);
      if (existingIndex >= 0) {
        // Update existing booking
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...bookingData };
        return updated;
      }
      // Add new booking
      return [...prev, bookingData];
    });
    setLastUpdate(new Date());
  }, []);

  const removeBooking = useCallback((bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    setLastUpdate(new Date());
  }, []);

  // Set up real-time updates for bookings
  useRealTimeUpdates({
    userId,
    onBookingUpdate: updateBooking,
    enabled: !!userId,
  });

  return {
    bookings,
    lastUpdate,
    updateBooking,
    removeBooking,
  };
};
