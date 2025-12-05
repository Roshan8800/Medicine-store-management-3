import { useCallback, useRef, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AnalyticsEvent = 
  | "screen_view"
  | "button_click"
  | "form_submit"
  | "error"
  | "purchase"
  | "search"
  | "share"
  | "login"
  | "logout"
  | "signup"
  | "item_view"
  | "item_add"
  | "item_update"
  | "item_delete"
  | "report_generate"
  | "export"
  | "ai_feature_use"
  | "notification_tap"
  | "custom";

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  timestamp: number;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  screenName?: string;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  createdAt?: Date;
  lastLogin?: Date;
  [key: string]: any;
}

export interface AnalyticsConfig {
  enabled?: boolean;
  debug?: boolean;
  batchSize?: number;
  flushInterval?: number;
  maxStoredEvents?: number;
  onEvent?: (event: AnalyticsEventData) => void;
  onFlush?: (events: AnalyticsEventData[]) => Promise<void>;
}

const ANALYTICS_STORAGE_KEY = "@binayak_analytics_queue";
const SESSION_STORAGE_KEY = "@binayak_analytics_session";

export function useAnalytics(config: AnalyticsConfig = {}) {
  const {
    enabled = true,
    debug = false,
    batchSize = 10,
    flushInterval = 30000,
    maxStoredEvents = 100,
    onEvent,
    onFlush,
  } = config;

  const [sessionId] = useState(() => generateSessionId());
  const [userId, setUserId] = useState<string | undefined>();
  const [userProperties, setUserProperties] = useState<UserProperties>({});
  const eventQueueRef = useRef<AnalyticsEventData[]>([]);
  const flushIntervalRef = useRef<NodeJS.Timeout>();
  const currentScreenRef = useRef<string>("");

  function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  useEffect(() => {
    loadStoredEvents();

    flushIntervalRef.current = setInterval(() => {
      flush();
    }, flushInterval);

    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
      flush();
    };
  }, [flushInterval]);

  const loadStoredEvents = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (stored) {
        const events = JSON.parse(stored) as AnalyticsEventData[];
        eventQueueRef.current = [...events, ...eventQueueRef.current];
        await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
      }
    } catch (error) {
      if (debug) {
        console.warn("Failed to load stored analytics events:", error);
      }
    }
  }, [debug]);

  const persistEvents = useCallback(async () => {
    try {
      if (eventQueueRef.current.length > 0) {
        const eventsToStore = eventQueueRef.current.slice(0, maxStoredEvents);
        await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(eventsToStore));
      }
    } catch (error) {
      if (debug) {
        console.warn("Failed to persist analytics events:", error);
      }
    }
  }, [maxStoredEvents, debug]);

  const track = useCallback((
    event: AnalyticsEvent,
    properties?: Record<string, any>
  ) => {
    if (!enabled) return;

    const eventData: AnalyticsEventData = {
      event,
      timestamp: Date.now(),
      properties,
      userId,
      sessionId,
      screenName: currentScreenRef.current,
    };

    if (debug) {
      console.log("[Analytics] Track:", eventData);
    }

    eventQueueRef.current.push(eventData);
    onEvent?.(eventData);

    if (eventQueueRef.current.length >= batchSize) {
      flush();
    }
  }, [enabled, debug, userId, sessionId, batchSize, onEvent]);

  const flush = useCallback(async () => {
    if (eventQueueRef.current.length === 0) return;

    const eventsToFlush = [...eventQueueRef.current];
    eventQueueRef.current = [];

    if (debug) {
      console.log("[Analytics] Flushing", eventsToFlush.length, "events");
    }

    try {
      if (onFlush) {
        await onFlush(eventsToFlush);
      }
    } catch (error) {
      if (debug) {
        console.warn("Failed to flush analytics events:", error);
      }
      eventQueueRef.current = [...eventsToFlush, ...eventQueueRef.current].slice(0, maxStoredEvents);
      await persistEvents();
    }
  }, [debug, onFlush, maxStoredEvents, persistEvents]);

  const trackScreenView = useCallback((screenName: string, properties?: Record<string, any>) => {
    currentScreenRef.current = screenName;
    track("screen_view", { screen_name: screenName, ...properties });
  }, [track]);

  const trackButtonClick = useCallback((buttonName: string, properties?: Record<string, any>) => {
    track("button_click", { button_name: buttonName, ...properties });
  }, [track]);

  const trackFormSubmit = useCallback((formName: string, success: boolean, properties?: Record<string, any>) => {
    track("form_submit", { form_name: formName, success, ...properties });
  }, [track]);

  const trackError = useCallback((error: Error, properties?: Record<string, any>) => {
    track("error", {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500),
      ...properties,
    });
  }, [track]);

  const trackPurchase = useCallback((
    transactionId: string,
    amount: number,
    currency: string = "INR",
    items?: Array<{ id: string; name: string; price: number; quantity: number }>,
    properties?: Record<string, any>
  ) => {
    track("purchase", {
      transaction_id: transactionId,
      amount,
      currency,
      items,
      item_count: items?.length || 0,
      ...properties,
    });
  }, [track]);

  const trackSearch = useCallback((query: string, resultsCount: number, properties?: Record<string, any>) => {
    track("search", { query, results_count: resultsCount, ...properties });
  }, [track]);

  const trackShare = useCallback((contentType: string, method: string, properties?: Record<string, any>) => {
    track("share", { content_type: contentType, method, ...properties });
  }, [track]);

  const trackLogin = useCallback((method: string, properties?: Record<string, any>) => {
    track("login", { method, ...properties });
  }, [track]);

  const trackLogout = useCallback((properties?: Record<string, any>) => {
    track("logout", properties);
  }, [track]);

  const trackSignup = useCallback((method: string, properties?: Record<string, any>) => {
    track("signup", { method, ...properties });
  }, [track]);

  const trackAIFeature = useCallback((featureName: string, success: boolean, properties?: Record<string, any>) => {
    track("ai_feature_use", { feature_name: featureName, success, ...properties });
  }, [track]);

  const identifyUser = useCallback((id: string, properties?: UserProperties) => {
    setUserId(id);
    if (properties) {
      setUserProperties((prev) => ({ ...prev, ...properties, userId: id }));
    }
    if (debug) {
      console.log("[Analytics] Identify user:", id, properties);
    }
  }, [debug]);

  const resetUser = useCallback(() => {
    setUserId(undefined);
    setUserProperties({});
    if (debug) {
      console.log("[Analytics] Reset user");
    }
  }, [debug]);

  const setUserProperty = useCallback((key: string, value: any) => {
    setUserProperties((prev) => ({ ...prev, [key]: value }));
  }, []);

  const getEventCount = useCallback(() => eventQueueRef.current.length, []);

  const clearEvents = useCallback(async () => {
    eventQueueRef.current = [];
    await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
  }, []);

  return {
    track,
    flush,
    trackScreenView,
    trackButtonClick,
    trackFormSubmit,
    trackError,
    trackPurchase,
    trackSearch,
    trackShare,
    trackLogin,
    trackLogout,
    trackSignup,
    trackAIFeature,
    identifyUser,
    resetUser,
    setUserProperty,
    getEventCount,
    clearEvents,
    sessionId,
    userId,
    userProperties,
  };
}

export function useScreenTracking(screenName: string) {
  const { trackScreenView } = useAnalytics();

  useEffect(() => {
    trackScreenView(screenName);
  }, [screenName, trackScreenView]);
}

export function useEventTracking() {
  const { track, trackButtonClick, trackFormSubmit, trackError } = useAnalytics();

  return {
    track,
    trackButtonClick,
    trackFormSubmit,
    trackError,
  };
}
