import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "expiry" | "lowStock" | "order" | "system" | "sale";
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationItem, "id" | "read" | "createdAt">) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  scheduleExpiryNotification: (medicineName: string, expiryDate: Date) => Promise<void>;
  scheduleLowStockNotification: (medicineName: string, currentStock: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_KEY = "binayak_notifications";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    registerForPushNotifications();
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed.map((n: NotificationItem) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        })));
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const saveNotifications = async (items: NotificationItem[]) => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  };

  const registerForPushNotifications = async () => {
    if (Platform.OS === "web") return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return;
    }
  };

  const addNotification = useCallback(async (notification: Omit<NotificationItem, "id" | "read" | "createdAt">) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date(),
    };

    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    await saveNotifications(updated);

    if (Platform.OS !== "web") {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null,
      });
    }
  }, [notifications]);

  const markAsRead = useCallback(async (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await saveNotifications(updated);
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    await saveNotifications(updated);
  }, [notifications]);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
  }, []);

  const scheduleExpiryNotification = useCallback(async (medicineName: string, expiryDate: Date) => {
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      await addNotification({
        title: "Expiry Alert",
        body: `${medicineName} expires in ${daysUntilExpiry} days`,
        type: "expiry",
        data: { medicineName, expiryDate: expiryDate.toISOString() },
      });
    }
  }, [addNotification]);

  const scheduleLowStockNotification = useCallback(async (medicineName: string, currentStock: number) => {
    await addNotification({
      title: "Low Stock Alert",
      body: `${medicineName} has only ${currentStock} units left`,
      type: "lowStock",
      data: { medicineName, currentStock },
    });
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        scheduleExpiryNotification,
        scheduleLowStockNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
