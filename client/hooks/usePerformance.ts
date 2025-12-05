import { useCallback, useRef, useEffect, useState } from "react";
import { InteractionManager, LayoutAnimation, Platform } from "react-native";

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  averages: Record<string, number>;
  slowOperations: PerformanceMetric[];
  totalMeasurements: number;
  reportTime: number;
}

export interface PerformanceConfig {
  slowThresholdMs?: number;
  maxStoredMetrics?: number;
  onSlowOperation?: (metric: PerformanceMetric) => void;
  debug?: boolean;
}

export function usePerformance(config: PerformanceConfig = {}) {
  const {
    slowThresholdMs = 100,
    maxStoredMetrics = 100,
    onSlowOperation,
    debug = false,
  } = config;

  const metricsRef = useRef<PerformanceMetric[]>([]);
  const activeTimersRef = useRef<Map<string, number>>(new Map());
  const [frameDrops, setFrameDrops] = useState(0);

  const startTimer = useCallback((name: string, metadata?: Record<string, any>): string => {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    activeTimersRef.current.set(id, performance.now());

    if (debug) {
      console.log(`[Performance] Start: ${name}`);
    }

    return id;
  }, [debug]);

  const endTimer = useCallback((id: string, metadata?: Record<string, any>): PerformanceMetric | null => {
    const startTime = activeTimersRef.current.get(id);
    if (startTime === undefined) {
      if (debug) {
        console.warn(`[Performance] Timer not found: ${id}`);
      }
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const name = id.split("_")[0];

    const metric: PerformanceMetric = {
      name,
      startTime,
      endTime,
      duration,
      metadata,
    };

    activeTimersRef.current.delete(id);

    metricsRef.current.push(metric);
    if (metricsRef.current.length > maxStoredMetrics) {
      metricsRef.current.shift();
    }

    if (duration > slowThresholdMs) {
      if (debug) {
        console.warn(`[Performance] Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }
      onSlowOperation?.(metric);
    } else if (debug) {
      console.log(`[Performance] End: ${name} took ${duration.toFixed(2)}ms`);
    }

    return metric;
  }, [debug, slowThresholdMs, maxStoredMetrics, onSlowOperation]);

  const measureAsync = useCallback(async <T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; duration: number }> => {
    const timerId = startTimer(name, metadata);
    try {
      const result = await operation();
      const metric = endTimer(timerId, metadata);
      return { result, duration: metric?.duration || 0 };
    } catch (error) {
      endTimer(timerId, { ...metadata, error: true });
      throw error;
    }
  }, [startTimer, endTimer]);

  const measureSync = useCallback(<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): { result: T; duration: number } => {
    const timerId = startTimer(name, metadata);
    try {
      const result = operation();
      const metric = endTimer(timerId, metadata);
      return { result, duration: metric?.duration || 0 };
    } catch (error) {
      endTimer(timerId, { ...metadata, error: true });
      throw error;
    }
  }, [startTimer, endTimer]);

  const measureRender = useCallback((componentName: string) => {
    const renderStart = performance.now();

    return () => {
      const duration = performance.now() - renderStart;
      const metric: PerformanceMetric = {
        name: `render_${componentName}`,
        startTime: renderStart,
        endTime: performance.now(),
        duration,
      };

      metricsRef.current.push(metric);

      if (duration > slowThresholdMs && debug) {
        console.warn(`[Performance] Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    };
  }, [slowThresholdMs, debug]);

  const getReport = useCallback((): PerformanceReport => {
    const metrics = [...metricsRef.current];
    const averages: Record<string, number> = {};
    const counts: Record<string, number> = {};

    metrics.forEach((m) => {
      if (m.duration !== undefined) {
        if (!averages[m.name]) {
          averages[m.name] = 0;
          counts[m.name] = 0;
        }
        averages[m.name] += m.duration;
        counts[m.name]++;
      }
    });

    Object.keys(averages).forEach((name) => {
      averages[name] = averages[name] / counts[name];
    });

    const slowOperations = metrics.filter(
      (m) => m.duration !== undefined && m.duration > slowThresholdMs
    );

    return {
      metrics,
      averages,
      slowOperations,
      totalMeasurements: metrics.length,
      reportTime: Date.now(),
    };
  }, [slowThresholdMs]);

  const getMetricsByName = useCallback((name: string): PerformanceMetric[] => {
    return metricsRef.current.filter((m) => m.name === name);
  }, []);

  const getAverageTime = useCallback((name: string): number | null => {
    const metrics = getMetricsByName(name);
    if (metrics.length === 0) return null;

    const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / metrics.length;
  }, [getMetricsByName]);

  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
    activeTimersRef.current.clear();
  }, []);

  const runAfterInteractions = useCallback(<T>(
    operation: () => T | Promise<T>,
    name?: string
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      InteractionManager.runAfterInteractions(() => {
        try {
          const result = operation();
          if (result instanceof Promise) {
            result.then(resolve).catch(reject);
          } else {
            resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }, []);

  const scheduleLayoutAnimation = useCallback((config?: LayoutAnimation.Config) => {
    const animConfig = config || LayoutAnimation.Presets.easeInEaseOut;
    LayoutAnimation.configureNext(animConfig);
  }, []);

  const deferOperation = useCallback(<T>(
    operation: () => T,
    priority: "high" | "normal" | "low" = "normal"
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const delays = { high: 0, normal: 16, low: 100 };
      setTimeout(() => {
        try {
          resolve(operation());
        } catch (error) {
          reject(error);
        }
      }, delays[priority]);
    });
  }, []);

  return {
    startTimer,
    endTimer,
    measureAsync,
    measureSync,
    measureRender,
    getReport,
    getMetricsByName,
    getAverageTime,
    clearMetrics,
    runAfterInteractions,
    scheduleLayoutAnimation,
    deferOperation,
    frameDrops,
  };
}

export function useRenderPerformance(componentName: string) {
  const { measureRender } = usePerformance({ debug: __DEV__ });
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;
    const endMeasure = measureRender(componentName);
    return endMeasure;
  });

  return { renderCount: renderCountRef.current };
}

export function useOperationTiming<T>(
  operation: () => Promise<T>,
  dependencies: any[] = []
) {
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<T | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const res = await operation();
      const end = performance.now();
      setDuration(end - start);
      setResult(res);
      return res;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, dependencies);

  return { execute, isLoading, duration, error, result };
}
