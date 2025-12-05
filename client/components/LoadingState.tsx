import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Animated, ViewStyle, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
  size?: "small" | "large";
  overlay?: boolean;
  transparent?: boolean;
}

export function LoadingState({
  message = "Loading...",
  style,
  size = "large",
  overlay = false,
  transparent = false,
}: LoadingStateProps) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const content = (
    <Animated.View
      style={[
        styles.content,
        { opacity: fadeAnim },
        transparent && { backgroundColor: "transparent" },
      ]}
    >
      <ActivityIndicator
        size={size}
        color={theme.primary}
        style={styles.spinner}
      />
      {message && (
        <Animated.View style={{ opacity: pulseAnim }}>
          <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </ThemedText>
        </Animated.View>
      )}
    </Animated.View>
  );

  if (overlay) {
    return (
      <View style={[styles.overlay, { backgroundColor: theme.backgroundElevated + "E0" }, style]}>
        {content}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {content}
    </View>
  );
}

export function LoadingOverlay({
  visible,
  message,
}: {
  visible: boolean;
  message?: string;
}) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlayContainer,
        { opacity: fadeAnim, backgroundColor: "rgba(0,0,0,0.5)" },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View style={[styles.overlayCard, { backgroundColor: theme.backgroundElevated }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        {message && (
          <ThemedText style={[styles.overlayMessage, { color: theme.textDefault }]}>
            {message}
          </ThemedText>
        )}
      </View>
    </Animated.View>
  );
}

export function InlineLoading({ message }: { message?: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size="small" color={theme.primary} />
      {message && (
        <ThemedText style={[styles.inlineMessage, { color: theme.textSecondary }]}>
          {message}
        </ThemedText>
      )}
    </View>
  );
}

export function SkeletonLoader({
  width,
  height,
  borderRadius = BorderRadius.md,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.textDisabled,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.cardSkeletonHeader}>
        <SkeletonLoader width={48} height={48} borderRadius={24} />
        <View style={styles.cardSkeletonText}>
          <SkeletonLoader width="60%" height={16} />
          <SkeletonLoader width="40%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={12} style={{ marginTop: 16 }} />
      <SkeletonLoader width="80%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.listSkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listSkeletonItem}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <View style={styles.listSkeletonContent}>
            <SkeletonLoader width="70%" height={14} />
            <SkeletonLoader width="50%" height={10} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  spinner: {
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  overlayCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  overlayMessage: {
    marginTop: Spacing.md,
    fontSize: 14,
    fontWeight: "500",
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inlineMessage: {
    fontSize: 13,
  },
  cardSkeleton: {
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  cardSkeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  cardSkeletonText: {
    flex: 1,
  },
  listSkeleton: {
    padding: Spacing.md,
  },
  listSkeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  listSkeletonContent: {
    flex: 1,
  },
});
