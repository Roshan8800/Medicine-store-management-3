import { useState, useCallback, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { AppState, AppStateStatus, Platform } from "react-native";

type SyncDirection = "push" | "pull" | "both";
type SyncPriority = "low" | "normal" | "high" | "critical";

interface SyncTask {
  id: string;
  type: string;
  direction: SyncDirection;
  priority: SyncPriority;
  data?: unknown;
  createdAt: number;
  lastAttempt?: number;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "syncing" | "completed" | "failed";
  error?: string;
}

interface SyncHandler {
  push?: (data: unknown) => Promise<void>;
  pull?: () => Promise<unknown>;
  merge?: (local: unknown, remote: unknown) => unknown;
}

interface BackgroundSyncConfig {
  storageKey?: string;
  syncInterval?: number;
  maxConcurrent?: number;
  retryDelay?: number;
  syncOnForeground?: boolean;
  syncOnConnection?: boolean;
  enableBatching?: boolean;
  batchSize?: number;
}

interface UseBackgroundSyncResult {
  tasks: SyncTask[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingCount: number;
  failedCount: number;
  addTask: (
    type: string,
    direction: SyncDirection,
    data?: unknown,
    priority?: SyncPriority
  ) => Promise<string>;
  removeTask: (id: string) => Promise<void>;
  retryTask: (id: string) => Promise<void>;
  retryAllFailed: () => Promise<void>;
  clearCompleted: () => Promise<void>;
  clearAll: () => Promise<void>;
  syncNow: () => Promise<void>;
  registerHandler: (type: string, handler: SyncHandler) => void;
  unregisterHandler: (type: string) => void;
  pause: () => void;
  resume: () => void;
}

const STORAGE_KEY = "background_sync_tasks";

export function useBackgroundSync(
  config: BackgroundSyncConfig = {}
): UseBackgroundSyncResult {
  const {
    storageKey = STORAGE_KEY,
    syncInterval = 60000,
    maxConcurrent = 3,
    retryDelay = 5000,
    syncOnForeground = true,
    syncOnConnection = true,
    enableBatching = true,
    batchSize = 10,
  } = config;

  const [tasks, setTasks] = useState<SyncTask[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const handlers = useRef<Map<string, SyncHandler>>(new Map());
  const syncTimer = useRef<NodeJS.Timeout | null>(null);
  const activeTasks = useRef<Set<string>>(new Set());

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as SyncTask[];
          const pending = parsed.map((t) =>
            t.status === "syncing" ? { ...t, status: "pending" as const } : t
          );
          setTasks(pending);
        }
      } catch {
      }
    };
    loadTasks();
  }, [storageKey]);

  useEffect(() => {
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(tasks));
      } catch {
      }
    };
    saveTasks();
  }, [tasks, storageKey]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected ?? false;
      const wasOffline = !isOnline;
      setIsOnline(online);

      if (online && wasOffline && syncOnConnection && !isPaused) {
        syncNow();
      }
    });

    return () => unsubscribe();
  }, [isOnline, syncOnConnection, isPaused]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        nextAppState === "active" &&
        syncOnForeground &&
        isOnline &&
        !isPaused
      ) {
        syncNow();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [syncOnForeground, isOnline, isPaused]);

  useEffect(() => {
    if (syncInterval > 0 && !isPaused) {
      syncTimer.current = setInterval(() => {
        if (isOnline && !isSyncing) {
          syncNow();
        }
      }, syncInterval);

      return () => {
        if (syncTimer.current) {
          clearInterval(syncTimer.current);
        }
      };
    }
  }, [syncInterval, isOnline, isSyncing, isPaused]);

  const generateId = useCallback(() => {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addTask = useCallback(
    async (
      type: string,
      direction: SyncDirection,
      data?: unknown,
      priority: SyncPriority = "normal"
    ): Promise<string> => {
      const task: SyncTask = {
        id: generateId(),
        type,
        direction,
        priority,
        data,
        createdAt: Date.now(),
        attempts: 0,
        maxAttempts: 3,
        status: "pending",
      };

      setTasks((prev) => {
        const updated = [...prev, task];
        return updated.sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
      });

      return task.id;
    },
    [generateId]
  );

  const removeTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTask = useCallback(
    (id: string, updates: Partial<SyncTask>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    },
    []
  );

  const processTask = useCallback(
    async (task: SyncTask): Promise<boolean> => {
      const handler = handlers.current.get(task.type);
      if (!handler) {
        console.warn(`No handler for sync type: ${task.type}`);
        return false;
      }

      try {
        if (task.direction === "push" || task.direction === "both") {
          if (handler.push && task.data) {
            await handler.push(task.data);
          }
        }

        if (task.direction === "pull" || task.direction === "both") {
          if (handler.pull) {
            const remoteData = await handler.pull();
            if (handler.merge && task.data) {
              handler.merge(task.data, remoteData);
            }
          }
        }

        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const syncNow = useCallback(async () => {
    if (isSyncing || !isOnline || isPaused) return;

    setIsSyncing(true);

    const pendingTasks = tasks.filter(
      (t) =>
        t.status === "pending" &&
        t.attempts < t.maxAttempts &&
        !activeTasks.current.has(t.id)
    );

    const tasksToProcess = enableBatching
      ? pendingTasks.slice(0, batchSize)
      : pendingTasks.slice(0, maxConcurrent);

    if (tasksToProcess.length === 0) {
      setIsSyncing(false);
      return;
    }

    await Promise.all(
      tasksToProcess.map(async (task) => {
        activeTasks.current.add(task.id);
        updateTask(task.id, {
          status: "syncing",
          lastAttempt: Date.now(),
          attempts: task.attempts + 1,
        });

        const success = await processTask(task);

        if (success) {
          updateTask(task.id, { status: "completed" });
        } else {
          const newAttempts = task.attempts + 1;
          updateTask(task.id, {
            status: newAttempts >= task.maxAttempts ? "failed" : "pending",
            error: "Sync failed",
          });

          if (newAttempts < task.maxAttempts) {
            setTimeout(() => {
              updateTask(task.id, { status: "pending" });
            }, retryDelay * newAttempts);
          }
        }

        activeTasks.current.delete(task.id);
      })
    );

    setLastSyncTime(new Date());
    setIsSyncing(false);

    const remainingPending = tasks.filter(
      (t) => t.status === "pending" && t.attempts < t.maxAttempts
    );
    if (remainingPending.length > 0) {
      setTimeout(syncNow, 100);
    }
  }, [
    tasks,
    isSyncing,
    isOnline,
    isPaused,
    enableBatching,
    batchSize,
    maxConcurrent,
    processTask,
    updateTask,
    retryDelay,
  ]);

  const retryTask = useCallback(
    async (id: string) => {
      updateTask(id, { status: "pending", attempts: 0, error: undefined });
      syncNow();
    },
    [updateTask, syncNow]
  );

  const retryAllFailed = useCallback(async () => {
    setTasks((prev) =>
      prev.map((t) =>
        t.status === "failed"
          ? { ...t, status: "pending" as const, attempts: 0, error: undefined }
          : t
      )
    );
    syncNow();
  }, [syncNow]);

  const clearCompleted = useCallback(async () => {
    setTasks((prev) => prev.filter((t) => t.status !== "completed"));
  }, []);

  const clearAll = useCallback(async () => {
    setTasks([]);
    await AsyncStorage.removeItem(storageKey);
  }, [storageKey]);

  const registerHandler = useCallback(
    (type: string, handler: SyncHandler) => {
      handlers.current.set(type, handler);
    },
    []
  );

  const unregisterHandler = useCallback((type: string) => {
    handlers.current.delete(type);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    if (syncTimer.current) {
      clearInterval(syncTimer.current);
      syncTimer.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  return {
    tasks,
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingCount,
    failedCount,
    addTask,
    removeTask,
    retryTask,
    retryAllFailed,
    clearCompleted,
    clearAll,
    syncNow,
    registerHandler,
    unregisterHandler,
    pause,
    resume,
  };
}

export function createProductSyncHandler(
  fetchProducts: () => Promise<unknown[]>,
  saveProducts: (products: unknown[]) => Promise<void>
): SyncHandler {
  return {
    pull: fetchProducts,
    push: async (data) => {
      await saveProducts(data as unknown[]);
    },
    merge: (local, remote) => {
      const localProducts = local as { id: string; updatedAt: number }[];
      const remoteProducts = remote as { id: string; updatedAt: number }[];

      const merged = new Map<string, { id: string; updatedAt: number }>();

      localProducts.forEach((p) => merged.set(p.id, p));

      remoteProducts.forEach((p) => {
        const existing = merged.get(p.id);
        if (!existing || p.updatedAt > existing.updatedAt) {
          merged.set(p.id, p);
        }
      });

      return Array.from(merged.values());
    },
  };
}
