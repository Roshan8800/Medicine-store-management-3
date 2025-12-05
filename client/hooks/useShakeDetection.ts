import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { Accelerometer, AccelerometerMeasurement } from "expo-sensors";
import * as Haptics from "expo-haptics";

interface ShakeDetectionConfig {
  threshold?: number;
  cooldown?: number;
  onShake: () => void;
}

export function useShakeDetection({
  threshold = 1.5,
  cooldown = 1000,
  onShake,
}: ShakeDetectionConfig) {
  const lastShake = useRef(0);
  const lastUpdate = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastZ = useRef(0);
  const subscription = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  const handleShake = useCallback(() => {
    const now = Date.now();
    if (now - lastShake.current > cooldown) {
      lastShake.current = now;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onShake();
    }
  }, [cooldown, onShake]);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const subscribe = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) {
        return;
      }

      Accelerometer.setUpdateInterval(100);

      subscription.current = Accelerometer.addListener((data: AccelerometerMeasurement) => {
        const now = Date.now();
        const timeDiff = now - lastUpdate.current;

        if (timeDiff > 100) {
          lastUpdate.current = now;

          const speed = Math.abs(data.x - lastX.current) + 
                       Math.abs(data.y - lastY.current) + 
                       Math.abs(data.z - lastZ.current);

          if (speed > threshold) {
            handleShake();
          }

          lastX.current = data.x;
          lastY.current = data.y;
          lastZ.current = data.z;
        }
      });
    };

    subscribe();

    return () => {
      if (subscription.current) {
        subscription.current.remove();
        subscription.current = null;
      }
    };
  }, [threshold, handleShake]);

  return {
    isSupported: Platform.OS !== "web",
  };
}
