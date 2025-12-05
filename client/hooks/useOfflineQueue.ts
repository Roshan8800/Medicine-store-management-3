import { useState, useCallback, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

interface QueuedOperation<T = unknown> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: number;
}

interface OfflineQueueConfig {
  storageKey?: string;
  maxRetries?: number;
  retryDelay?: number;
  autoSync?: boolean;
  batchSize?: number;
  onSyncStart?: () => void;
  onSyncComplete?: (synced: number, failed: number) => void;
  onOperationSuccess?: (operation: QueuedOperation) => void;
  onOperationFailed?: (operation: QueuedOperation, error: Error) => void;
}

type OperationHandler<T = unknown> = (payload: T) => Promise<void>;

interface UseOfflineQueueResult {
  queue: QueuedOperation[];
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  enqueue: <T>(type: string, payload: T, priority?: number) => Promise<string>;
  dequeue: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  sync: () => Promise<void>;
  registerHandler: <T>(type: string, handler: OperationHandler<T>) => void;
  unregisterHandler: (type: string) => void;
  getOperation: (id: string) => QueuedOperation | undefined;
  updateOperation: <T>(id: string, payload: Partial<T>) => Promise<void>;
}

export function useOfflineQueue(config: OfflineQueueConfig = {}): UseOfflineQueueResult {
  const {
    storageKey = "offline_queue",
    maxRetries = 3,
    retryDelay = 1000,
    autoSync = true,
    batchSize = 5,
    onSyncStart,
    onSyncComplete,
    onOperationSuccess,
    onOperationFailed,
  } = config;

  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const handlers = useRef<Map<string, OperationHandler>>(new Map());
  const syncInProgress = useRef(false);

  useEffect(() => {
    const loadQueue = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          setQueue(JSON.parse(stored));
        }
      } catch {
      }
    };
    loadQueue();
  }, [storageKey]);

  useEffect(() => {
    const saveQueue = async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(queue));
      } catch {
      }
    };
    saveQueue();
  }, [queue, storageKey]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected ?? false;
      setIsOnline(online);
      if (online && autoSync && queue.length > 0 && !syncInProgress.current) {
        sync();
      }
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, [queue.length, autoSync]);

  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const enqueue = useCallback(
    async <T>(type: string, payload: T, priority = 0): Promise<string> => {
      const operation: QueuedOperation<T> = {
        id: generateId(),
        type,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries,
        priority,
      };

      setQueue((prev) => {
        const updated = [...prev, operation as QueuedOperation];
        return updated.sort((a, b) => b.priority - a.priority);
      });

      return operation.id;
    },
    [generateId, maxRetries]
  );

  const dequeue = useCallback(async (id: string) => {
    setQueue((prev) => prev.filter((op) => op.id !== id));
  }, []);

  const clear = useCallback(async () => {
    setQueue([]);
    await AsyncStorage.removeItem(storageKey);
  }, [storageKey]);

  const getOperation = useCallback(
    (id: string): QueuedOperation | undefined => {
      return queue.find((op) => op.id === id);
    },
    [queue]
  );

  const updateOperation = useCallback(async <T>(id: string, payload: Partial<T>) => {
    setQueue((prev) =>
      prev.map((op) =>
        op.id === id
          ? { ...op, payload: { ...(op.payload as object), ...payload } }
          : op
      )
    );
  }, []);

  const registerHandler = useCallback(<T>(type: string, handler: OperationHandler<T>) => {
    handlers.current.set(type, handler as OperationHandler);
  }, []);

  const unregisterHandler = useCallback((type: string) => {
    handlers.current.delete(type);
  }, []);

  const processOperation = useCallback(
    async (operation: QueuedOperation): Promise<boolean> => {
      const handler = handlers.current.get(operation.type);
      if (!handler) {
        console.warn(`No handler registered for operation type: ${operation.type}`);
        return false;
      }

      try {
        await handler(operation.payload);
        onOperationSuccess?.(operation);
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Operation failed");
        onOperationFailed?.(operation, error);
        return false;
      }
    },
    [onOperationSuccess, onOperationFailed]
  );

  const sync = useCallback(async () => {
    if (syncInProgress.current || !isOnline || queue.length === 0) {
      return;
    }

    syncInProgress.current = true;
    setIsSyncing(true);
    onSyncStart?.();

    let syncedCount = 0;
    let failedCount = 0;
    const remainingOps: QueuedOperation[] = [];

    const batch = queue.slice(0, batchSize);
    const restOfQueue = queue.slice(batchSize);

    for (const operation of batch) {
      const success = await processOperation(operation);

      if (success) {
        syncedCount++;
      } else {
        if (operation.retryCount < operation.maxRetries) {
          remainingOps.push({
            ...operation,
            retryCount: operation.retryCount + 1,
          });
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (operation.retryCount + 1))
          );
        } else {
          failedCount++;
        }
      }
    }

    setQueue([...remainingOps, ...restOfQueue]);
    setIsSyncing(false);
    syncInProgress.current = false;

    onSyncComplete?.(syncedCount, failedCount);

    if (remainingOps.length > 0 || restOfQueue.length > 0) {
      setTimeout(sync, retryDelay);
    }
  }, [isOnline, queue, batchSize, processOperation, retryDelay, onSyncStart, onSyncComplete]);

  return {
    queue,
    isOnline,
    isSyncing,
    pendingCount: queue.length,
    enqueue,
    dequeue,
    clear,
    sync,
    registerHandler,
    unregisterHandler,
    getOperation,
    updateOperation,
  };
}

interface ConflictResolution<T> {
  strategy: "client-wins" | "server-wins" | "merge" | "manual";
  merge?: (local: T, remote: T) => T;
  onConflict?: (local: T, remote: T) => Promise<T>;
}

interface SyncableData {
  id: string;
  updatedAt: number;
  version?: number;
}

export function resolveConflict<T extends SyncableData>(
  local: T,
  remote: T,
  resolution: ConflictResolution<T>
): T | Promise<T> {
  switch (resolution.strategy) {
    case "client-wins":
      return local;
    case "server-wins":
      return remote;
    case "merge":
      if (resolution.merge) {
        return resolution.merge(local, remote);
      }
      return local.updatedAt > remote.updatedAt ? local : remote;
    case "manual":
      if (resolution.onConflict) {
        return resolution.onConflict(local, remote);
      }
      return local.updatedAt > remote.updatedAt ? local : remote;
    default:
      return local.updatedAt > remote.updatedAt ? local : remote;
  }
}
