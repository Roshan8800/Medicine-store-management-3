import { useState, useEffect, useCallback } from "react";

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
}

interface UseNetworkStatusResult extends NetworkStatus {
  refresh: () => Promise<void>;
}

export function useNetworkStatus(): UseNetworkStatusResult {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: "unknown",
    isWifi: false,
    isCellular: false,
  });

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch("https://www.google.com/generate_204", {
        method: "HEAD",
        cache: "no-cache",
      });
      setStatus((prev) => ({
        ...prev,
        isConnected: true,
        isInternetReachable: response.ok,
      }));
    } catch {
      setStatus((prev) => ({
        ...prev,
        isConnected: false,
        isInternetReachable: false,
      }));
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const handleOnline = () => {
      setStatus((prev) => ({
        ...prev,
        isConnected: true,
        isInternetReachable: true,
      }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isConnected: false,
        isInternetReachable: false,
      }));
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [checkConnection]);

  const refresh = useCallback(async () => {
    await checkConnection();
  }, [checkConnection]);

  return {
    ...status,
    refresh,
  };
}

interface UseOnlineCallbackConfig {
  onOnline?: () => void;
  onOffline?: () => void;
}

export function useOnlineCallback({ onOnline, onOffline }: UseOnlineCallbackConfig) {
  const { isConnected } = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setWasOffline(true);
      onOffline?.();
    } else if (wasOffline && isConnected) {
      onOnline?.();
      setWasOffline(false);
    }
  }, [isConnected, wasOffline, onOnline, onOffline]);
}
