import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PERSISTENCE_PREFIX = "@binayak_state_";

export interface PersistenceConfig<T> {
  key: string;
  initialValue: T;
  version?: number;
  migrate?: (oldValue: any, oldVersion: number) => T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  debounceMs?: number;
  onError?: (error: Error) => void;
  onRestore?: (value: T) => void;
  excludeKeys?: (keyof T)[];
}

interface PersistedData<T> {
  value: T;
  version: number;
  timestamp: number;
}

export function useStatePersistence<T>(config: PersistenceConfig<T>) {
  const {
    key,
    initialValue,
    version = 1,
    migrate,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    debounceMs = 500,
    onError,
    onRestore,
    excludeKeys = [],
  } = config;

  const [state, setState] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestored, setIsRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const storageKey = `${PERSISTENCE_PREFIX}${key}`;

  const filterState = useCallback((value: T): T => {
    if (excludeKeys.length === 0 || typeof value !== "object" || value === null) {
      return value;
    }
    const filtered = { ...value };
    excludeKeys.forEach((k) => {
      delete (filtered as any)[k];
    });
    return filtered;
  }, [excludeKeys]);

  const restoreState = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (!stored) {
        setIsLoading(false);
        setIsRestored(true);
        return;
      }

      const parsed: PersistedData<T> = deserialize(stored);

      if (parsed.version !== version && migrate) {
        const migrated = migrate(parsed.value, parsed.version);
        setState(migrated);
        onRestore?.(migrated);
      } else {
        const mergedState = { ...initialValue, ...parsed.value };
        setState(mergedState);
        onRestore?.(mergedState);
      }

      setLastSaved(new Date(parsed.timestamp));
    } catch (error) {
      onError?.(error as Error);
      console.error("Failed to restore state:", error);
    } finally {
      setIsLoading(false);
      setIsRestored(true);
    }
  }, [storageKey, deserialize, version, migrate, onRestore, onError, initialValue]);

  const persistState = useCallback(async (value: T) => {
    try {
      const filteredValue = filterState(value);
      const data: PersistedData<T> = {
        value: filteredValue,
        version,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(storageKey, serialize(data));
      setLastSaved(new Date());
    } catch (error) {
      onError?.(error as Error);
      console.error("Failed to persist state:", error);
    }
  }, [storageKey, serialize, version, filterState, onError]);

  const debouncedPersist = useCallback((value: T) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      persistState(value);
    }, debounceMs);
  }, [persistState, debounceMs]);

  useEffect(() => {
    restoreState();
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const updateState = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setState((prev) => {
      const newState = typeof updates === "function" 
        ? updates(prev) 
        : { ...prev, ...updates };
      debouncedPersist(newState);
      return newState;
    });
  }, [debouncedPersist]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    updateState((prev) => ({ ...prev, [field]: value }));
  }, [updateState]);

  const resetState = useCallback(async () => {
    setState(initialValue);
    try {
      await AsyncStorage.removeItem(storageKey);
      setLastSaved(null);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [initialValue, storageKey, onError]);

  const clearPersistence = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(storageKey);
      setLastSaved(null);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [storageKey, onError]);

  const forceSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await persistState(state);
  }, [persistState, state]);

  return {
    state,
    setState: updateState,
    setValue,
    resetState,
    clearPersistence,
    forceSave,
    isLoading,
    isRestored,
    lastSaved,
  };
}

export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options?: Partial<PersistenceConfig<T>>
) {
  return useStatePersistence({
    key,
    initialValue,
    ...options,
  });
}

export async function getAllPersistedKeys(): Promise<string[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter((key) => key.startsWith(PERSISTENCE_PREFIX));
  } catch (error) {
    console.error("Failed to get persisted keys:", error);
    return [];
  }
}

export async function clearAllPersistedState(): Promise<void> {
  try {
    const keys = await getAllPersistedKeys();
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error("Failed to clear persisted state:", error);
  }
}

export async function getPersistedStateInfo(): Promise<{
  keys: string[];
  totalSize: number;
  items: { key: string; size: number; timestamp: number }[];
}> {
  try {
    const keys = await getAllPersistedKeys();
    const items: { key: string; size: number; timestamp: number }[] = [];
    let totalSize = 0;

    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        const size = new Blob([value]).size;
        totalSize += size;
        try {
          const parsed = JSON.parse(value);
          items.push({
            key: key.replace(PERSISTENCE_PREFIX, ""),
            size,
            timestamp: parsed.timestamp || 0,
          });
        } catch {
          items.push({ key: key.replace(PERSISTENCE_PREFIX, ""), size, timestamp: 0 });
        }
      }
    }

    return { keys, totalSize, items };
  } catch (error) {
    console.error("Failed to get persisted state info:", error);
    return { keys: [], totalSize: 0, items: [] };
  }
}
