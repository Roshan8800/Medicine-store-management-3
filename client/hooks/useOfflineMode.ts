import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OfflineAction {
  id: string;
  type: "create" | "update" | "delete";
  endpoint: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface OfflineModeResult {
  isOnline: boolean;
  isOffline: boolean;
  pendingActions: number;
  queueAction: (action: Omit<OfflineAction, "id" | "timestamp">) => Promise<void>;
  syncPendingActions: () => Promise<void>;
  clearPendingActions: () => Promise<void>;
}

const PENDING_ACTIONS_KEY = "binayak_pending_actions";

export function useOfflineMode(): OfflineModeResult {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(!!online);
      
      if (online && pendingActions.length > 0) {
        syncPendingActions();
      }
    });

    loadPendingActions();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadPendingActions = async () => {
    try {
      const stored = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
      if (stored) {
        setPendingActions(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load pending actions:", error);
    }
  };

  const savePendingActions = async (actions: OfflineAction[]) => {
    try {
      await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
      setPendingActions(actions);
    } catch (error) {
      console.error("Failed to save pending actions:", error);
    }
  };

  const queueAction = useCallback(async (action: Omit<OfflineAction, "id" | "timestamp">) => {
    const newAction: OfflineAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    const updatedActions = [...pendingActions, newAction];
    await savePendingActions(updatedActions);
  }, [pendingActions]);

  const syncPendingActions = useCallback(async () => {
    if (pendingActions.length === 0 || !isOnline) return;

    const actionsToSync = [...pendingActions];
    const failedActions: OfflineAction[] = [];

    for (const action of actionsToSync) {
      try {
        const method = action.type === "create" ? "POST" : action.type === "update" ? "PATCH" : "DELETE";
        await fetch(action.endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.data),
        });
      } catch (error) {
        failedActions.push(action);
      }
    }

    await savePendingActions(failedActions);
  }, [pendingActions, isOnline]);

  const clearPendingActions = useCallback(async () => {
    await AsyncStorage.removeItem(PENDING_ACTIONS_KEY);
    setPendingActions([]);
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    pendingActions: pendingActions.length,
    queueAction,
    syncPendingActions,
    clearPendingActions,
  };
}
