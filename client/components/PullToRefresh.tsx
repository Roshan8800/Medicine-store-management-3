import React, { useCallback, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshThreshold = 80,
}: PullToRefreshProps) {
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const translateY = useSharedValue(0);
  const isAtTop = useSharedValue(true);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      translateY.value = withSpring(0);
    }
  }, [onRefresh]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!isRefreshing && event.translationY > 0 && isAtTop.value) {
        translateY.value = Math.min(event.translationY * 0.5, refreshThreshold * 1.5);
      }
    })
    .onEnd(() => {
      if (translateY.value >= refreshThreshold && !isRefreshing) {
        translateY.value = withSpring(refreshThreshold);
        runOnJS(triggerHaptic)();
        runOnJS(handleRefresh)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateY.value,
      [0, refreshThreshold],
      [0.5, 1],
      Extrapolation.CLAMP
    );
    const rotate = interpolate(
      translateY.value,
      [0, refreshThreshold],
      [0, 360],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      translateY.value,
      [0, refreshThreshold * 0.3],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { rotate: `${rotate}deg` }],
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      <View style={[styles.indicatorContainer, { top: -50 }]}>
        <Animated.View style={[styles.indicator, indicatorStyle]}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Feather name="refresh-cw" size={24} color={theme.primary} />
          )}
        </Animated.View>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.content, containerStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  indicatorContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    zIndex: 10,
  },
  indicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
});
