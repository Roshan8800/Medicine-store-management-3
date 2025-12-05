import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface FABAction {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  icon?: keyof typeof Feather.glyphMap;
  actions?: FABAction[];
  onPress?: () => void;
  position?: { bottom?: number; right?: number; left?: number };
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingActionButton({
  icon = "plus",
  actions = [],
  onPress,
  position = { bottom: Spacing.xl, right: Spacing.xl },
  style,
}: FloatingActionButtonProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const rotation = useSharedValue(0);
  const progress = useSharedValue(0);

  const handleToggle = useCallback(() => {
    if (actions.length === 0 && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
      return;
    }

    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    rotation.value = withSpring(newIsOpen ? 45 : 0);
    progress.value = withSpring(newIsOpen ? 1 : 0);
  }, [isOpen, actions.length, onPress]);

  const handleActionPress = useCallback((action: FABAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(false);
    rotation.value = withSpring(0);
    progress.value = withSpring(0);
    action.onPress();
  }, []);

  const mainButtonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.5,
    pointerEvents: progress.value > 0 ? "auto" : "none",
  }));

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleToggle} />
      </Animated.View>

      <View style={[styles.container, position, style]}>
        {actions.map((action, index) => {
          const actionStyle = useAnimatedStyle(() => {
            const translateY = interpolate(
              progress.value,
              [0, 1],
              [0, -(index + 1) * 70],
              Extrapolation.CLAMP
            );
            const scale = interpolate(
              progress.value,
              [0, 1],
              [0.5, 1],
              Extrapolation.CLAMP
            );
            const opacity = progress.value;

            return {
              transform: [{ translateY }, { scale }],
              opacity,
            };
          });

          return (
            <Animated.View key={index} style={[styles.actionContainer, actionStyle]}>
              <View style={[styles.labelContainer, { backgroundColor: theme.cardBackground }]}>
                <ThemedText type="small">{action.label}</ThemedText>
              </View>
              <Pressable
                onPress={() => handleActionPress(action)}
                style={[
                  styles.actionButton,
                  { backgroundColor: action.color || theme.accent },
                ]}
              >
                <Feather name={action.icon} size={20} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
          );
        })}

        <AnimatedPressable
          onPress={handleToggle}
          style={[styles.mainButton, mainButtonStyle, { backgroundColor: theme.primary }]}
        >
          <Feather name={icon} size={24} color="#FFFFFF" />
        </AnimatedPressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    zIndex: 99,
  },
  container: {
    position: "absolute",
    alignItems: "center",
    zIndex: 100,
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    right: 0,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  labelContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
});
