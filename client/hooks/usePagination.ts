import { useState, useCallback, useEffect, useRef } from "react";

interface PaginationConfig<T> {
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean; total?: number }>;
  limit?: number;
  initialPage?: number;
  onError?: (error: Error) => void;
}

interface PaginationResult<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: Error | null;
  page: number;
  hasMore: boolean;
  total: number | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  updateItem: (predicate: (item: T) => boolean, updater: (item: T) => T) => void;
  removeItem: (predicate: (item: T) => boolean) => void;
  prependItem: (item: T) => void;
  appendItem: (item: T) => void;
}

export function usePagination<T>({
  fetchFn,
  limit = 20,
  initialPage = 1,
  onError,
}: PaginationConfig<T>): PaginationResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (isLoadingRef.current && !isRefresh) return;

      isLoadingRef.current = true;

      try {
        const result = await fetchFn(pageNum, limit);

        if (!isMountedRef.current) return;

        if (isRefresh || pageNum === initialPage) {
          setData(result.data);
        } else {
          setData((prev) => [...prev, ...result.data]);
        }

        setHasMore(result.hasMore);
        if (result.total !== undefined) {
          setTotal(result.total);
        }
        setPage(pageNum);
        setError(null);
      } catch (err) {
        if (!isMountedRef.current) return;

        const error = err instanceof Error ? err : new Error("Failed to fetch data");
        setError(error);
        onError?.(error);
      } finally {
        if (isMountedRef.current) {
          isLoadingRef.current = false;
          setIsLoading(false);
          setIsLoadingMore(false);
          setIsRefreshing(false);
        }
      }
    },
    [fetchFn, limit, initialPage, onError]
  );

  useEffect(() => {
    fetchData(initialPage);
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current) return;

    setIsLoadingMore(true);
    await fetchData(page + 1);
  }, [hasMore, page, fetchData]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setHasMore(true);
    await fetchData(initialPage, true);
  }, [fetchData, initialPage]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setTotal(null);
    setError(null);
    setIsLoading(true);
    fetchData(initialPage);
  }, [initialPage, fetchData]);

  const updateItem = useCallback(
    (predicate: (item: T) => boolean, updater: (item: T) => T) => {
      setData((prev) =>
        prev.map((item) => (predicate(item) ? updater(item) : item))
      );
    },
    []
  );

  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setData((prev) => prev.filter((item) => !predicate(item)));
    if (total !== null) {
      setTotal((prev) => (prev !== null ? prev - 1 : null));
    }
  }, [total]);

  const prependItem = useCallback((item: T) => {
    setData((prev) => [item, ...prev]);
    if (total !== null) {
      setTotal((prev) => (prev !== null ? prev + 1 : null));
    }
  }, [total]);

  const appendItem = useCallback((item: T) => {
    setData((prev) => [...prev, item]);
    if (total !== null) {
      setTotal((prev) => (prev !== null ? prev + 1 : null));
    }
  }, [total]);

  return {
    data,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    page,
    hasMore,
    total,
    loadMore,
    refresh,
    reset,
    setData,
    updateItem,
    removeItem,
    prependItem,
    appendItem,
  };
}

interface InfiniteScrollConfig<T> extends PaginationConfig<T> {
  threshold?: number;
}

export function useInfiniteScroll<T>(config: InfiniteScrollConfig<T>) {
  const { threshold = 0.8, ...paginationConfig } = config;
  const pagination = usePagination<T>(paginationConfig);

  const onEndReached = useCallback(() => {
    if (!pagination.isLoadingMore && pagination.hasMore) {
      pagination.loadMore();
    }
  }, [pagination.isLoadingMore, pagination.hasMore, pagination.loadMore]);

  const flatListProps = {
    data: pagination.data,
    onEndReached,
    onEndReachedThreshold: threshold,
    refreshing: pagination.isRefreshing,
    onRefresh: pagination.refresh,
  };

  return {
    ...pagination,
    onEndReached,
    flatListProps,
  };
}

interface CursorPaginationConfig<T, C> {
  fetchFn: (cursor: C | null, limit: number) => Promise<{ data: T[]; nextCursor: C | null }>;
  limit?: number;
  onError?: (error: Error) => void;
}

interface CursorPaginationResult<T, C> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: Error | null;
  cursor: C | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function useCursorPagination<T, C>({
  fetchFn,
  limit = 20,
  onError,
}: CursorPaginationConfig<T, C>): CursorPaginationResult<T, C> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cursor, setCursor] = useState<C | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const isLoadingRef = useRef(false);

  const fetchData = useCallback(
    async (currentCursor: C | null, isRefresh = false) => {
      if (isLoadingRef.current && !isRefresh) return;

      isLoadingRef.current = true;

      try {
        const result = await fetchFn(currentCursor, limit);

        if (isRefresh || currentCursor === null) {
          setData(result.data);
        } else {
          setData((prev) => [...prev, ...result.data]);
        }

        setCursor(result.nextCursor);
        setHasMore(result.nextCursor !== null);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to fetch data");
        setError(error);
        onError?.(error);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [fetchFn, limit, onError]
  );

  useEffect(() => {
    fetchData(null);
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current) return;

    setIsLoadingMore(true);
    await fetchData(cursor);
  }, [hasMore, cursor, fetchData]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setHasMore(true);
    await fetchData(null, true);
  }, [fetchData]);

  const reset = useCallback(() => {
    setData([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setIsLoading(true);
    fetchData(null);
  }, [fetchData]);

  return {
    data,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    cursor,
    hasMore,
    loadMore,
    refresh,
    reset,
  };
}
