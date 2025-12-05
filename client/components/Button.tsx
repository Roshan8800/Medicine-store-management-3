import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SIZE_STYLES: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  small: { height: 36, paddingHorizontal: 12, fontSize: 13 },
  medium: { height: 44, paddingHorizontal: 16, fontSize: 14 },
  large: { height: 52, paddingHorizontal: 24, fontSize: 16 },
};

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
  size = "medium",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const getVariantStyles = (): { backgroundColor: string; textColor: string; borderColor?: string } => {
    switch (variant) {
      case "primary":
        return { backgroundColor: theme.primary, textColor: "#FFFFFF" };
      case "secondary":
        return { backgroundColor: theme.backgroundSecondary, textColor: theme.textDefault };
      case "outline":
        return { backgroundColor: "transparent", textColor: theme.primary, borderColor: theme.primary };
      case "ghost":
        return { backgroundColor: "transparent", textColor: theme.primary };
      case "destructive":
        return { backgroundColor: theme.error, textColor: "#FFFFFF" };
      default:
        return { backgroundColor: theme.primary, textColor: "#FFFFFF" };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: isDisabled ? 0.5 : 1,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor: variantStyles.borderColor,
        },
        fullWidth && styles.fullWidth,
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      ) : (
        <>
          {leftIcon}
          <ThemedText
            type="body"
            style={[
              styles.buttonText,
              { color: variantStyles.textColor, fontSize: sizeStyles.fontSize },
            ]}
          >
            {children}
          </ThemedText>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  );
}

export function IconButton({
  onPress,
  icon,
  size = "medium",
  variant = "ghost",
  disabled = false,
  style,
}: {
  onPress?: () => void;
  icon: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.9, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const getSize = () => {
    switch (size) {
      case "small": return 32;
      case "medium": return 40;
      case "large": return 48;
    }
  };

  const buttonSize = getSize();

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.iconButton,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor: variant === "ghost" ? "transparent" : theme.backgroundSecondary,
          opacity: disabled ? 0.5 : 1,
        },
        style,
        animatedStyle,
      ]}
    >
      {icon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  fullWidth: {
    width: "100%",
  },
  buttonText: {
    fontWeight: "600",
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
