import { useCallback, useRef } from "react";
import { Gesture, GestureType } from "react-native-gesture-handler";
import { useSharedValue, withSpring, withTiming, runOnJS, SharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

export interface SwipeActionConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipeGesture(config: SwipeActionConfig) {
  const translateX = useSharedValue(0);
  const threshold = config.threshold || 80;

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.max(-200, Math.min(200, event.translationX));
    })
    .onEnd((event) => {
      if (event.translationX < -threshold && config.onSwipeLeft) {
        runOnJS(triggerHaptic)();
        runOnJS(config.onSwipeLeft)();
      } else if (event.translationX > threshold && config.onSwipeRight) {
        runOnJS(triggerHaptic)();
        runOnJS(config.onSwipeRight)();
      }
      translateX.value = withSpring(0);
    });

  return { gesture, translateX };
}

export interface LongPressConfig {
  onLongPress: () => void;
  duration?: number;
}

export function useLongPressGesture(config: LongPressConfig) {
  const scale = useSharedValue(1);
  const isPressed = useSharedValue(false);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const gesture = Gesture.LongPress()
    .minDuration(config.duration || 500)
    .onStart(() => {
      isPressed.value = true;
      scale.value = withSpring(0.95);
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      isPressed.value = false;
      runOnJS(triggerHaptic)();
      runOnJS(config.onLongPress)();
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
      isPressed.value = false;
    });

  return { gesture, scale, isPressed };
}

export interface DoubleTapConfig {
  onDoubleTap: () => void;
}

export function useDoubleTapGesture(config: DoubleTapConfig) {
  const scale = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const gesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      scale.value = withSpring(1.1);
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      runOnJS(triggerHaptic)();
      runOnJS(config.onDoubleTap)();
    });

  return { gesture, scale };
}

export interface PinchZoomConfig {
  minScale?: number;
  maxScale?: number;
}

export function usePinchZoomGesture(config: PinchZoomConfig = {}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const minScale = config.minScale || 0.5;
  const maxScale = config.maxScale || 3;

  const gesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(newScale, minScale), maxScale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const resetZoom = useCallback(() => {
    scale.value = withSpring(1);
    savedScale.value = 1;
  }, []);

  return { gesture, scale, resetZoom };
}

export interface PanGestureConfig {
  clampX?: [number, number];
  clampY?: [number, number];
}

export function usePanGesture(config: PanGestureConfig = {}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      let newX = startX.value + event.translationX;
      let newY = startY.value + event.translationY;

      if (config.clampX) {
        newX = Math.min(Math.max(newX, config.clampX[0]), config.clampX[1]);
      }
      if (config.clampY) {
        newY = Math.min(Math.max(newY, config.clampY[0]), config.clampY[1]);
      }

      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    });

  const reset = useCallback(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  }, []);

  return { gesture, translateX, translateY, reset };
}

export interface DragReorderConfig<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  itemHeight: number;
}

export function useDragReorderGesture<T>(config: DragReorderConfig<T>) {
  const activeIndex = useSharedValue(-1);
  const positions = useSharedValue<number[]>([]);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const createGesture = useCallback((index: number) => {
    return Gesture.Pan()
      .activateAfterLongPress(300)
      .onStart(() => {
        activeIndex.value = index;
        runOnJS(triggerHaptic)();
      })
      .onUpdate((event) => {
        const newIndex = Math.round(
          (index * config.itemHeight + event.translationY) / config.itemHeight
        );
        const clampedIndex = Math.max(0, Math.min(config.items.length - 1, newIndex));
        
        if (clampedIndex !== index) {
          const newItems = [...config.items];
          const [removed] = newItems.splice(index, 1);
          newItems.splice(clampedIndex, 0, removed);
          runOnJS(config.onReorder)(newItems);
        }
      })
      .onEnd(() => {
        activeIndex.value = -1;
      });
  }, [config.items, config.itemHeight, config.onReorder]);

  return { createGesture, activeIndex };
}

export function useShakeDetection(onShake: () => void) {
  const lastShake = useRef(0);
  const shakeThreshold = 800;
  const cooldown = 1000;

  const handleShake = useCallback(() => {
    const now = Date.now();
    if (now - lastShake.current > cooldown) {
      lastShake.current = now;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onShake();
    }
  }, [onShake]);

  return { handleShake, shakeThreshold };
}

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const translateY = useSharedValue(0);
  const isRefreshing = useSharedValue(false);
  const threshold = 80;

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const doRefresh = useCallback(async () => {
    await onRefresh();
    isRefreshing.value = false;
    translateY.value = withSpring(0);
  }, [onRefresh]);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!isRefreshing.value && event.translationY > 0) {
        translateY.value = Math.min(event.translationY * 0.5, threshold * 1.5);
      }
    })
    .onEnd(() => {
      if (translateY.value >= threshold && !isRefreshing.value) {
        isRefreshing.value = true;
        runOnJS(triggerHaptic)();
        runOnJS(doRefresh)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  return { gesture, translateY, isRefreshing };
}

export function useRotationGesture() {
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  const gesture = Gesture.Rotation()
    .onUpdate((event) => {
      rotation.value = savedRotation.value + event.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    });

  const reset = useCallback(() => {
    rotation.value = withSpring(0);
    savedRotation.value = 0;
  }, []);

  return { gesture, rotation, reset };
}
