import { useState, useCallback, useRef, useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationData {
  [key: string]: unknown;
}

interface LocalNotification {
  title: string;
  body: string;
  data?: NotificationData;
  trigger?: Notifications.NotificationTriggerInput;
}

interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  categories: {
    orders: boolean;
    inventory: boolean;
    promotions: boolean;
    reminders: boolean;
  };
}

interface UseNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  permissions: Notifications.NotificationPermissionsStatus | null;
  preferences: NotificationPreferences;
  isRegistered: boolean;
  scheduleNotification: (notification: LocalNotification) => Promise<string>;
  cancelNotification: (id: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  getScheduledNotifications: () => Promise<Notifications.NotificationRequest[]>;
  setBadgeCount: (count: number) => Promise<void>;
  getBadgeCount: () => Promise<number>;
  requestPermissions: () => Promise<boolean>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  addNotificationListener: (
    callback: (notification: Notifications.Notification) => void
  ) => () => void;
  addResponseListener: (
    callback: (response: Notifications.NotificationResponse) => void
  ) => () => void;
}

const PREFERENCES_KEY = "notification_preferences";

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  sound: true,
  vibration: true,
  badge: true,
  categories: {
    orders: true,
    inventory: true,
    promotions: true,
    reminders: true,
  },
};

export function useNotifications(): UseNotificationsResult {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(
    null
  );
  const [permissions, setPermissions] =
    useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [isRegistered, setIsRegistered] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
        if (stored) {
          setPreferences(JSON.parse(stored));
        }
      } catch {
      }
    };
    loadPreferences();
  }, []);

  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    if (Platform.OS === "web") {
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return null;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#4A90A4",
        });

        await Notifications.setNotificationChannelAsync("orders", {
          name: "Orders",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#22C55E",
        });

        await Notifications.setNotificationChannelAsync("inventory", {
          name: "Inventory Alerts",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#EF4444",
        });

        await Notifications.setNotificationChannelAsync("reminders", {
          name: "Reminders",
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: "#F59E0B",
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "binayak-pharmacy",
      });
      return tokenData.data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    registerForPushNotifications().then((token) => {
      setExpoPushToken(token);
      setIsRegistered(!!token);
    });

    Notifications.getPermissionsAsync().then(setPermissions);

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      () => {
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [registerForPushNotifications]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    const perms = await Notifications.getPermissionsAsync();
    setPermissions(perms);
    return status === "granted";
  }, []);

  const scheduleNotification = useCallback(
    async (notification: LocalNotification): Promise<string> => {
      if (!preferences.enabled) {
        throw new Error("Notifications are disabled");
      }

      const content: Notifications.NotificationContentInput = {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: preferences.sound ? "default" : undefined,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: notification.trigger || null,
      });

      return id;
    },
    [preferences]
  );

  const cancelNotification = useCallback(async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
  }, []);

  const cancelAllNotifications = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  const getScheduledNotifications = useCallback(async () => {
    return await Notifications.getAllScheduledNotificationsAsync();
  }, []);

  const setBadgeCount = useCallback(async (count: number) => {
    if (Platform.OS !== "web") {
      await Notifications.setBadgeCountAsync(count);
    }
  }, []);

  const getBadgeCount = useCallback(async (): Promise<number> => {
    if (Platform.OS !== "web") {
      return await Notifications.getBadgeCountAsync();
    }
    return 0;
  }, []);

  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      const updated = { ...preferences, ...prefs };
      setPreferences(updated);
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    },
    [preferences]
  );

  const addNotificationListener = useCallback(
    (callback: (notification: Notifications.Notification) => void) => {
      const subscription = Notifications.addNotificationReceivedListener(callback);
      return () => subscription.remove();
    },
    []
  );

  const addResponseListener = useCallback(
    (callback: (response: Notifications.NotificationResponse) => void) => {
      const subscription =
        Notifications.addNotificationResponseReceivedListener(callback);
      return () => subscription.remove();
    },
    []
  );

  return {
    expoPushToken,
    notification,
    permissions,
    preferences,
    isRegistered,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    getScheduledNotifications,
    setBadgeCount,
    getBadgeCount,
    requestPermissions,
    updatePreferences,
    addNotificationListener,
    addResponseListener,
  };
}

export function scheduleOrderReminder(
  orderId: string,
  customerName: string,
  dueDate: Date
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Order Pickup Reminder",
      body: `Order #${orderId} for ${customerName} is due for pickup`,
      data: { orderId, type: "order_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueDate,
    },
  });
}

export function scheduleLowStockAlert(
  productName: string,
  currentStock: number,
  minStock: number
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Low Stock Alert",
      body: `${productName} is running low (${currentStock}/${minStock} units)`,
      data: { productName, type: "low_stock" },
    },
    trigger: null,
  });
}

export function scheduleExpiryReminder(
  productName: string,
  batchNumber: string,
  expiryDate: Date,
  daysBeforeExpiry: number
): Promise<string> {
  const reminderDate = new Date(expiryDate);
  reminderDate.setDate(reminderDate.getDate() - daysBeforeExpiry);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Product Expiry Reminder",
      body: `${productName} (Batch: ${batchNumber}) expires in ${daysBeforeExpiry} days`,
      data: { productName, batchNumber, type: "expiry_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
}
