import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
  compact?: boolean;
  illustration?: "empty-box" | "no-data" | "search" | "error" | "offline";
}

const ILLUSTRATION_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  "empty-box": "package",
  "no-data": "database",
  "search": "search",
  "error": "alert-circle",
  "offline": "wifi-off",
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  compact = false,
  illustration,
}: EmptyStateProps) {
  const { theme } = useTheme();

  const displayIcon = icon || (illustration ? ILLUSTRATION_ICONS[illustration] : "inbox");

  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.primary + "15",
            width: compact ? 60 : 80,
            height: compact ? 60 : 80,
            borderRadius: compact ? 30 : 40,
          },
        ]}
      >
        <Feather
          name={displayIcon}
          size={compact ? 28 : 36}
          color={theme.primary}
        />
      </View>

      <ThemedText
        type={compact ? "body" : "h4"}
        style={[styles.title, { color: theme.textDefault }, compact && { fontWeight: "600" }]}
      >
        {title}
      </ThemedText>

      {description && (
        <ThemedText
          style={[
            styles.description,
            { color: theme.textSecondary },
            compact && styles.compactDescription,
          ]}
        >
          {description}
        </ThemedText>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actions}>
          {actionLabel && onAction && (
            <Button onPress={onAction} size={compact ? "small" : "medium"}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              onPress={onSecondaryAction}
              variant="outline"
              size={compact ? "small" : "medium"}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

export function NoResultsState({
  searchQuery,
  onClearSearch,
  entityName = "items",
}: {
  searchQuery?: string;
  onClearSearch?: () => void;
  entityName?: string;
}) {
  return (
    <EmptyState
      icon="search"
      title={searchQuery ? `No ${entityName} found` : `No ${entityName}`}
      description={
        searchQuery
          ? `We couldn't find any ${entityName} matching "${searchQuery}". Try a different search term.`
          : `There are no ${entityName} to display yet.`
      }
      actionLabel={searchQuery ? "Clear Search" : undefined}
      onAction={onClearSearch}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="wifi-off"
      title="You're Offline"
      description="Please check your internet connection and try again."
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
}

export function NoPermissionState({
  permission,
  onRequestPermission,
}: {
  permission: string;
  onRequestPermission?: () => void;
}) {
  return (
    <EmptyState
      icon="lock"
      title="Permission Required"
      description={`This feature requires ${permission} permission. Please grant access to continue.`}
      actionLabel="Grant Permission"
      onAction={onRequestPermission}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
  },
  compact: {
    padding: Spacing.xl,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
  },
  compactDescription: {
    fontSize: 13,
    maxWidth: 240,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
});
