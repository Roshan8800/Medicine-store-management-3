import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  createdAt: string;
  user_name?: string;
}

export default function AuditLogScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const { data: logs = [], isLoading, refetch } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getActionIcon = (action: string): keyof typeof Feather.glyphMap => {
    switch (action) {
      case "LOGIN":
        return "log-in";
      case "CREATE_INVOICE":
        return "file-plus";
      case "STOCK_ADJUSTMENT":
        return "package";
      default:
        return "activity";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "LOGIN":
        return theme.primary;
      case "CREATE_INVOICE":
        return theme.accent;
      case "STOCK_ADJUSTMENT":
        return theme.warning;
      default:
        return theme.textSecondary;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionDescription = (log: AuditLog) => {
    switch (log.action) {
      case "LOGIN":
        return `Logged in`;
      case "CREATE_INVOICE":
        return `Created invoice ${log.details?.invoiceNumber || ""}`;
      case "STOCK_ADJUSTMENT":
        return `${log.details?.type || "Adjusted"} ${log.details?.quantity || ""} units`;
      default:
        return log.action.replace(/_/g, " ").toLowerCase();
    }
  };

  const renderLog = ({ item }: { item: AuditLog }) => (
    <View style={[styles.logCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.iconContainer, { backgroundColor: getActionColor(item.action) + "20" }]}>
        <Feather name={getActionIcon(item.action)} size={20} color={getActionColor(item.action)} />
      </View>
      <View style={styles.logContent}>
        <ThemedText style={styles.actionText}>{getActionDescription(item)}</ThemedText>
        <View style={styles.metaRow}>
          <ThemedText style={[styles.userName, { color: theme.primary }]}>
            {item.user_name || "Unknown"}
          </ThemedText>
          <ThemedText style={[styles.timestamp, { color: theme.textSecondary }]}>
            {formatTime(item.createdAt)}
          </ThemedText>
        </View>
        {item.details?.reason ? (
          <ThemedText style={[styles.reason, { color: theme.textSecondary }]}>
            Reason: {item.details.reason}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={logs}
        renderItem={renderLog}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={48} color={theme.textDisabled} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No activity recorded yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.textDisabled }]}>
              Actions will appear here as you use the app
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  logCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  logContent: {
    flex: 1,
  },
  actionText: {
    fontWeight: "600",
    fontSize: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  userName: {
    fontSize: 12,
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 11,
  },
  reason: {
    fontSize: 12,
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
    fontSize: 16,
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    fontSize: 13,
    textAlign: "center",
  },
});
