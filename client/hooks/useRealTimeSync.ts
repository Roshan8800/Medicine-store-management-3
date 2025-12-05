import { useState, useCallback, useRef, useEffect } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

interface SyncEvent<T> {
  type: "create" | "update" | "delete";
  data: T;
  timestamp: number;
}

interface RealTimeSyncConfig<T> {
  endpoint?: string;
  pollInterval?: number;
  enablePolling?: boolean;
  enableWebSocket?: boolean;
  wsEndpoint?: string;
  onDataChange?: (data: T[]) => void;
  onSyncError?: (error: Error) => void;
  transform?: (rawData: unknown) => T[];
  compareKey?: keyof T;
}

interface UseRealTimeSyncResult<T> {
  data: T[];
  status: SyncStatus;
  lastSynced: Date | null;
  isOnline: boolean;
  sync: () => Promise<void>;
  push: (item: T) => void;
  update: (item: T) => void;
  remove: (item: T) => void;
  setData: (data: T[]) => void;
  subscribe: (callback: (event: SyncEvent<T>) => void) => () => void;
}

export function useRealTimeSync<T extends { id: string }>(
  initialData: T[] = [],
  config: RealTimeSyncConfig<T> = {}
): UseRealTimeSyncResult<T> {
  const {
    endpoint,
    pollInterval = 30000,
    enablePolling = false,
    enableWebSocket = false,
    wsEndpoint,
    onDataChange,
    onSyncError,
    transform,
    compareKey = "id" as keyof T,
  } = config;

  const [data, setDataState] = useState<T[]>(initialData);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const subscribersRef = useRef<Set<(event: SyncEvent<T>) => void>>(new Set());
  const isMounted = useRef(true);

  const emitEvent = useCallback((event: SyncEvent<T>) => {
    subscribersRef.current.forEach((callback) => callback(event));
  }, []);

  const setData = useCallback(
    (newData: T[]) => {
      setDataState(newData);
      onDataChange?.(newData);
    },
    [onDataChange]
  );

  const sync = useCallback(async () => {
    if (!endpoint || !isOnline) {
      if (!isOnline) setStatus("offline");
      return;
    }

    setStatus("syncing");
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }
      const rawData = await response.json();
      const transformedData = transform ? transform(rawData) : (rawData as T[]);

      if (isMounted.current) {
        setData(transformedData);
        setStatus("synced");
        setLastSynced(new Date());
      }
    } catch (err) {
      if (isMounted.current) {
        setStatus("error");
        onSyncError?.(err instanceof Error ? err : new Error("Sync failed"));
      }
    }
  }, [endpoint, isOnline, transform, setData, onSyncError]);

  const push = useCallback(
    (item: T) => {
      setDataState((prev) => {
        const updated = [...prev, item];
        onDataChange?.(updated);
        return updated;
      });
      emitEvent({ type: "create", data: item, timestamp: Date.now() });
    },
    [onDataChange, emitEvent]
  );

  const update = useCallback(
    (item: T) => {
      setDataState((prev) => {
        const updated = prev.map((existing) =>
          existing[compareKey] === item[compareKey] ? item : existing
        );
        onDataChange?.(updated);
        return updated;
      });
      emitEvent({ type: "update", data: item, timestamp: Date.now() });
    },
    [compareKey, onDataChange, emitEvent]
  );

  const remove = useCallback(
    (item: T) => {
      setDataState((prev) => {
        const updated = prev.filter(
          (existing) => existing[compareKey] !== item[compareKey]
        );
        onDataChange?.(updated);
        return updated;
      });
      emitEvent({ type: "delete", data: item, timestamp: Date.now() });
    },
    [compareKey, onDataChange, emitEvent]
  );

  const subscribe = useCallback((callback: (event: SyncEvent<T>) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected ?? false;
      setIsOnline(online);
      if (online && status === "offline") {
        sync();
      } else if (!online) {
        setStatus("offline");
      }
    });

    return () => unsubscribe();
  }, [status, sync]);

  useEffect(() => {
    if (enableWebSocket && wsEndpoint && isOnline) {
      const ws = new WebSocket(wsEndpoint);

      ws.onopen = () => {
        setStatus("synced");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "sync" && message.data) {
            const transformedData = transform
              ? transform(message.data)
              : (message.data as T[]);
            setData(transformedData);
            setLastSynced(new Date());
          } else if (message.type === "update" && message.item) {
            update(message.item as T);
          } else if (message.type === "create" && message.item) {
            push(message.item as T);
          } else if (message.type === "delete" && message.item) {
            remove(message.item as T);
          }
        } catch {
        }
      };

      ws.onerror = () => {
        setStatus("error");
      };

      ws.onclose = () => {
        setStatus("idle");
      };

      wsRef.current = ws;

      return () => {
        ws.close();
        wsRef.current = null;
      };
    }
  }, [enableWebSocket, wsEndpoint, isOnline, transform, setData, update, push, remove]);

  useEffect(() => {
    if (enablePolling && endpoint && isOnline) {
      sync();
      pollTimerRef.current = setInterval(sync, pollInterval);

      return () => {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      };
    }
  }, [enablePolling, endpoint, pollInterval, isOnline, sync]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    data,
    status,
    lastSynced,
    isOnline,
    sync,
    push,
    update,
    remove,
    setData,
    subscribe,
  };
}

interface OptimisticUpdateConfig<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollback: () => void) => void;
  onSettled?: () => void;
}

export function useOptimisticUpdate<T extends { id: string }>(
  data: T[],
  setData: (data: T[]) => void
): {
  optimisticUpdate: (
    updateFn: (prev: T[]) => T[],
    asyncFn: () => Promise<T>,
    config?: OptimisticUpdateConfig<T>
  ) => Promise<void>;
} {
  const optimisticUpdate = useCallback(
    async (
      updateFn: (prev: T[]) => T[],
      asyncFn: () => Promise<T>,
      config: OptimisticUpdateConfig<T> = {}
    ) => {
      const previousData = [...data];
      const optimisticData = updateFn(data);
      setData(optimisticData);

      try {
        const result = await asyncFn();
        config.onSuccess?.(result);
      } catch (err) {
        const rollback = () => setData(previousData);
        config.onError?.(
          err instanceof Error ? err : new Error("Update failed"),
          rollback
        );
        rollback();
      } finally {
        config.onSettled?.();
      }
    },
    [data, setData]
  );

  return { optimisticUpdate };
}
