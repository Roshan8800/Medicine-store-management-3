import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "info";
type BadgeSize = "small" | "medium" | "large";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: keyof typeof Feather.glyphMap;
  outline?: boolean;
  rounded?: boolean;
  style?: ViewStyle;
}

export function Badge({
  children,
  variant = "default",
  size = "medium",
  icon,
  outline = false,
  rounded = false,
  style,
}: BadgeProps) {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case "primary":
        return { bg: theme.primary, text: "#FFFFFF" };
      case "success":
        return { bg: theme.success, text: "#FFFFFF" };
      case "warning":
        return { bg: theme.warning, text: "#1F2937" };
      case "error":
        return { bg: theme.error, text: "#FFFFFF" };
      case "info":
        return { bg: "#3B82F6", text: "#FFFFFF" };
      default:
        return { bg: theme.textDisabled, text: "#FFFFFF" };
    }
  };

  const colors = getColors();

  const getSizeStyles = (): { container: ViewStyle; fontSize: number; iconSize: number } => {
    switch (size) {
      case "small":
        return {
          container: {
            paddingHorizontal: Spacing.sm,
            paddingVertical: 2,
          },
          fontSize: 10,
          iconSize: 10,
        };
      case "large":
        return {
          container: {
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
          },
          fontSize: 14,
          iconSize: 16,
        };
      default:
        return {
          container: {
            paddingHorizontal: Spacing.md,
            paddingVertical: 4,
          },
          fontSize: 12,
          iconSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        sizeStyles.container,
        {
          backgroundColor: outline ? "transparent" : colors.bg,
          borderColor: colors.bg,
        },
        outline && styles.outline,
        rounded && styles.rounded,
        style,
      ]}
    >
      {icon && (
        <Feather
          name={icon}
          size={sizeStyles.iconSize}
          color={outline ? colors.bg : colors.text}
          style={styles.icon}
        />
      )}
      <ThemedText
        style={[
          styles.text,
          { fontSize: sizeStyles.fontSize, color: outline ? colors.bg : colors.text },
        ]}
      >
        {children}
      </ThemedText>
    </View>
  );
}

export function StatusBadge({
  status,
  size = "small",
}: {
  status: "active" | "inactive" | "pending" | "expired" | "low" | "critical";
  size?: BadgeSize;
}) {
  const getConfig = (): { label: string; variant: BadgeVariant; icon?: keyof typeof Feather.glyphMap } => {
    switch (status) {
      case "active":
        return { label: "Active", variant: "success", icon: "check-circle" };
      case "inactive":
        return { label: "Inactive", variant: "default" };
      case "pending":
        return { label: "Pending", variant: "warning", icon: "clock" };
      case "expired":
        return { label: "Expired", variant: "error", icon: "alert-triangle" };
      case "low":
        return { label: "Low Stock", variant: "warning", icon: "alert-triangle" };
      case "critical":
        return { label: "Critical", variant: "error", icon: "alert-circle" };
    }
  };

  const config = getConfig();

  return (
    <Badge variant={config.variant} size={size} icon={config.icon}>
      {config.label}
    </Badge>
  );
}

export function CountBadge({
  count,
  max = 99,
  variant = "error",
  size = "small",
  showZero = false,
  style,
}: {
  count: number;
  max?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  showZero?: boolean;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();

  if (count === 0 && !showZero) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { minWidth: 16, height: 16, fontSize: 10 };
      case "large":
        return { minWidth: 24, height: 24, fontSize: 14 };
      default:
        return { minWidth: 20, height: 20, fontSize: 12 };
    }
  };

  const sizeStyles = getSizeStyles();

  const getColors = () => {
    switch (variant) {
      case "primary":
        return theme.primary;
      case "success":
        return theme.success;
      case "warning":
        return theme.warning;
      case "error":
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.countBadge,
        {
          minWidth: sizeStyles.minWidth,
          height: sizeStyles.height,
          backgroundColor: getColors(),
        },
        style,
      ]}
    >
      <ThemedText style={[styles.countText, { fontSize: sizeStyles.fontSize }]}>
        {displayCount}
      </ThemedText>
    </View>
  );
}

export function DotBadge({
  color,
  size = 8,
  pulse = false,
  style,
}: {
  color?: string;
  size?: number;
  pulse?: boolean;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const dotColor = color || theme.error;

  return (
    <View style={[styles.dotContainer, style]}>
      {pulse && (
        <View
          style={[
            styles.dotPulse,
            { width: size * 2, height: size * 2, borderRadius: size, backgroundColor: dotColor },
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: dotColor },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  outline: {
    borderWidth: 1,
  },
  rounded: {
    borderRadius: BorderRadius.full,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: "600",
  },
  countBadge: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.full,
    paddingHorizontal: 4,
  },
  countText: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
  },
  dotContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {},
  dotPulse: {
    position: "absolute",
    opacity: 0.3,
  },
});
