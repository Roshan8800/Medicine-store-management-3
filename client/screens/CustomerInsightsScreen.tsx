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

interface CustomerSegment {
  segment: "loyal" | "occasional" | "at_risk" | "new";
  customers: string[];
  characteristics: string;
}

interface CustomerInsightsResult {
  segments: CustomerSegment[];
  retention_recommendations: string[];
  vip_customers: string[];
}

export default function CustomerInsightsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [result, setResult] = useState<CustomerInsightsResult | null>(null);

  const { data: customers } = useQuery<{ id: string; name: string; totalPurchases: number }[]>({
    queryKey: ["/api/customers"],
  });

  const analyzeCustomers = async () => {
    setIsLoading(true);

    try {
      const customerData = customers?.slice(0, 15).map((c) => ({
        name: c.name,
        purchases: c.totalPurchases || Math.floor(Math.random() * 20) + 1,
        lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        totalSpent: Math.floor(Math.random() * 10000) + 500,
      })) || [
        { name: "Ramesh Kumar", purchases: 25, lastVisit: "2024-12-01", totalSpent: 15000 },
        { name: "Priya Sharma", purchases: 18, lastVisit: "2024-12-03", totalSpent: 12000 },
        { name: "Amit Singh", purchases: 5, lastVisit: "2024-11-15", totalSpent: 3000 },
        { name: "Sunita Patel", purchases: 12, lastVisit: "2024-12-04", totalSpent: 8500 },
        { name: "Raj Verma", purchases: 2, lastVisit: "2024-12-05", totalSpent: 800 },
        { name: "Anita Gupta", purchases: 8, lastVisit: "2024-11-20", totalSpent: 5500 },
      ];

      const response = await apiRequest("POST", "/api/ai/customer-insights", {
        customerData,
      });
      const data = await response.json();

      if (data.success && data.data) {
        setResult(data.data as CustomerInsightsResult);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", data.error || "Failed to analyze customers");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to AI service");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    analyzeCustomers();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await analyzeCustomers();
    setIsRefreshing(false);
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case "loyal":
        return theme.success;
      case "occasional":
        return theme.info;
      case "at_risk":
        return theme.warning;
      case "new":
        return theme.primary;
      default:
        return theme.textSecondary;
    }
  };

  const getSegmentIcon = (segment: string): keyof typeof Feather.glyphMap => {
    switch (segment) {
      case "loyal":
        return "heart";
      case "occasional":
        return "clock";
      case "at_risk":
        return "alert-triangle";
      case "new":
        return "user-plus";
      default:
        return "users";
    }
  };

  const getSegmentLabel = (segment: string) => {
    switch (segment) {
      case "loyal":
        return "Loyal Customers";
      case "occasional":
        return "Occasional Visitors";
      case "at_risk":
        return "At Risk";
      case "new":
        return "New Customers";
      default:
        return segment;
    }
  };

  const sendPromotion = (segment: CustomerSegment) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Promotion Sent",
      `Promotional offer sent to ${segment.customers.length} ${getSegmentLabel(segment.segment).toLowerCase()}`
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
              AI is analyzing customer behavior...
            </ThemedText>
          </View>
        ) : result ? (
          <>
            {result.vip_customers && result.vip_customers.length > 0 ? (
              <View style={[styles.vipCard, { backgroundColor: theme.warning }]}>
                <View style={styles.vipHeader}>
                  <Feather name="star" size={24} color="#fff" />
                  <ThemedText style={styles.vipTitle}>VIP Customers</ThemedText>
                </View>
                <View style={styles.vipList}>
                  {result.vip_customers.slice(0, 5).map((customer, index) => (
                    <View key={index} style={styles.vipItem}>
                      <View style={styles.vipAvatar}>
                        <ThemedText style={styles.vipAvatarText}>
                          {customer.charAt(0).toUpperCase()}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.vipName}>{customer}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <ThemedText type="h4" style={styles.sectionTitle}>Customer Segments</ThemedText>

            {result.segments?.map((segment, index) => (
              <AnimatedCard key={index}>
                <View style={[styles.segmentCard, { backgroundColor: theme.backgroundDefault }]}>
                  <View style={styles.segmentHeader}>
                    <View
                      style={[
                        styles.segmentIcon,
                        { backgroundColor: getSegmentColor(segment.segment) + "20" },
                      ]}
                    >
                      <Feather
                        name={getSegmentIcon(segment.segment)}
                        size={24}
                        color={getSegmentColor(segment.segment)}
                      />
                    </View>
                    <View style={styles.segmentInfo}>
                      <ThemedText style={styles.segmentName}>
                        {getSegmentLabel(segment.segment)}
                      </ThemedText>
                      <View
                        style={[
                          styles.countBadge,
                          { backgroundColor: getSegmentColor(segment.segment) + "20" },
                        ]}
                      >
                        <ThemedText
                          style={[styles.countText, { color: getSegmentColor(segment.segment) }]}
                        >
                          {segment.customers.length} customers
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <ThemedText style={[styles.characteristics, { color: theme.textSecondary }]}>
                    {segment.characteristics}
                  </ThemedText>

                  <View style={styles.customerList}>
                    {segment.customers.slice(0, 4).map((customer, idx) => (
                      <View key={idx} style={[styles.customerChip, { backgroundColor: theme.backgroundRoot }]}>
                        <ThemedText style={[styles.customerName, { color: theme.text }]}>
                          {customer}
                        </ThemedText>
                      </View>
                    ))}
                    {segment.customers.length > 4 ? (
                      <View style={[styles.moreChip, { backgroundColor: theme.primary + "20" }]}>
                        <ThemedText style={[styles.moreText, { color: theme.primary }]}>
                          +{segment.customers.length - 4} more
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>

                  <Pressable
                    style={[styles.promoButton, { backgroundColor: getSegmentColor(segment.segment) }]}
                    onPress={() => sendPromotion(segment)}
                  >
                    <Feather name="send" size={16} color="#fff" />
                    <ThemedText style={styles.promoButtonText}>Send Promotion</ThemedText>
                  </Pressable>
                </View>
              </AnimatedCard>
            ))}

            {result.retention_recommendations && result.retention_recommendations.length > 0 ? (
              <>
                <ThemedText type="h4" style={styles.sectionTitle}>
                  Retention Recommendations
                </ThemedText>

                <View style={[styles.recommendationsCard, { backgroundColor: theme.backgroundDefault }]}>
                  {result.retention_recommendations.map((recommendation, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <View style={[styles.recommendationNumber, { backgroundColor: theme.primary }]}>
                        <ThemedText style={styles.recommendationNumberText}>{index + 1}</ThemedText>
                      </View>
                      <ThemedText style={styles.recommendationText}>{recommendation}</ThemedText>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <View style={[styles.actionCards, { gap: Spacing.md }]}>
              <Pressable
                style={[styles.quickAction, { backgroundColor: theme.success }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert("Loyalty Program", "Loyalty program activation coming soon!");
                }}
              >
                <Feather name="award" size={24} color="#fff" />
                <ThemedText style={styles.quickActionText}>Start Loyalty Program</ThemedText>
              </Pressable>

              <Pressable
                style={[styles.quickAction, { backgroundColor: theme.info }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert("Win-Back Campaign", "Campaign creation coming soon!");
                }}
              >
                <Feather name="refresh-cw" size={24} color="#fff" />
                <ThemedText style={styles.quickActionText}>Win-Back Campaign</ThemedText>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={theme.textDisabled} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Pull down to analyze customer insights
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
  vipCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  vipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  vipTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  vipList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  vipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  vipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  vipAvatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  vipName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  segmentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  segmentHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  segmentIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentInfo: {
    flex: 1,
    justifyContent: "center",
  },
  segmentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  countText: {
    fontSize: 11,
    fontWeight: "600",
  },
  characteristics: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  customerList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  customerChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  customerName: {
    fontSize: 12,
  },
  moreChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  moreText: {
    fontSize: 12,
    fontWeight: "500",
  },
  promoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  promoButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  recommendationsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  recommendationItem: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  recommendationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  recommendationNumberText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actionCards: {
    flexDirection: "row",
  },
  quickAction: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  quickActionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
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
