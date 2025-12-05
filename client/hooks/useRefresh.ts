import { useState, useCallback, useRef } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface UseRefreshConfig<T> {
  onRefresh: () => Promise<T>;
  minDuration?: number;
  hapticFeedback?: boolean;
}

interface UseRefreshResult<T> {
  isRefreshing: boolean;
  refresh: () => Promise<T | undefined>;
  lastRefreshed: Date | null;
  error: Error | null;
}

export function useRefresh<T = void>({
  onRefresh,
  minDuration = 500,
  hapticFeedback = true,
}: UseRefreshConfig<T>): UseRefreshResult<T> {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const isRefreshingRef = useRef(false);

  const refresh = useCallback(async (): Promise<T | undefined> => {
    if (isRefreshingRef.current) return undefined;

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setError(null);

    if (hapticFeedback && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const startTime = Date.now();

    try {
      const result = await onRefresh();

      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }

      setLastRefreshed(new Date());

      if (hapticFeedback && Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Refresh failed");
      setError(error);

      if (hapticFeedback && Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      throw error;
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [onRefresh, minDuration, hapticFeedback]);

  return {
    isRefreshing,
    refresh,
    lastRefreshed,
    error,
  };
}

interface UseAutoRefreshConfig<T> extends UseRefreshConfig<T> {
  intervalMs: number;
  enabled?: boolean;
}

export function useAutoRefresh<T = void>({
  intervalMs,
  enabled = true,
  ...refreshConfig
}: UseAutoRefreshConfig<T>): UseRefreshResult<T> {
  const refreshResult = useRefresh<T>(refreshConfig);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (enabled && intervalMs > 0) {
      intervalRef.current = setInterval(() => {
        refreshResult.refresh().catch(() => {});
      }, intervalMs);
    }
  }, [enabled, intervalMs, refreshResult.refresh]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return refreshResult;
}

interface UsePullToRefreshResult<T> extends UseRefreshResult<T> {
  refreshControlProps: {
    refreshing: boolean;
    onRefresh: () => void;
  };
}

export function usePullToRefresh<T = void>(
  config: UseRefreshConfig<T>
): UsePullToRefreshResult<T> {
  const refreshResult = useRefresh<T>(config);

  const refreshControlProps = {
    refreshing: refreshResult.isRefreshing,
    onRefresh: () => {
      refreshResult.refresh().catch(() => {});
    },
  };

  return {
    ...refreshResult,
    refreshControlProps,
  };
}
