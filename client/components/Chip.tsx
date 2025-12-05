import React, { useCallback } from "react";
import { View, StyleSheet, Pressable, ViewStyle, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type ChipVariant = "filled" | "outlined" | "soft";
type ChipSize = "small" | "medium" | "large";
type ChipColor = "default" | "primary" | "success" | "warning" | "error" | "info";

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  size?: ChipSize;
  color?: ChipColor;
  icon?: keyof typeof Feather.glyphMap;
  avatar?: string;
  selected?: boolean;
  disabled?: boolean;
  deletable?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
}

export function Chip({
  label,
  variant = "filled",
  size = "medium",
  color = "default",
  icon,
  selected = false,
  disabled = false,
  deletable = false,
  onPress,
  onDelete,
  style,
}: ChipProps) {
  const { theme } = useTheme();

  const getColorValues = () => {
    const colors: Record<ChipColor, { main: string; text: string; soft: string }> = {
      default: { main: theme.textSecondary, text: theme.text, soft: theme.backgroundDefault },
      primary: { main: theme.primary, text: "#FFFFFF", soft: theme.primary + "20" },
      success: { main: theme.success, text: "#FFFFFF", soft: theme.success + "20" },
      warning: { main: theme.warning, text: "#1F2937", soft: theme.warning + "20" },
      error: { main: theme.error, text: "#FFFFFF", soft: theme.error + "20" },
      info: { main: "#3B82F6", text: "#FFFFFF", soft: "#3B82F6" + "20" },
    };
    return colors[color];
  };

  const colorValues = getColorValues();

  const getStyles = () => {
    const base = {
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: theme.text,
    };

    switch (variant) {
      case "filled":
        return {
          ...base,
          backgroundColor: selected ? colorValues.main : theme.backgroundDefault,
          textColor: selected ? colorValues.text : theme.text,
        };
      case "outlined":
        return {
          ...base,
          borderColor: selected ? colorValues.main : theme.border,
          textColor: selected ? colorValues.main : theme.text,
        };
      case "soft":
        return {
          ...base,
          backgroundColor: selected ? colorValues.soft : theme.backgroundDefault,
          textColor: selected ? colorValues.main : theme.text,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { height: 24, paddingHorizontal: Spacing.sm, fontSize: 11, iconSize: 12 };
      case "large":
        return { height: 36, paddingHorizontal: Spacing.lg, fontSize: 14, iconSize: 18 };
      default:
        return { height: 30, paddingHorizontal: Spacing.md, fontSize: 13, iconSize: 14 };
    }
  };

  const chipStyles = getStyles();
  const sizeStyles = getSizeStyles();

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [disabled, onPress]);

  const handleDelete = useCallback(() => {
    if (disabled) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDelete?.();
  }, [disabled, onDelete]);

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: chipStyles.backgroundColor,
          borderColor: chipStyles.borderColor,
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
        variant === "outlined" && styles.outlined,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || !onPress}
    >
      {icon && (
        <Feather
          name={icon}
          size={sizeStyles.iconSize}
          color={chipStyles.textColor}
          style={styles.icon}
        />
      )}
      <ThemedText
        style={[styles.label, { fontSize: sizeStyles.fontSize, color: chipStyles.textColor }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
      {deletable && (
        <Pressable onPress={handleDelete} style={styles.deleteButton} hitSlop={8}>
          <Feather
            name="x"
            size={sizeStyles.iconSize}
            color={chipStyles.textColor}
          />
        </Pressable>
      )}
    </Pressable>
  );
}

interface ChipGroupProps {
  chips: Array<{ id: string; label: string; icon?: keyof typeof Feather.glyphMap }>;
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  multiple?: boolean;
  variant?: ChipVariant;
  size?: ChipSize;
  color?: ChipColor;
  style?: ViewStyle;
}

export function ChipGroup({
  chips,
  selectedIds,
  onChange,
  multiple = false,
  variant = "soft",
  size = "medium",
  color = "primary",
  style,
}: ChipGroupProps) {
  const handleChipPress = useCallback(
    (id: string) => {
      if (multiple) {
        const newSelected = selectedIds.includes(id)
          ? selectedIds.filter((i) => i !== id)
          : [...selectedIds, id];
        onChange(newSelected);
      } else {
        onChange(selectedIds.includes(id) ? [] : [id]);
      }
    },
    [selectedIds, onChange, multiple]
  );

  return (
    <View style={[styles.groupContainer, style]}>
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          label={chip.label}
          icon={chip.icon}
          variant={variant}
          size={size}
          color={color}
          selected={selectedIds.includes(chip.id)}
          onPress={() => handleChipPress(chip.id)}
        />
      ))}
    </View>
  );
}

interface InputChipsProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxChips?: number;
  variant?: ChipVariant;
  size?: ChipSize;
  style?: ViewStyle;
}

export function InputChips({
  values,
  onChange,
  placeholder = "Add tag...",
  maxChips,
  variant = "filled",
  size = "medium",
  style,
}: InputChipsProps) {
  const { theme } = useTheme();

  const handleDelete = useCallback(
    (index: number) => {
      onChange(values.filter((_, i) => i !== index));
    },
    [values, onChange]
  );

  const canAddMore = !maxChips || values.length < maxChips;

  return (
    <View style={[styles.inputChipsContainer, { backgroundColor: theme.backgroundDefault }, style]}>
      {values.map((value, index) => (
        <Chip
          key={`${value}-${index}`}
          label={value}
          variant={variant}
          size={size}
          deletable
          onDelete={() => handleDelete(index)}
        />
      ))}
      {canAddMore && (
        <ThemedText style={[styles.placeholder, { color: theme.textDisabled }]}>
          {placeholder}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  outlined: {
    borderWidth: 1,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontWeight: "500",
  },
  deleteButton: {
    marginLeft: Spacing.xs,
    padding: 2,
  },
  groupContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  inputChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 48,
    alignItems: "center",
  },
  placeholder: {
    fontSize: 14,
  },
});
