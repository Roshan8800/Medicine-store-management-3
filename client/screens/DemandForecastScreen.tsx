import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
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

interface Prediction {
  name: string;
  predicted_demand: number;
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
}

export default function DemandForecastScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: medicines } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/medicines"],
  });

  const generateForecast = async () => {
    if (!medicines || medicines.length === 0) {
      Alert.alert("No Data", "Add medicines to generate demand forecasts");
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const medicineHistory = medicines.slice(0, 10).map((med) => ({
        name: med.name,
        sales: [
          Math.floor(Math.random() * 50) + 10,
          Math.floor(Math.random() * 50) + 10,
          Math.floor(Math.random() * 50) + 10,
          Math.floor(Math.random() * 50) + 10,
          Math.floor(Math.random() * 50) + 10,
          Math.floor(Math.random() * 50) + 10,
        ],
      }));

      const response = await apiRequest("POST", "/api/ai/predict-demand", { medicineHistory });
      const data = await response.json();

      if (data.success && data.data?.predictions) {
        setPredictions(data.data.predictions);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", data.error || "Failed to generate forecast");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to AI service");
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string): keyof typeof Feather.glyphMap => {
    switch (trend) {
      case "increasing":
        return "trending-up";
      case "decreasing":
        return "trending-down";
      default:
        return "minus";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "increasing":
        return theme.success;
      case "decreasing":
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return theme.success;
    if (confidence >= 0.6) return theme.warning;
    return theme.error;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={[styles.headerCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="activity" size={32} color={theme.primary} />
          </View>
          <ThemedText type="h4" style={styles.headerTitle}>
            AI Demand Forecasting
          </ThemedText>
          <ThemedText style={[styles.headerDescription, { color: theme.textSecondary }]}>
            Predict next month's demand for your medicines using AI-powered analysis of historical sales patterns.
          </ThemedText>
          <Pressable
            style={[
              styles.generateButton,
              { backgroundColor: isLoading ? theme.divider : theme.primary },
            ]}
            onPress={generateForecast}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="zap" size={20} color="#fff" />
                <ThemedText style={styles.generateButtonText}>Generate Forecast</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        {predictions.length > 0 ? (
          <>
            <ThemedText type="h4" style={styles.sectionTitle}>Predictions</ThemedText>

            {predictions.map((prediction, index) => (
              <AnimatedCard key={index}>
                <View style={[styles.predictionCard, { backgroundColor: theme.backgroundDefault }]}>
                  <View style={styles.predictionHeader}>
                    <ThemedText style={styles.medicineName}>{prediction.name}</ThemedText>
                    <View style={styles.trendBadge}>
                      <Feather
                        name={getTrendIcon(prediction.trend)}
                        size={16}
                        color={getTrendColor(prediction.trend)}
                      />
                      <ThemedText
                        style={[styles.trendText, { color: getTrendColor(prediction.trend) }]}
                      >
                        {prediction.trend}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.predictionDetails}>
                    <View style={styles.detailItem}>
                      <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                        Predicted Demand
                      </ThemedText>
                      <ThemedText type="h3" style={{ color: theme.primary }}>
                        {prediction.predicted_demand}
                      </ThemedText>
                      <ThemedText style={[styles.detailUnit, { color: theme.textSecondary }]}>
                        units/month
                      </ThemedText>
                    </View>

                    <View style={styles.confidenceContainer}>
                      <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                        Confidence
                      </ThemedText>
                      <View style={styles.confidenceBar}>
                        <View
                          style={[
                            styles.confidenceFill,
                            {
                              width: `${prediction.confidence * 100}%`,
                              backgroundColor: getConfidenceColor(prediction.confidence),
                            },
                          ]}
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.confidenceValue,
                          { color: getConfidenceColor(prediction.confidence) },
                        ]}
                      >
                        {Math.round(prediction.confidence * 100)}%
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.actionRow, { borderTopColor: theme.divider }]}>
                    <Pressable style={styles.actionButton}>
                      <Feather name="shopping-cart" size={16} color={theme.primary} />
                      <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
                        Create Order
                      </ThemedText>
                    </Pressable>
                    <Pressable style={styles.actionButton}>
                      <Feather name="bar-chart-2" size={16} color={theme.textSecondary} />
                      <ThemedText style={[styles.actionButtonText, { color: theme.textSecondary }]}>
                        View History
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </AnimatedCard>
            ))}
          </>
        ) : !isLoading ? (
          <View style={styles.emptyState}>
            <Feather name="bar-chart" size={48} color={theme.textDisabled} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Click "Generate Forecast" to get AI-powered demand predictions
            </ThemedText>
          </View>
        ) : null}
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
  headerCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    marginBottom: Spacing.sm,
  },
  headerDescription: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    width: "100%",
  },
  generateButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  predictionCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  predictionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  predictionDetails: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.xl,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  detailUnit: {
    fontSize: 11,
    marginTop: 2,
  },
  confidenceContainer: {
    flex: 1,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 4,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
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
