import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
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

interface Insight {
  title: string;
  description: string;
  type: "trend" | "anomaly" | "opportunity" | "warning";
  actionable: string;
}

interface InsightsData {
  insights: Insight[];
  summary: string;
  key_metrics: {
    average_daily_sales: number;
    peak_day: string;
    growth_trend: string;
  };
}

export default function AIInsightsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
  });

  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const salesData = [
        { date: "Mon", amount: 15000, items: 45 },
        { date: "Tue", amount: 18000, items: 52 },
        { date: "Wed", amount: 12000, items: 38 },
        { date: "Thu", amount: 22000, items: 67 },
        { date: "Fri", amount: 25000, items: 72 },
        { date: "Sat", amount: 30000, items: 89 },
        { date: "Sun", amount: 8000, items: 24 },
      ];

      const response = await apiRequest("POST", "/api/ai/sales-insights", { salesData });
      const data = await response.json();

      if (data.success && data.data) {
        setInsights(data.data as InsightsData);
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchInsights();
    setIsRefreshing(false);
  };

  const getTypeIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "trend":
        return "trending-up";
      case "anomaly":
        return "alert-circle";
      case "opportunity":
        return "star";
      case "warning":
        return "alert-triangle";
      default:
        return "info";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "trend":
        return theme.primary;
      case "anomaly":
        return theme.warning;
      case "opportunity":
        return theme.success;
      case "warning":
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
              AI is analyzing your data...
            </ThemedText>
          </View>
        ) : insights ? (
          <>
            <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
              <View style={styles.summaryHeader}>
                <Feather name="cpu" size={24} color="#fff" />
                <ThemedText style={styles.summaryTitle}>AI Summary</ThemedText>
              </View>
              <ThemedText style={styles.summaryText}>{insights.summary}</ThemedText>
              
              {insights.key_metrics ? (
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <ThemedText style={styles.metricValue}>
                      Rs {insights.key_metrics.average_daily_sales?.toLocaleString() || "0"}
                    </ThemedText>
                    <ThemedText style={styles.metricLabel}>Avg Daily</ThemedText>
                  </View>
                  <View style={styles.metricItem}>
                    <ThemedText style={styles.metricValue}>
                      {insights.key_metrics.peak_day || "N/A"}
                    </ThemedText>
                    <ThemedText style={styles.metricLabel}>Peak Day</ThemedText>
                  </View>
                  <View style={styles.metricItem}>
                    <ThemedText style={styles.metricValue}>
                      {insights.key_metrics.growth_trend || "N/A"}
                    </ThemedText>
                    <ThemedText style={styles.metricLabel}>Growth</ThemedText>
                  </View>
                </View>
              ) : null}
            </View>

            <ThemedText type="h4" style={styles.sectionTitle}>Insights</ThemedText>

            {insights.insights?.map((insight, index) => (
              <AnimatedCard key={index}>
                <Pressable
                  style={[styles.insightCard, { backgroundColor: theme.backgroundDefault }]}
                >
                  <View style={styles.insightHeader}>
                    <View
                      style={[
                        styles.insightIcon,
                        { backgroundColor: getTypeColor(insight.type) + "20" },
                      ]}
                    >
                      <Feather
                        name={getTypeIcon(insight.type)}
                        size={20}
                        color={getTypeColor(insight.type)}
                      />
                    </View>
                    <View style={styles.insightContent}>
                      <ThemedText style={styles.insightTitle}>{insight.title}</ThemedText>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: getTypeColor(insight.type) + "20" },
                        ]}
                      >
                        <ThemedText
                          style={[styles.typeText, { color: getTypeColor(insight.type) }]}
                        >
                          {insight.type.toUpperCase()}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <ThemedText style={[styles.insightDescription, { color: theme.textSecondary }]}>
                    {insight.description}
                  </ThemedText>
                  <View style={[styles.actionBox, { backgroundColor: theme.info + "10" }]}>
                    <Feather name="arrow-right" size={14} color={theme.info} />
                    <ThemedText style={[styles.actionText, { color: theme.info }]}>
                      {insight.actionable}
                    </ThemedText>
                  </View>
                </Pressable>
              </AnimatedCard>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="cpu" size={48} color={theme.textDisabled} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No insights available yet. Add more data to get AI-powered recommendations.
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
  summaryCard: {
    padding: Spacing.xl,
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
    fontSize: 18,
    fontWeight: "600",
  },
  summaryText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricItem: {
    alignItems: "center",
  },
  metricValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  metricLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  insightCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  insightHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  insightContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  insightDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  actionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  actionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
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
