import { useState, useCallback, useRef, useEffect } from "react";

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
  onSuccess?: () => void;
}

export interface ErrorRecoveryState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
  lastAttemptAt: Date | null;
  nextRetryAt: Date | null;
}

export function useErrorRecovery<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryCondition,
    onRetry,
    onMaxRetriesReached,
    onSuccess,
  } = config;

  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true,
    lastAttemptAt: null,
    nextRetryAt: null,
  });

  const [result, setResult] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.3 * delay;
    return Math.min(delay + jitter, maxDelay);
  }, [initialDelay, backoffMultiplier, maxDelay]);

  const shouldRetry = useCallback((error: Error, attempt: number): boolean => {
    if (attempt >= maxRetries) return false;
    if (retryCondition) return retryCondition(error, attempt);

    const nonRetryableErrors = [
      "AUTHENTICATION_ERROR",
      "AUTHORIZATION_ERROR",
      "VALIDATION_ERROR",
      "NOT_FOUND",
    ];
    const errorCode = (error as any).code;
    if (errorCode && nonRetryableErrors.includes(errorCode)) {
      return false;
    }

    return true;
  }, [maxRetries, retryCondition]);

  const execute = useCallback(async (): Promise<T | null> => {
    if (!isMountedRef.current) return null;

    setIsLoading(true);
    setState((prev) => ({
      ...prev,
      error: null,
      lastAttemptAt: new Date(),
    }));

    try {
      const res = await operation();
      if (isMountedRef.current) {
        setResult(res);
        setState((prev) => ({
          ...prev,
          error: null,
          retryCount: 0,
          isRetrying: false,
          canRetry: true,
          nextRetryAt: null,
        }));
        onSuccess?.();
      }
      return res;
    } catch (error) {
      if (!isMountedRef.current) return null;

      const err = error as Error;
      const newRetryCount = state.retryCount + 1;
      const canRetry = shouldRetry(err, newRetryCount);

      setState((prev) => ({
        ...prev,
        error: err,
        retryCount: newRetryCount,
        canRetry,
        isRetrying: false,
        nextRetryAt: canRetry ? new Date(Date.now() + calculateDelay(newRetryCount)) : null,
      }));

      if (!canRetry && newRetryCount >= maxRetries) {
        onMaxRetriesReached?.(err);
      }

      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [operation, state.retryCount, shouldRetry, calculateDelay, maxRetries, onSuccess, onMaxRetriesReached]);

  const retry = useCallback(async () => {
    if (!state.canRetry || state.isRetrying) return null;

    onRetry?.(state.error!, state.retryCount);
    return execute();
  }, [state.canRetry, state.isRetrying, state.error, state.retryCount, onRetry, execute]);

  const retryWithDelay = useCallback(async () => {
    if (!state.canRetry || state.isRetrying) return;

    const delay = calculateDelay(state.retryCount + 1);
    
    setState((prev) => ({
      ...prev,
      isRetrying: true,
      nextRetryAt: new Date(Date.now() + delay),
    }));

    retryTimeoutRef.current = setTimeout(async () => {
      if (isMountedRef.current) {
        await retry();
      }
    }, delay);
  }, [state.canRetry, state.isRetrying, state.retryCount, calculateDelay, retry]);

  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: true,
      lastAttemptAt: null,
      nextRetryAt: null,
    });
    setResult(null);
  }, []);

  const cancelRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setState((prev) => ({
      ...prev,
      isRetrying: false,
      nextRetryAt: null,
    }));
  }, []);

  return {
    execute,
    retry,
    retryWithDelay,
    reset,
    cancelRetry,
    result,
    isLoading,
    ...state,
  };
}

export function useRetryOperation<T, A extends any[]>(
  operation: (...args: A) => Promise<T>,
  config: RetryConfig = {}
) {
  const argsRef = useRef<A | null>(null);

  const wrappedOperation = useCallback(async () => {
    if (!argsRef.current) {
      throw new Error("No arguments provided");
    }
    return operation(...argsRef.current);
  }, [operation]);

  const recovery = useErrorRecovery(wrappedOperation, config);

  const executeWithArgs = useCallback(async (...args: A) => {
    argsRef.current = args;
    return recovery.execute();
  }, [recovery]);

  return {
    ...recovery,
    execute: executeWithArgs,
  };
}

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  recoveryTimeout?: number;
  halfOpenRequests?: number;
}

export function useCircuitBreaker<T>(
  operation: () => Promise<T>,
  config: CircuitBreakerConfig = {}
) {
  const {
    failureThreshold = 5,
    recoveryTimeout = 30000,
    halfOpenRequests = 1,
  } = config;

  const [state, setState] = useState<"closed" | "open" | "half-open">("closed");
  const [failures, setFailures] = useState(0);
  const [halfOpenAttempts, setHalfOpenAttempts] = useState(0);
  const [lastFailure, setLastFailure] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const trip = useCallback(() => {
    setState("open");
    setLastFailure(new Date());

    timeoutRef.current = setTimeout(() => {
      setState("half-open");
      setHalfOpenAttempts(0);
    }, recoveryTimeout);
  }, [recoveryTimeout]);

  const reset = useCallback(() => {
    setState("closed");
    setFailures(0);
    setHalfOpenAttempts(0);
    setLastFailure(null);
  }, []);

  const execute = useCallback(async (): Promise<T> => {
    if (state === "open") {
      throw new Error("Circuit breaker is open");
    }

    try {
      const result = await operation();

      if (state === "half-open") {
        setHalfOpenAttempts((prev) => prev + 1);
        if (halfOpenAttempts + 1 >= halfOpenRequests) {
          reset();
        }
      } else {
        setFailures(0);
      }

      return result;
    } catch (error) {
      setFailures((prev) => prev + 1);

      if (state === "half-open") {
        trip();
      } else if (failures + 1 >= failureThreshold) {
        trip();
      }

      throw error;
    }
  }, [state, operation, failures, failureThreshold, halfOpenAttempts, halfOpenRequests, trip, reset]);

  return {
    execute,
    reset,
    state,
    failures,
    lastFailure,
    isOpen: state === "open",
    isClosed: state === "closed",
    isHalfOpen: state === "half-open",
  };
}
