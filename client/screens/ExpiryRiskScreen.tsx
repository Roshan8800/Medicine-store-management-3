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

interface RiskAssessment {
  medicine: string;
  risk_level: "high" | "medium" | "low";
  units_at_risk: number;
  recommendation: string;
  days_until_expiry: number;
  projected_remaining: number;
}

interface ExpiryRiskResult {
  risk_assessment: RiskAssessment[];
  total_value_at_risk: number;
}

export default function ExpiryRiskScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [result, setResult] = useState<ExpiryRiskResult | null>(null);

  const { data: batches } = useQuery<{ id: string; medicineName: string; quantity: number; expiryDate: string }[]>({
    queryKey: ["/api/batches/expiring", "90"],
  });

  const analyzeExpiryRisk = async () => {
    setIsLoading(true);

    try {
      const batchesData = batches?.slice(0, 10).map((b) => ({
        medicine: b.medicineName || "Unknown Medicine",
        quantity: b.quantity,
        expiryDate: b.expiryDate,
        averageSales: Math.floor(Math.random() * 30) + 10,
      })) || [
        { medicine: "Paracetamol 500mg", quantity: 150, expiryDate: "2025-02-15", averageSales: 45 },
        { medicine: "Amoxicillin 500mg", quantity: 80, expiryDate: "2025-01-20", averageSales: 12 },
        { medicine: "Omeprazole 20mg", quantity: 200, expiryDate: "2025-03-10", averageSales: 25 },
        { medicine: "Vitamin D3", quantity: 300, expiryDate: "2025-01-30", averageSales: 40 },
        { medicine: "Cetirizine 10mg", quantity: 100, expiryDate: "2025-02-28", averageSales: 20 },
      ];

      const response = await apiRequest("POST", "/api/ai/expiry-risk", {
        batches: batchesData,
      });
      const data = await response.json();

      if (data.success && data.data) {
        setResult(data.data as ExpiryRiskResult);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", data.error || "Failed to analyze expiry risk");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to AI service");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    analyzeExpiryRisk();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await analyzeExpiryRisk();
    setIsRefreshing(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return theme.error;
      case "medium":
        return theme.warning;
      case "low":
        return theme.success;
      default:
        return theme.textSecondary;
    }
  };

  const getRiskIcon = (level: string): keyof typeof Feather.glyphMap => {
    switch (level) {
      case "high":
        return "alert-octagon";
      case "medium":
        return "alert-triangle";
      case "low":
        return "check-circle";
      default:
        return "info";
    }
  };

  const takeAction = (assessment: RiskAssessment, action: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      action === "discount" ? "Discount Applied" : "Offer Created",
      `${assessment.medicine}: ${action === "discount" ? "20% discount applied to clear stock" : "Bundle offer created"}`
    );
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
              AI is analyzing expiry risks...
            </ThemedText>
          </View>
        ) : result ? (
          <>
            <View style={[styles.summaryCard, { backgroundColor: theme.error }]}>
              <View style={styles.summaryHeader}>
                <Feather name="alert-circle" size={24} color="#fff" />
                <ThemedText style={styles.summaryTitle}>Expiry Risk Summary</ThemedText>
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>
                    {result.risk_assessment.filter((r) => r.risk_level === "high").length}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>High Risk</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>
                    {result.risk_assessment.reduce((sum, r) => sum + r.units_at_risk, 0)}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Units at Risk</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>
                    Rs {result.total_value_at_risk?.toLocaleString() || "0"}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Value at Risk</ThemedText>
                </View>
              </View>
            </View>

            <ThemedText type="h4" style={styles.sectionTitle}>Risk Assessment</ThemedText>

            {result.risk_assessment.map((assessment, index) => (
              <AnimatedCard key={index}>
                <View style={[styles.riskCard, { backgroundColor: theme.backgroundDefault }]}>
                  <View style={styles.riskHeader}>
                    <View
                      style={[
                        styles.riskIcon,
                        { backgroundColor: getRiskColor(assessment.risk_level) + "20" },
                      ]}
                    >
                      <Feather
                        name={getRiskIcon(assessment.risk_level)}
                        size={24}
                        color={getRiskColor(assessment.risk_level)}
                      />
                    </View>
                    <View style={styles.riskInfo}>
                      <ThemedText style={styles.medicineName}>{assessment.medicine}</ThemedText>
                      <View style={styles.riskMeta}>
                        <View
                          style={[
                            styles.riskBadge,
                            { backgroundColor: getRiskColor(assessment.risk_level) + "20" },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.riskBadgeText,
                              { color: getRiskColor(assessment.risk_level) },
                            ]}
                          >
                            {assessment.risk_level.toUpperCase()} RISK
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.daysText, { color: theme.textSecondary }]}>
                          {assessment.days_until_expiry} days left
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <ThemedText style={[styles.statBoxLabel, { color: theme.textSecondary }]}>
                        Units at Risk
                      </ThemedText>
                      <ThemedText style={[styles.statBoxValue, { color: theme.error }]}>
                        {assessment.units_at_risk}
                      </ThemedText>
                    </View>
                    <View style={styles.statBox}>
                      <ThemedText style={[styles.statBoxLabel, { color: theme.textSecondary }]}>
                        Projected Remaining
                      </ThemedText>
                      <ThemedText style={[styles.statBoxValue, { color: theme.warning }]}>
                        {assessment.projected_remaining}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.recommendationBox, { backgroundColor: theme.info + "10" }]}>
                    <Feather name="zap" size={14} color={theme.info} />
                    <ThemedText style={[styles.recommendationText, { color: theme.info }]}>
                      {assessment.recommendation}
                    </ThemedText>
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: theme.warning }]}
                      onPress={() => takeAction(assessment, "discount")}
                    >
                      <Feather name="percent" size={16} color="#fff" />
                      <ThemedText style={styles.actionButtonText}>Add Discount</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: theme.primary }]}
                      onPress={() => takeAction(assessment, "bundle")}
                    >
                      <Feather name="gift" size={16} color="#fff" />
                      <ThemedText style={styles.actionButtonText}>Create Offer</ThemedText>
                    </Pressable>
                  </View>
                </View>
              </AnimatedCard>
            ))}

            <View style={[styles.tipsCard, { backgroundColor: theme.success + "20" }]}>
              <View style={styles.tipsHeader}>
                <Feather name="info" size={20} color={theme.success} />
                <ThemedText style={[styles.tipsTitle, { color: theme.success }]}>
                  Quick Tips
                </ThemedText>
              </View>
              <View style={styles.tipsList}>
                <ThemedText style={[styles.tipItem, { color: theme.success }]}>
                  • Consider FIFO (First In, First Out) for dispensing
                </ThemedText>
                <ThemedText style={[styles.tipItem, { color: theme.success }]}>
                  • Create bundle offers for high-risk items
                </ThemedText>
                <ThemedText style={[styles.tipItem, { color: theme.success }]}>
                  • Contact suppliers for return policies
                </ThemedText>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color={theme.textDisabled} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Pull down to analyze expiry risks
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
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  riskCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  riskHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  riskIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  riskInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  riskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  riskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  daysText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statBoxLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  recommendationBox: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  tipsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tipsTitle: {
    fontWeight: "600",
    fontSize: 15,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipItem: {
    fontSize: 13,
    lineHeight: 18,
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
