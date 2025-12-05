import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  labelPosition?: "inside" | "outside" | "top";
  animated?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 8,
  color,
  backgroundColor,
  showLabel = false,
  labelPosition = "outside",
  animated = true,
  style,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  useEffect(() => {
    if (animated) {
      Animated.spring(progressAnim, {
        toValue: clampedProgress,
        useNativeDriver: false,
        tension: 40,
        friction: 10,
      }).start();
    } else {
      progressAnim.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, progressAnim]);

  const progressColor = color || theme.primary;
  const bgColor = backgroundColor || theme.divider;

  const renderLabel = () => {
    if (!showLabel) return null;

    return (
      <ThemedText
        style={[
          styles.label,
          labelPosition === "inside" && styles.labelInside,
          { color: labelPosition === "inside" ? "#FFFFFF" : theme.textSecondary },
        ]}
      >
        {Math.round(clampedProgress)}%
      </ThemedText>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {labelPosition === "top" && (
        <View style={styles.topLabelContainer}>
          {renderLabel()}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: bgColor }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: progressColor,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        >
          {labelPosition === "inside" && height >= 16 && renderLabel()}
        </Animated.View>
      </View>
      {labelPosition === "outside" && renderLabel()}
    </View>
  );
}

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  animated?: boolean;
  children?: React.ReactNode;
}

export function CircularProgress({
  progress,
  size = 64,
  strokeWidth = 4,
  color,
  backgroundColor,
  showLabel = true,
  animated = true,
  children,
}: CircularProgressProps) {
  const { theme } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (animated) {
      Animated.spring(progressAnim, {
        toValue: clampedProgress,
        useNativeDriver: false,
        tension: 40,
        friction: 10,
      }).start();
    } else {
      progressAnim.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, progressAnim]);

  const progressColor = color || theme.primary;
  const bgColor = backgroundColor || theme.divider;

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      <View style={styles.circularTrack}>
        <View
          style={[
            styles.circularBackground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: bgColor,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.circularFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: progressColor,
              borderRightColor: "transparent",
              borderBottomColor: "transparent",
              transform: [
                {
                  rotate: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
      <View style={styles.circularContent}>
        {children || (showLabel && (
          <ThemedText style={styles.circularLabel}>
            {Math.round(clampedProgress)}%
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

interface StepProgressProps {
  steps: string[];
  currentStep: number;
  color?: string;
  style?: ViewStyle;
}

export function StepProgress({
  steps,
  currentStep,
  color,
  style,
}: StepProgressProps) {
  const { theme } = useTheme();
  const progressColor = color || theme.primary;

  return (
    <View style={[styles.stepContainer, style]}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepIndicatorContainer}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isCompleted || isCurrent ? progressColor : theme.divider,
                    borderColor: isCompleted || isCurrent ? progressColor : theme.divider,
                  },
                ]}
              >
                {isCompleted ? (
                  <ThemedText style={styles.stepCheckmark}>✓</ThemedText>
                ) : (
                  <ThemedText
                    style={[
                      styles.stepNumber,
                      { color: isCurrent ? "#FFFFFF" : theme.textSecondary },
                    ]}
                  >
                    {index + 1}
                  </ThemedText>
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: isCompleted ? progressColor : theme.divider },
                  ]}
                />
              )}
            </View>
            <ThemedText
              style={[
                styles.stepLabel,
                {
                  color: isCompleted || isCurrent ? theme.text : theme.textSecondary,
                  fontWeight: isCurrent ? "600" : "400",
                },
              ]}
            >
              {step}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

interface SegmentedProgressProps {
  segments: number;
  completed: number;
  color?: string;
  backgroundColor?: string;
  gap?: number;
  height?: number;
  style?: ViewStyle;
}

export function SegmentedProgress({
  segments,
  completed,
  color,
  backgroundColor,
  gap = 4,
  height = 8,
  style,
}: SegmentedProgressProps) {
  const { theme } = useTheme();
  const progressColor = color || theme.primary;
  const bgColor = backgroundColor || theme.divider;

  return (
    <View style={[styles.segmentedContainer, { gap }, style]}>
      {Array.from({ length: segments }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            {
              height,
              backgroundColor: index < completed ? progressColor : bgColor,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  track: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: Spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  labelInside: {
    marginTop: 0,
  },
  topLabelContainer: {
    marginBottom: Spacing.xs,
  },
  circularContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  circularTrack: {
    position: "absolute",
  },
  circularBackground: {
    position: "absolute",
  },
  circularFill: {
    position: "absolute",
  },
  circularContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  circularLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  stepContainer: {
    flexDirection: "row",
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
  },
  stepIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  stepCheckmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "600",
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: -Spacing.xs,
  },
  stepLabel: {
    fontSize: 12,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  segmentedContainer: {
    flexDirection: "row",
  },
  segment: {
    flex: 1,
    borderRadius: BorderRadius.sm,
  },
});
