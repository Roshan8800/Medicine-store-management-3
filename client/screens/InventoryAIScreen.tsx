import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AnimatedCard } from "@/components/AnimatedCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface InventorySummary {
  summary: string;
  urgent_actions: string[];
  health_score: number;
  key_concerns: string[];
  positive_notes: string[];
}

export default function InventoryAIScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [result, setResult] = useState<InventorySummary | null>(null);

  const { data: stats } = useQuery<{ totalMedicines: number; lowStock: number; expiringSoon: number }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const analyzeInventory = async () => {
    setIsLoading(true);

    try {
      const inventoryData = [
        { category: "Tablets", items: 150, lowStock: 12, expiring: 8 },
        { category: "Capsules", items: 85, lowStock: 5, expiring: 3 },
        { category: "Syrups", items: 45, lowStock: 8, expiring: 5 },
        { category: "Injections", items: 30, lowStock: 3, expiring: 2 },
        { category: "Ointments", items: 25, lowStock: 2, expiring: 1 },
        { category: "Drops", items: 20, lowStock: 4, expiring: 2 },
      ];

      const response = await apiRequest("POST", "/api/ai/inventory-summary", {
        inventory: inventoryData,
      });
      const data = await response.json();

      if (data.success && data.data) {
        setResult(data.data as InventorySummary);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", data.error || "Failed to analyze inventory");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to AI service");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    analyzeInventory();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await analyzeInventory();
    setIsRefreshing(false);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return theme.success;
    if (score >= 60) return theme.warning;
    return theme.error;
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return "Healthy";
    if (score >= 60) return "Needs Attention";
    return "Critical";
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
              AI is analyzing your inventory...
            </ThemedText>
          </View>
        ) : result ? (
          <>
            <View style={[styles.scoreCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.scoreHeader}>
                <View style={styles.scoreContent}>
                  <ThemedText style={[styles.scoreLabel, { color: theme.textSecondary }]}>
                    Inventory Health Score
                  </ThemedText>
                  <View style={styles.scoreRow}>
                    <ThemedText
                      style={[styles.scoreValue, { color: getHealthScoreColor(result.health_score) }]}
                    >
                      {result.health_score}
                    </ThemedText>
                    <ThemedText style={[styles.scoreMax, { color: theme.textDisabled }]}>/100</ThemedText>
                  </View>
                  <View
                    style={[
                      styles.scoreBadge,
                      { backgroundColor: getHealthScoreColor(result.health_score) + "20" },
                    ]}
                  >
                    <ThemedText
                      style={[styles.scoreBadgeText, { color: getHealthScoreColor(result.health_score) }]}
                    >
                      {getHealthScoreLabel(result.health_score)}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.scoreGauge}>
                  <View
                    style={[
                      styles.gaugeCircle,
                      { borderColor: getHealthScoreColor(result.health_score) },
                    ]}
                  >
                    <Feather
                      name={result.health_score >= 80 ? "check" : result.health_score >= 60 ? "alert-circle" : "alert-triangle"}
                      size={32}
                      color={getHealthScoreColor(result.health_score)}
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.progressBar, { backgroundColor: theme.divider }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${result.health_score}%`,
                      backgroundColor: getHealthScoreColor(result.health_score),
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
              <View style={styles.summaryHeader}>
                <Feather name="cpu" size={20} color="#fff" />
                <ThemedText style={styles.summaryTitle}>AI Summary</ThemedText>
              </View>
              <ThemedText style={styles.summaryText}>{result.summary}</ThemedText>
            </View>

            {result.urgent_actions && result.urgent_actions.length > 0 ? (
              <AnimatedCard>
                <View style={[styles.actionsCard, { backgroundColor: theme.error + "10" }]}>
                  <View style={styles.actionsHeader}>
                    <Feather name="alert-octagon" size={20} color={theme.error} />
                    <ThemedText style={[styles.actionsTitle, { color: theme.error }]}>
                      Urgent Actions Required
                    </ThemedText>
                  </View>
                  {result.urgent_actions.map((action, index) => (
                    <View key={index} style={styles.actionItem}>
                      <View style={[styles.actionBullet, { backgroundColor: theme.error }]} />
                      <ThemedText style={styles.actionText}>{action}</ThemedText>
                    </View>
                  ))}
                  <Pressable
                    style={[styles.takeActionButton, { backgroundColor: theme.error }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert("Actions", "Taking action on urgent items...");
                    }}
                  >
                    <Feather name="zap" size={16} color="#fff" />
                    <ThemedText style={styles.takeActionText}>Take Action Now</ThemedText>
                  </Pressable>
                </View>
              </AnimatedCard>
            ) : null}

            <View style={styles.twoColumns}>
              <View style={[styles.columnCard, { backgroundColor: theme.warning + "10" }]}>
                <View style={styles.columnHeader}>
                  <Feather name="alert-triangle" size={18} color={theme.warning} />
                  <ThemedText style={[styles.columnTitle, { color: theme.warning }]}>
                    Key Concerns
                  </ThemedText>
                </View>
                {result.key_concerns?.map((concern, index) => (
                  <View key={index} style={styles.columnItem}>
                    <ThemedText style={[styles.columnItemText, { color: theme.text }]}>
                      • {concern}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <View style={[styles.columnCard, { backgroundColor: theme.success + "10" }]}>
                <View style={styles.columnHeader}>
                  <Feather name="check-circle" size={18} color={theme.success} />
                  <ThemedText style={[styles.columnTitle, { color: theme.success }]}>
                    Positive Notes
                  </ThemedText>
                </View>
                {result.positive_notes?.map((note, index) => (
                  <View key={index} style={styles.columnItem}>
                    <ThemedText style={[styles.columnItemText, { color: theme.text }]}>
                      • {note}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.quickActions}>
              <Pressable
                style={[styles.quickActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert("Report", "Generating detailed inventory report...");
                }}
              >
                <Feather name="file-text" size={20} color="#fff" />
                <ThemedText style={styles.quickActionBtnText}>Generate Report</ThemedText>
              </Pressable>

              <Pressable
                style={[styles.quickActionBtn, { backgroundColor: theme.success }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert("Reorder", "Creating purchase orders for low stock items...");
                }}
              >
                <Feather name="shopping-cart" size={20} color="#fff" />
                <ThemedText style={styles.quickActionBtnText}>Auto Reorder</ThemedText>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="package" size={48} color={theme.textDisabled} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Pull down to analyze inventory status
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 14,
  },
  scoreCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  scoreContent: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "700",
  },
  scoreMax: {
    fontSize: 20,
    fontWeight: "500",
  },
  scoreBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scoreGauge: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  summaryText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  actionsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  actionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  takeActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  takeActionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  twoColumns: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  columnCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  columnItem: {
    marginBottom: Spacing.xs,
  },
  columnItemText: {
    fontSize: 12,
    lineHeight: 16,
  },
  quickActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  quickActionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    marginTop: Spacing.lg,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});
