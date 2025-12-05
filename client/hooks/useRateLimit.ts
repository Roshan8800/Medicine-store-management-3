import { useState, useCallback, useRef, useEffect } from "react";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  onLimitReached?: () => void;
  onReset?: () => void;
}

export interface RateLimitState {
  requestCount: number;
  isLimited: boolean;
  remainingRequests: number;
  resetAt: Date | null;
  timeUntilReset: number;
}

export function useRateLimit(config: RateLimitConfig) {
  const { maxRequests, windowMs, onLimitReached, onReset } = config;

  const [state, setState] = useState<RateLimitState>({
    requestCount: 0,
    isLimited: false,
    remainingRequests: maxRequests,
    resetAt: null,
    timeUntilReset: 0,
  });

  const requestTimestamps = useRef<number[]>([]);
  const resetTimeoutRef = useRef<NodeJS.Timeout>();
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  const cleanup = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const pruneOldRequests = useCallback(() => {
    const now = Date.now();
    const cutoff = now - windowMs;
    requestTimestamps.current = requestTimestamps.current.filter((ts) => ts > cutoff);
  }, [windowMs]);

  const updateState = useCallback(() => {
    pruneOldRequests();
    const count = requestTimestamps.current.length;
    const isLimited = count >= maxRequests;
    const remainingRequests = Math.max(0, maxRequests - count);

    let resetAt: Date | null = null;
    let timeUntilReset = 0;

    if (requestTimestamps.current.length > 0) {
      const oldestRequest = requestTimestamps.current[0];
      resetAt = new Date(oldestRequest + windowMs);
      timeUntilReset = Math.max(0, resetAt.getTime() - Date.now());
    }

    setState({
      requestCount: count,
      isLimited,
      remainingRequests,
      resetAt,
      timeUntilReset,
    });

    return { isLimited, remainingRequests };
  }, [pruneOldRequests, maxRequests, windowMs]);

  const checkLimit = useCallback((): boolean => {
    const { isLimited } = updateState();
    return !isLimited;
  }, [updateState]);

  const recordRequest = useCallback(() => {
    pruneOldRequests();

    if (requestTimestamps.current.length >= maxRequests) {
      onLimitReached?.();
      updateState();
      return false;
    }

    requestTimestamps.current.push(Date.now());
    const { isLimited } = updateState();

    if (isLimited) {
      onLimitReached?.();
    }

    if (requestTimestamps.current.length === 1) {
      resetTimeoutRef.current = setTimeout(() => {
        requestTimestamps.current = [];
        updateState();
        onReset?.();
      }, windowMs);

      updateIntervalRef.current = setInterval(() => {
        updateState();
      }, 1000);
    }

    return true;
  }, [pruneOldRequests, maxRequests, updateState, onLimitReached, onReset, windowMs]);

  const executeWithLimit = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<{ success: boolean; result?: T; error?: string }> => {
    if (!recordRequest()) {
      return { success: false, error: "Rate limit exceeded" };
    }

    try {
      const result = await operation();
      return { success: true, result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, [recordRequest]);

  const reset = useCallback(() => {
    cleanup();
    requestTimestamps.current = [];
    setState({
      requestCount: 0,
      isLimited: false,
      remainingRequests: maxRequests,
      resetAt: null,
      timeUntilReset: 0,
    });
    onReset?.();
  }, [cleanup, maxRequests, onReset]);

  return {
    ...state,
    checkLimit,
    recordRequest,
    executeWithLimit,
    reset,
  };
}

export interface ThrottleConfig {
  interval: number;
  leading?: boolean;
  trailing?: boolean;
}

export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  config: ThrottleConfig
) {
  const { interval, leading = true, trailing = true } = config;

  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const [isThrottled, setIsThrottled] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const throttledFn = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const elapsed = now - lastCallRef.current;

    lastArgsRef.current = args;

    if (elapsed >= interval) {
      if (leading) {
        lastCallRef.current = now;
        fn(...args);
      }
      setIsThrottled(false);
    } else {
      setIsThrottled(true);

      if (trailing && !timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          if (lastArgsRef.current) {
            fn(...lastArgsRef.current);
          }
          timeoutRef.current = undefined;
          setIsThrottled(false);
        }, interval - elapsed);
      }
    }
  }, [fn, interval, leading, trailing]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setIsThrottled(false);
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
      if (lastArgsRef.current) {
        fn(...lastArgsRef.current);
      }
      setIsThrottled(false);
    }
  }, [fn]);

  return { throttledFn, cancel, flush, isThrottled };
}

export interface DebouncedRateLimitConfig {
  maxRequests: number;
  windowMs: number;
  debounceMs: number;
}

export function useDebouncedRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  config: DebouncedRateLimitConfig
) {
  const { maxRequests, windowMs, debounceMs } = config;

  const rateLimit = useRateLimit({ maxRequests, windowMs });
  const debounceRef = useRef<NodeJS.Timeout>();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsPending(true);

    debounceRef.current = setTimeout(() => {
      if (rateLimit.checkLimit()) {
        rateLimit.recordRequest();
        fn(...args);
      }
      setIsPending(false);
    }, debounceMs);
  }, [fn, debounceMs, rateLimit]);

  const cancel = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setIsPending(false);
  }, []);

  return {
    debouncedFn,
    cancel,
    isPending,
    ...rateLimit,
  };
}
