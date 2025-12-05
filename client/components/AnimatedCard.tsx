import React, { useCallback } from "react";
import { StyleSheet, Pressable, ViewStyle } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  enableTilt?: boolean;
  enableScale?: boolean;
  style?: ViewStyle;
}

export function AnimatedCard({
  children,
  onPress,
  onLongPress,
  onDoubleTap,
  enableTilt = true,
  enableScale = true,
  style,
}: AnimatedCardProps) {
  const { theme } = useTheme();
  
  const scale = useSharedValue(1);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const isPressed = useSharedValue(false);

  const triggerHaptic = useCallback((type: "light" | "medium" | "heavy" = "light") => {
    const feedbackTypes = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    Haptics.impactAsync(feedbackTypes[type]);
  }, []);

  const handlePress = useCallback(() => {
    if (onPress) {
      triggerHaptic("light");
      onPress();
    }
  }, [onPress, triggerHaptic]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      triggerHaptic("heavy");
      onLongPress();
    }
  }, [onLongPress, triggerHaptic]);

  const handleDoubleTap = useCallback(() => {
    if (onDoubleTap) {
      triggerHaptic("medium");
      onDoubleTap();
    }
  }, [onDoubleTap, triggerHaptic]);

  const tapGesture = Gesture.Tap()
    .onStart(() => {
      if (enableScale) {
        scale.value = withSpring(0.98);
      }
      isPressed.value = true;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      isPressed.value = false;
      runOnJS(handlePress)();
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
      isPressed.value = false;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTap)();
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      scale.value = withSpring(0.95);
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      runOnJS(handleLongPress)();
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (enableTilt && isPressed.value) {
        rotateY.value = interpolate(
          event.translationX,
          [-50, 50],
          [-5, 5]
        );
        rotateX.value = interpolate(
          event.translationY,
          [-50, 50],
          [5, -5]
        );
      }
    })
    .onEnd(() => {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
    });

  const composedGesture = Gesture.Race(
    Gesture.Exclusive(doubleTapGesture, tapGesture),
    longPressGesture,
    panGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle, style]}>
        <Card style={styles.card}>
          {children}
        </Card>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
  },
  card: {
    overflow: "hidden",
  },
});
