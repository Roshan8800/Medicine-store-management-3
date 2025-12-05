import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface DividerProps {
  orientation?: "horizontal" | "vertical";
  thickness?: number;
  color?: string;
  spacing?: number;
  style?: ViewStyle;
}

export function Divider({
  orientation = "horizontal",
  thickness = 1,
  color,
  spacing = Spacing.md,
  style,
}: DividerProps) {
  const { theme } = useTheme();
  const lineColor = color || theme.divider;

  if (orientation === "vertical") {
    return (
      <View
        style={[
          styles.vertical,
          {
            width: thickness,
            backgroundColor: lineColor,
            marginHorizontal: spacing,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        {
          height: thickness,
          backgroundColor: lineColor,
          marginVertical: spacing,
        },
        style,
      ]}
    />
  );
}

interface DividerWithLabelProps extends DividerProps {
  label: string;
  labelPosition?: "left" | "center" | "right";
}

export function DividerWithLabel({
  label,
  labelPosition = "center",
  thickness = 1,
  color,
  spacing = Spacing.md,
  style,
}: DividerWithLabelProps) {
  const { theme } = useTheme();
  const lineColor = color || theme.divider;

  return (
    <View style={[styles.labelContainer, { marginVertical: spacing }, style]}>
      {(labelPosition === "center" || labelPosition === "right") && (
        <View
          style={[
            styles.labelLine,
            { height: thickness, backgroundColor: lineColor },
            labelPosition === "right" && styles.labelLineFlexGrow,
          ]}
        />
      )}
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      {(labelPosition === "center" || labelPosition === "left") && (
        <View
          style={[
            styles.labelLine,
            { height: thickness, backgroundColor: lineColor },
            labelPosition === "left" && styles.labelLineFlexGrow,
          ]}
        />
      )}
    </View>
  );
}

interface SectionDividerProps {
  title?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function SectionDivider({ title, action, style }: SectionDividerProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.sectionContainer, style]}>
      <View style={[styles.sectionLine, { backgroundColor: theme.divider }]} />
      {(title || action) && (
        <View style={styles.sectionContent}>
          {title && (
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {title}
            </ThemedText>
          )}
          {action && (
            <ThemedText
              style={[styles.sectionAction, { color: theme.primary }]}
              onPress={action.onPress}
            >
              {action.label}
            </ThemedText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  horizontal: {
    width: "100%",
  },
  vertical: {
    height: "100%",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelLine: {
    flex: 1,
  },
  labelLineFlexGrow: {
    flexGrow: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: Spacing.md,
    textTransform: "uppercase",
  },
  sectionContainer: {
    marginVertical: Spacing.lg,
  },
  sectionLine: {
    height: 1,
    width: "100%",
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: "600",
  },
});
