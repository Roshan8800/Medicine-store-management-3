import { useCallback, useRef, useEffect, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

export interface MemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  usagePercent?: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
  size?: number;
}

export interface CacheConfig {
  maxSize?: number;
  maxEntries?: number;
  ttl?: number;
  evictionPolicy?: "lru" | "lfu" | "fifo";
  onEvict?: (key: string, entry: any) => void;
}

export function useMemory() {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo>({});
  const [isLowMemory, setIsLowMemory] = useState(false);
  const lowMemoryCallbacksRef = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    const updateMemoryInfo = () => {
      if (typeof performance !== "undefined" && (performance as any).memory) {
        const memory = (performance as any).memory;
        const info: MemoryInfo = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        };
        setMemoryInfo(info);
        
        if (info.usagePercent && info.usagePercent > 80) {
          triggerLowMemory();
        }
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 10000);

    return () => clearInterval(interval);
  }, []);

  const triggerLowMemory = useCallback(() => {
    setIsLowMemory(true);
    lowMemoryCallbacksRef.current.forEach((callback) => callback());
    setTimeout(() => setIsLowMemory(false), 5000);
  }, []);

  const onLowMemory = useCallback((callback: () => void) => {
    lowMemoryCallbacksRef.current.add(callback);
    return () => {
      lowMemoryCallbacksRef.current.delete(callback);
    };
  }, []);

  const requestGC = useCallback(() => {
    if (typeof global !== "undefined" && (global as any).gc) {
      (global as any).gc();
    }
  }, []);

  return {
    memoryInfo,
    isLowMemory,
    onLowMemory,
    requestGC,
    triggerLowMemory,
  };
}

export function useMemoryCache<T>(config: CacheConfig = {}) {
  const {
    maxSize = 50 * 1024 * 1024,
    maxEntries = 100,
    ttl = 5 * 60 * 1000,
    evictionPolicy = "lru",
    onEvict,
  } = config;

  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const currentSizeRef = useRef(0);

  const estimateSize = useCallback((data: any): number => {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1024;
    }
  }, []);

  const isExpired = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp > ttl;
  }, [ttl]);

  const evict = useCallback(() => {
    const cache = cacheRef.current;
    if (cache.size === 0) return;

    let keyToEvict: string | null = null;

    switch (evictionPolicy) {
      case "lru": {
        let oldestAccess = Infinity;
        cache.forEach((entry, key) => {
          if (entry.lastAccess < oldestAccess) {
            oldestAccess = entry.lastAccess;
            keyToEvict = key;
          }
        });
        break;
      }
      case "lfu": {
        let lowestCount = Infinity;
        cache.forEach((entry, key) => {
          if (entry.accessCount < lowestCount) {
            lowestCount = entry.accessCount;
            keyToEvict = key;
          }
        });
        break;
      }
      case "fifo": {
        let oldestTimestamp = Infinity;
        cache.forEach((entry, key) => {
          if (entry.timestamp < oldestTimestamp) {
            oldestTimestamp = entry.timestamp;
            keyToEvict = key;
          }
        });
        break;
      }
    }

    if (keyToEvict) {
      const entry = cache.get(keyToEvict);
      if (entry) {
        currentSizeRef.current -= entry.size || 0;
        onEvict?.(keyToEvict, entry.data);
      }
      cache.delete(keyToEvict);
    }
  }, [evictionPolicy, onEvict]);

  const cleanupExpired = useCallback(() => {
    const cache = cacheRef.current;
    const keysToDelete: string[] = [];

    cache.forEach((entry, key) => {
      if (isExpired(entry)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      const entry = cache.get(key);
      if (entry) {
        currentSizeRef.current -= entry.size || 0;
        onEvict?.(key, entry.data);
      }
      cache.delete(key);
    });

    return keysToDelete.length;
  }, [isExpired, onEvict]);

  const set = useCallback((key: string, data: T): void => {
    const cache = cacheRef.current;
    const size = estimateSize(data);

    if (cache.has(key)) {
      const existing = cache.get(key)!;
      currentSizeRef.current -= existing.size || 0;
    }

    while (
      (cache.size >= maxEntries || currentSizeRef.current + size > maxSize) &&
      cache.size > 0
    ) {
      evict();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccess: Date.now(),
      size,
    };

    cache.set(key, entry);
    currentSizeRef.current += size;
  }, [estimateSize, maxEntries, maxSize, evict]);

  const get = useCallback((key: string): T | undefined => {
    const cache = cacheRef.current;
    const entry = cache.get(key);

    if (!entry) return undefined;

    if (isExpired(entry)) {
      currentSizeRef.current -= entry.size || 0;
      cache.delete(key);
      return undefined;
    }

    entry.accessCount++;
    entry.lastAccess = Date.now();

    return entry.data;
  }, [isExpired]);

  const has = useCallback((key: string): boolean => {
    const entry = cacheRef.current.get(key);
    if (!entry) return false;
    if (isExpired(entry)) {
      cacheRef.current.delete(key);
      return false;
    }
    return true;
  }, [isExpired]);

  const remove = useCallback((key: string): boolean => {
    const entry = cacheRef.current.get(key);
    if (entry) {
      currentSizeRef.current -= entry.size || 0;
      onEvict?.(key, entry.data);
    }
    return cacheRef.current.delete(key);
  }, [onEvict]);

  const clear = useCallback(() => {
    cacheRef.current.forEach((entry, key) => {
      onEvict?.(key, entry.data);
    });
    cacheRef.current.clear();
    currentSizeRef.current = 0;
  }, [onEvict]);

  const getStats = useCallback(() => {
    const cache = cacheRef.current;
    let totalAccessCount = 0;
    let expiredCount = 0;

    cache.forEach((entry) => {
      totalAccessCount += entry.accessCount;
      if (isExpired(entry)) expiredCount++;
    });

    return {
      size: cache.size,
      maxEntries,
      currentSize: currentSizeRef.current,
      maxSize,
      expiredCount,
      totalAccessCount,
      hitRate: totalAccessCount > 0 ? (cache.size / totalAccessCount) * 100 : 0,
    };
  }, [isExpired, maxEntries, maxSize]);

  useEffect(() => {
    const interval = setInterval(cleanupExpired, 60000);
    return () => clearInterval(interval);
  }, [cleanupExpired]);

  return {
    set,
    get,
    has,
    remove,
    clear,
    cleanupExpired,
    getStats,
  };
}

export function useWeakCache<K extends object, V>() {
  const cacheRef = useRef(new WeakMap<K, V>());

  const set = useCallback((key: K, value: V) => {
    cacheRef.current.set(key, value);
  }, []);

  const get = useCallback((key: K): V | undefined => {
    return cacheRef.current.get(key);
  }, []);

  const has = useCallback((key: K): boolean => {
    return cacheRef.current.has(key);
  }, []);

  const remove = useCallback((key: K): boolean => {
    return cacheRef.current.delete(key);
  }, []);

  return { set, get, has, remove };
}

export function useResourceCleanup() {
  const cleanupFunctionsRef = useRef<Set<() => void>>(new Set());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const registerCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctionsRef.current.add(cleanup);
    return () => {
      cleanupFunctionsRef.current.delete(cleanup);
    };
  }, []);

  const runCleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.warn("Cleanup error:", error);
      }
    });
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (appStateRef.current === "active" && nextState.match(/inactive|background/)) {
        runCleanup();
      }
      appStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
      runCleanup();
    };
  }, [runCleanup]);

  return { registerCleanup, runCleanup };
}
