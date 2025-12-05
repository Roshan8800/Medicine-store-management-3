import { useState, useCallback, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl?: number;
  staleWhileRevalidate?: boolean;
  persistToStorage?: boolean;
  storageKey?: string;
  maxEntries?: number;
}

interface UseCacheResult<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  error: Error | null;
  set: (data: T) => Promise<void>;
  get: () => T | null;
  invalidate: () => Promise<void>;
  refresh: () => Promise<void>;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = {}
): UseCacheResult<T> {
  const {
    ttl = 5 * 60 * 1000,
    staleWhileRevalidate = true,
    persistToStorage = false,
    storageKey,
    maxEntries = 100,
  } = config;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const cacheKey = storageKey || `cache:${key}`;

  const isExpired = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() > entry.expiresAt;
  }, []);

  const getFromMemory = useCallback((): CacheEntry<T> | null => {
    const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
    return entry || null;
  }, [key]);

  const setToMemory = useCallback(
    (entry: CacheEntry<T>) => {
      if (memoryCache.size >= maxEntries) {
        const oldestKey = memoryCache.keys().next().value;
        if (oldestKey) {
          memoryCache.delete(oldestKey);
        }
      }
      memoryCache.set(key, entry);
    },
    [key, maxEntries]
  );

  const getFromStorage = useCallback(async (): Promise<CacheEntry<T> | null> => {
    if (!persistToStorage) return null;
    try {
      const stored = await AsyncStorage.getItem(cacheKey);
      if (stored) {
        return JSON.parse(stored) as CacheEntry<T>;
      }
    } catch {
    }
    return null;
  }, [cacheKey, persistToStorage]);

  const setToStorage = useCallback(
    async (entry: CacheEntry<T>) => {
      if (!persistToStorage) return;
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      } catch {
      }
    },
    [cacheKey, persistToStorage]
  );

  const removeFromStorage = useCallback(async () => {
    if (!persistToStorage) return;
    try {
      await AsyncStorage.removeItem(cacheKey);
    } catch {
    }
  }, [cacheKey, persistToStorage]);

  const fetchAndCache = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const freshData = await fetcherRef.current();
      const entry: CacheEntry<T> = {
        data: freshData,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };

      setToMemory(entry);
      await setToStorage(entry);

      if (isMounted.current) {
        setData(freshData);
        setIsStale(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error("Failed to fetch"));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [ttl, setToMemory, setToStorage]);

  const get = useCallback((): T | null => {
    const memoryEntry = getFromMemory();
    if (memoryEntry && !isExpired(memoryEntry)) {
      return memoryEntry.data;
    }
    return data;
  }, [getFromMemory, isExpired, data]);

  const set = useCallback(
    async (newData: T) => {
      const entry: CacheEntry<T> = {
        data: newData,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };

      setToMemory(entry);
      await setToStorage(entry);
      setData(newData);
      setIsStale(false);
    },
    [ttl, setToMemory, setToStorage]
  );

  const invalidate = useCallback(async () => {
    memoryCache.delete(key);
    await removeFromStorage();
    setData(null);
    setIsStale(true);
  }, [key, removeFromStorage]);

  const refresh = useCallback(async () => {
    await fetchAndCache();
  }, [fetchAndCache]);

  useEffect(() => {
    isMounted.current = true;

    const loadCache = async () => {
      const memoryEntry = getFromMemory();
      if (memoryEntry) {
        setData(memoryEntry.data);
        if (isExpired(memoryEntry)) {
          setIsStale(true);
          if (staleWhileRevalidate) {
            fetchAndCache();
          }
        }
        return;
      }

      const storageEntry = await getFromStorage();
      if (storageEntry) {
        setData(storageEntry.data);
        setToMemory(storageEntry);
        if (isExpired(storageEntry)) {
          setIsStale(true);
          if (staleWhileRevalidate) {
            fetchAndCache();
          }
        }
        return;
      }

      fetchAndCache();
    };

    loadCache();

    return () => {
      isMounted.current = false;
    };
  }, [key]);

  return {
    data,
    isLoading,
    isStale,
    error,
    set,
    get,
    invalidate,
    refresh,
  };
}

interface QueryCacheConfig {
  ttl?: number;
  persistToStorage?: boolean;
}

interface QueryCacheResult<T, P extends unknown[]> {
  cache: Map<string, CacheEntry<T>>;
  get: (...params: P) => T | null;
  set: (data: T, ...params: P) => Promise<void>;
  invalidate: (...params: P) => void;
  invalidateAll: () => void;
  prefetch: (...params: P) => Promise<void>;
}

export function useQueryCache<T, P extends unknown[]>(
  queryFn: (...params: P) => Promise<T>,
  config: QueryCacheConfig = {}
): QueryCacheResult<T, P> {
  const { ttl = 5 * 60 * 1000, persistToStorage = false } = config;
  const cacheRef = useRef(new Map<string, CacheEntry<T>>());

  const generateKey = useCallback((...params: P): string => {
    return JSON.stringify(params);
  }, []);

  const get = useCallback(
    (...params: P): T | null => {
      const key = generateKey(...params);
      const entry = cacheRef.current.get(key);
      if (entry && Date.now() <= entry.expiresAt) {
        return entry.data;
      }
      return null;
    },
    [generateKey]
  );

  const set = useCallback(
    async (data: T, ...params: P) => {
      const key = generateKey(...params);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      cacheRef.current.set(key, entry);

      if (persistToStorage) {
        try {
          await AsyncStorage.setItem(`query:${key}`, JSON.stringify(entry));
        } catch {
        }
      }
    },
    [generateKey, ttl, persistToStorage]
  );

  const invalidate = useCallback(
    (...params: P) => {
      const key = generateKey(...params);
      cacheRef.current.delete(key);
      if (persistToStorage) {
        AsyncStorage.removeItem(`query:${key}`).catch(() => {});
      }
    },
    [generateKey, persistToStorage]
  );

  const invalidateAll = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const prefetch = useCallback(
    async (...params: P) => {
      const data = await queryFn(...params);
      await set(data, ...params);
    },
    [queryFn, set]
  );

  return {
    cache: cacheRef.current,
    get,
    set,
    invalidate,
    invalidateAll,
    prefetch,
  };
}

export function clearAllCache(): void {
  memoryCache.clear();
}

export async function clearStoredCache(prefix = "cache:"): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(prefix));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch {
  }
}
