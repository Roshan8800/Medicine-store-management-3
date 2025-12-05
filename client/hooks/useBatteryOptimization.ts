import { useCallback, useRef, useEffect, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";

export interface BatteryState {
  level: number | null;
  isCharging: boolean;
  isLowPowerMode: boolean;
}

export interface NetworkState {
  isConnected: boolean;
  connectionType: string | null;
  isWifi: boolean;
  isCellular: boolean;
  isExpensive: boolean;
}

export interface OptimizationSettings {
  reducedAnimations: boolean;
  reducedPollingFrequency: boolean;
  deferredOperations: boolean;
  reducedImageQuality: boolean;
  backgroundSyncDisabled: boolean;
  locationUpdatesReduced: boolean;
}

export type PowerMode = "normal" | "balanced" | "powersave";

export function useBatteryOptimization() {
  const [batteryState, setBatteryState] = useState<BatteryState>({
    level: null,
    isCharging: false,
    isLowPowerMode: false,
  });

  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    connectionType: null,
    isWifi: false,
    isCellular: false,
    isExpensive: false,
  });

  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [powerMode, setPowerMode] = useState<PowerMode>("normal");
  const deferredOperationsRef = useRef<Array<{ fn: () => void; priority: number }>>([]);
  const isProcessingDeferredRef = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: state.isConnected ?? true,
        connectionType: state.type,
        isWifi: state.type === "wifi",
        isCellular: state.type === "cellular",
        isExpensive: state.details?.isConnectionExpensive ?? false,
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setAppState(nextState);
      
      if (nextState === "active") {
        processDeferredOperations();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const batteryLevel = batteryState.level;
    const isCharging = batteryState.isCharging;
    const isLowPower = batteryState.isLowPowerMode;
    const isBackground = appState !== "active";
    const isCellular = networkState.isCellular;

    if (isLowPower || (batteryLevel !== null && batteryLevel < 0.15)) {
      setPowerMode("powersave");
    } else if (
      isBackground ||
      isCellular ||
      (batteryLevel !== null && batteryLevel < 0.3 && !isCharging)
    ) {
      setPowerMode("balanced");
    } else {
      setPowerMode("normal");
    }
  }, [batteryState, appState, networkState]);

  const getOptimizationSettings = useCallback((): OptimizationSettings => {
    switch (powerMode) {
      case "powersave":
        return {
          reducedAnimations: true,
          reducedPollingFrequency: true,
          deferredOperations: true,
          reducedImageQuality: true,
          backgroundSyncDisabled: true,
          locationUpdatesReduced: true,
        };
      case "balanced":
        return {
          reducedAnimations: false,
          reducedPollingFrequency: true,
          deferredOperations: false,
          reducedImageQuality: true,
          backgroundSyncDisabled: false,
          locationUpdatesReduced: true,
        };
      default:
        return {
          reducedAnimations: false,
          reducedPollingFrequency: false,
          deferredOperations: false,
          reducedImageQuality: false,
          backgroundSyncDisabled: false,
          locationUpdatesReduced: false,
        };
    }
  }, [powerMode]);

  const getPollingInterval = useCallback((baseInterval: number): number => {
    const multipliers: Record<PowerMode, number> = {
      normal: 1,
      balanced: 2,
      powersave: 4,
    };
    return baseInterval * multipliers[powerMode];
  }, [powerMode]);

  const getAnimationDuration = useCallback((baseDuration: number): number => {
    const settings = getOptimizationSettings();
    return settings.reducedAnimations ? 0 : baseDuration;
  }, [getOptimizationSettings]);

  const getImageQuality = useCallback((): number => {
    const qualities: Record<PowerMode, number> = {
      normal: 1,
      balanced: 0.7,
      powersave: 0.5,
    };
    return qualities[powerMode];
  }, [powerMode]);

  const deferOperation = useCallback((
    operation: () => void,
    priority: number = 5
  ) => {
    const settings = getOptimizationSettings();
    
    if (!settings.deferredOperations || appState === "active") {
      operation();
      return;
    }

    deferredOperationsRef.current.push({ fn: operation, priority });
    deferredOperationsRef.current.sort((a, b) => b.priority - a.priority);
  }, [getOptimizationSettings, appState]);

  const processDeferredOperations = useCallback(async () => {
    if (isProcessingDeferredRef.current) return;
    isProcessingDeferredRef.current = true;

    const operations = [...deferredOperationsRef.current];
    deferredOperationsRef.current = [];

    for (const op of operations) {
      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            op.fn();
            resolve();
          });
        });
      } catch (error) {
        console.warn("Deferred operation failed:", error);
      }
    }

    isProcessingDeferredRef.current = false;
  }, []);

  const shouldPerformBackgroundSync = useCallback((): boolean => {
    const settings = getOptimizationSettings();
    if (settings.backgroundSyncDisabled) return false;
    if (!networkState.isConnected) return false;
    if (networkState.isExpensive && powerMode !== "normal") return false;
    return true;
  }, [getOptimizationSettings, networkState, powerMode]);

  const shouldFetchHighResImages = useCallback((): boolean => {
    if (powerMode === "powersave") return false;
    if (networkState.isCellular && networkState.isExpensive) return false;
    return true;
  }, [powerMode, networkState]);

  const shouldEnableAutoRefresh = useCallback((): boolean => {
    return powerMode === "normal" && appState === "active";
  }, [powerMode, appState]);

  const shouldPlayAnimations = useCallback((): boolean => {
    return !getOptimizationSettings().reducedAnimations;
  }, [getOptimizationSettings]);

  const getLocationUpdateInterval = useCallback((baseInterval: number): number => {
    const settings = getOptimizationSettings();
    if (settings.locationUpdatesReduced) {
      return baseInterval * 3;
    }
    return baseInterval;
  }, [getOptimizationSettings]);

  const withBatteryOptimization = useCallback(<T extends (...args: any[]) => any>(
    normalFn: T,
    powersaveFn: T,
    balancedFn?: T
  ): T => {
    return ((...args: Parameters<T>) => {
      switch (powerMode) {
        case "powersave":
          return powersaveFn(...args);
        case "balanced":
          return (balancedFn || normalFn)(...args);
        default:
          return normalFn(...args);
      }
    }) as T;
  }, [powerMode]);

  return {
    batteryState,
    networkState,
    appState,
    powerMode,
    getOptimizationSettings,
    getPollingInterval,
    getAnimationDuration,
    getImageQuality,
    deferOperation,
    processDeferredOperations,
    shouldPerformBackgroundSync,
    shouldFetchHighResImages,
    shouldEnableAutoRefresh,
    shouldPlayAnimations,
    getLocationUpdateInterval,
    withBatteryOptimization,
    isInBackground: appState !== "active",
    isOnWifi: networkState.isWifi,
    isOnCellular: networkState.isCellular,
    isConnected: networkState.isConnected,
  };
}

export function usePowerAwareInterval(
  callback: () => void,
  baseInterval: number,
  deps: any[] = []
) {
  const { getPollingInterval, appState } = useBatteryOptimization();
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (appState !== "active") return;

    const interval = getPollingInterval(baseInterval);
    const tick = () => savedCallback.current();

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [baseInterval, getPollingInterval, appState, ...deps]);
}

export function usePowerAwareEffect(
  effect: () => void | (() => void),
  deps: any[],
  options: {
    skipInBackground?: boolean;
    skipInPowersave?: boolean;
    debounceMs?: number;
  } = {}
) {
  const { appState, powerMode } = useBatteryOptimization();
  const { skipInBackground = true, skipInPowersave = false, debounceMs = 0 } = options;
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (skipInBackground && appState !== "active") return;
    if (skipInPowersave && powerMode === "powersave") return;

    if (debounceMs > 0) {
      debounceRef.current = setTimeout(effect, debounceMs);
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }

    return effect();
  }, [appState, powerMode, skipInBackground, skipInPowersave, debounceMs, ...deps]);
}
