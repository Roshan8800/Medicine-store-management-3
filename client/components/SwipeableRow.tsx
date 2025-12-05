import React, { useCallback } from "react";
import { View, StyleSheet, Pressable, ViewStyle } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SwipeAction {
  icon: keyof typeof Feather.glyphMap;
  color: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  style?: ViewStyle;
}

const ACTION_WIDTH = 70;

export function SwipeableRow({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 0.3,
  style,
}: SwipeableRowProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const rowHeight = useSharedValue(0);

  const maxLeftSwipe = leftActions.length * ACTION_WIDTH;
  const maxRightSwipe = rightActions.length * ACTION_WIDTH;

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleLeftAction = useCallback((action: SwipeAction) => {
    action.onPress();
    translateX.value = withSpring(0);
  }, []);

  const handleRightAction = useCallback((action: SwipeAction) => {
    action.onPress();
    translateX.value = withSpring(0);
  }, []);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      const newX = event.translationX;
      
      if (newX > 0 && leftActions.length > 0) {
        translateX.value = Math.min(newX, maxLeftSwipe * 1.2);
      } else if (newX < 0 && rightActions.length > 0) {
        translateX.value = Math.max(newX, -maxRightSwipe * 1.2);
      }
    })
    .onEnd((event) => {
      const velocityThreshold = 500;
      
      if (translateX.value > maxLeftSwipe * threshold || event.velocityX > velocityThreshold) {
        if (leftActions.length > 0) {
          translateX.value = withSpring(maxLeftSwipe);
          runOnJS(triggerHaptic)();
        }
      } else if (translateX.value < -maxRightSwipe * threshold || event.velocityX < -velocityThreshold) {
        if (rightActions.length > 0) {
          translateX.value = withSpring(-maxRightSwipe);
          runOnJS(triggerHaptic)();
        }
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionsStyle = useAnimatedStyle(() => {
    const width = Math.max(0, translateX.value);
    return {
      width,
      opacity: interpolate(translateX.value, [0, maxLeftSwipe * 0.5], [0, 1]),
    };
  });

  const rightActionsStyle = useAnimatedStyle(() => {
    const width = Math.max(0, -translateX.value);
    return {
      width,
      opacity: interpolate(-translateX.value, [0, maxRightSwipe * 0.5], [0, 1]),
    };
  });

  return (
    <View style={[styles.container, style]}>
      {leftActions.length > 0 ? (
        <Animated.View style={[styles.actionsLeft, leftActionsStyle]}>
          {leftActions.map((action, index) => (
            <Pressable
              key={index}
              style={[styles.action, { backgroundColor: action.color }]}
              onPress={() => handleLeftAction(action)}
            >
              <Feather name={action.icon} size={22} color="#FFFFFF" />
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      <GestureDetector gesture={panGesture}>
        <Animated.View 
          style={[styles.row, rowStyle, { backgroundColor: theme.cardBackground }]}
          onLayout={(e) => {
            rowHeight.value = e.nativeEvent.layout.height;
          }}
        >
          {children}
        </Animated.View>
      </GestureDetector>

      {rightActions.length > 0 ? (
        <Animated.View style={[styles.actionsRight, rightActionsStyle]}>
          {rightActions.map((action, index) => (
            <Pressable
              key={index}
              style={[styles.action, { backgroundColor: action.color }]}
              onPress={() => handleRightAction(action)}
            >
              <Feather name={action.icon} size={22} color="#FFFFFF" />
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    borderRadius: BorderRadius.md,
  },
  row: {
    zIndex: 1,
  },
  actionsLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  actionsRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  action: {
    width: ACTION_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
