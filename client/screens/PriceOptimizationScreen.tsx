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

interface Recommendation {
  name: string;
  suggested_price: number;
  expected_profit_change: string;
  reasoning: string;
}

interface PricingResult {
  recommendations: Recommendation[];
}

interface Medicine {
  id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
}

export default function PriceOptimizationScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);

  const { data: medicines } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });

  const sampleMedicines = medicines?.slice(0, 8) || [
    { id: "1", name: "Paracetamol 500mg", costPrice: 8, sellingPrice: 12 },
    { id: "2", name: "Amoxicillin 500mg", costPrice: 15, sellingPrice: 25 },
    { id: "3", name: "Ibuprofen 400mg", costPrice: 10, sellingPrice: 18 },
    { id: "4", name: "Omeprazole 20mg", costPrice: 12, sellingPrice: 20 },
    { id: "5", name: "Metformin 500mg", costPrice: 6, sellingPrice: 10 },
    { id: "6", name: "Amlodipine 5mg", costPrice: 8, sellingPrice: 15 },
  ];

  const toggleMedicine = (id: string) => {
    setSelectedMedicines((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectAll = () => {
    if (selectedMedicines.length === sampleMedicines.length) {
      setSelectedMedicines([]);
    } else {
      setSelectedMedicines(sampleMedicines.map((m) => m.id));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const optimizePricing = async () => {
    if (selectedMedicines.length === 0) {
      Alert.alert("Select Medicines", "Please select at least one medicine to optimize");
      return;
    }

    setIsLoading(true);
    setResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const medicinesData = sampleMedicines
        .filter((m) => selectedMedicines.includes(m.id))
        .map((m) => ({
          name: m.name,
          cost: m.costPrice,
          currentPrice: m.sellingPrice,
          salesVolume: Math.floor(Math.random() * 100) + 20,
        }));

      const response = await apiRequest("POST", "/api/ai/optimize-pricing", {
        medicines: medicinesData,
      });
      const data = await response.json();

      if (data.success && data.data) {
        setResult(data.data as PricingResult);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", data.error || "Failed to optimize pricing");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to AI service");
    } finally {
      setIsLoading(false);
    }
  };

  const applyRecommendation = (recommendation: Recommendation) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Price Updated",
      `${recommendation.name} price updated to Rs ${recommendation.suggested_price}`
    );
  };

  const getProfitChangeColor = (change: string) => {
    if (change.includes("+")) return theme.success;
    if (change.includes("-")) return theme.error;
    return theme.textSecondary;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={[styles.headerCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="dollar-sign" size={32} color={theme.primary} />
          </View>
          <ThemedText type="h4" style={styles.headerTitle}>AI Price Optimization</ThemedText>
          <ThemedText style={[styles.headerDescription, { color: theme.textSecondary }]}>
            AI analyzes your costs, sales volume, and market trends to suggest optimal pricing that maximizes profit margins.
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.cardHeader}>
            <ThemedText type="h4">Select Medicines</ThemedText>
            <Pressable onPress={selectAll}>
              <ThemedText style={[styles.selectAllText, { color: theme.primary }]}>
                {selectedMedicines.length === sampleMedicines.length ? "Deselect All" : "Select All"}
              </ThemedText>
            </Pressable>
          </View>

          {sampleMedicines.map((medicine) => (
            <Pressable
              key={medicine.id}
              style={[
                styles.medicineItem,
                {
                  backgroundColor: selectedMedicines.includes(medicine.id)
                    ? theme.primary + "10"
                    : "transparent",
                  borderColor: selectedMedicines.includes(medicine.id)
                    ? theme.primary
                    : theme.divider,
                },
              ]}
              onPress={() => toggleMedicine(medicine.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: selectedMedicines.includes(medicine.id)
                      ? theme.primary
                      : "transparent",
                    borderColor: selectedMedicines.includes(medicine.id)
                      ? theme.primary
                      : theme.divider,
                  },
                ]}
              >
                {selectedMedicines.includes(medicine.id) ? (
                  <Feather name="check" size={14} color="#fff" />
                ) : null}
              </View>
              <View style={styles.medicineInfo}>
                <ThemedText style={styles.medicineName}>{medicine.name}</ThemedText>
                <ThemedText style={[styles.medicinePrice, { color: theme.textSecondary }]}>
                  Cost: Rs {medicine.costPrice} | Selling: Rs {medicine.sellingPrice}
                </ThemedText>
              </View>
              <View style={[styles.marginBadge, { backgroundColor: theme.success + "20" }]}>
                <ThemedText style={[styles.marginText, { color: theme.success }]}>
                  {Math.round(((medicine.sellingPrice - medicine.costPrice) / medicine.costPrice) * 100)}%
                </ThemedText>
              </View>
            </Pressable>
          ))}

          <Pressable
            style={[
              styles.optimizeButton,
              {
                backgroundColor:
                  selectedMedicines.length > 0 && !isLoading ? theme.primary : theme.divider,
              },
            ]}
            onPress={optimizePricing}
            disabled={selectedMedicines.length === 0 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="zap" size={20} color="#fff" />
                <ThemedText style={styles.optimizeButtonText}>
                  Optimize {selectedMedicines.length} Medicine{selectedMedicines.length !== 1 ? "s" : ""}
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>

        {result && result.recommendations ? (
          <>
            <ThemedText type="h4" style={styles.sectionTitle}>Recommendations</ThemedText>

            {result.recommendations.map((recommendation, index) => {
              const currentMedicine = sampleMedicines.find(
                (m) => m.name === recommendation.name
              );
              const currentPrice = currentMedicine?.sellingPrice || 0;
              const priceChange = recommendation.suggested_price - currentPrice;

              return (
                <AnimatedCard key={index}>
                  <View style={[styles.recommendationCard, { backgroundColor: theme.backgroundDefault }]}>
                    <View style={styles.recommendationHeader}>
                      <ThemedText style={styles.recommendationName}>
                        {recommendation.name}
                      </ThemedText>
                      <View
                        style={[
                          styles.profitBadge,
                          { backgroundColor: getProfitChangeColor(recommendation.expected_profit_change) + "20" },
                        ]}
                      >
                        <Feather
                          name={
                            recommendation.expected_profit_change.includes("+")
                              ? "trending-up"
                              : "trending-down"
                          }
                          size={14}
                          color={getProfitChangeColor(recommendation.expected_profit_change)}
                        />
                        <ThemedText
                          style={[
                            styles.profitText,
                            { color: getProfitChangeColor(recommendation.expected_profit_change) },
                          ]}
                        >
                          {recommendation.expected_profit_change}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.priceComparison}>
                      <View style={styles.priceColumn}>
                        <ThemedText style={[styles.priceLabel, { color: theme.textSecondary }]}>
                          Current Price
                        </ThemedText>
                        <ThemedText style={styles.priceValue}>Rs {currentPrice}</ThemedText>
                      </View>
                      <View style={styles.arrowContainer}>
                        <Feather name="arrow-right" size={24} color={theme.primary} />
                      </View>
                      <View style={styles.priceColumn}>
                        <ThemedText style={[styles.priceLabel, { color: theme.textSecondary }]}>
                          Suggested Price
                        </ThemedText>
                        <ThemedText style={[styles.priceValue, { color: theme.primary }]}>
                          Rs {recommendation.suggested_price}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.priceChange,
                            { color: priceChange >= 0 ? theme.success : theme.error },
                          ]}
                        >
                          {priceChange >= 0 ? "+" : ""}Rs {priceChange}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={[styles.reasoningBox, { backgroundColor: theme.info + "10" }]}>
                      <Feather name="info" size={14} color={theme.info} />
                      <ThemedText style={[styles.reasoningText, { color: theme.info }]}>
                        {recommendation.reasoning}
                      </ThemedText>
                    </View>

                    <View style={styles.actionRow}>
                      <Pressable
                        style={[styles.applyButton, { backgroundColor: theme.success }]}
                        onPress={() => applyRecommendation(recommendation)}
                      >
                        <Feather name="check" size={16} color="#fff" />
                        <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
                      </Pressable>
                      <Pressable
                        style={[styles.skipButton, { borderColor: theme.divider }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <ThemedText style={[styles.skipButtonText, { color: theme.textSecondary }]}>
                          Skip
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </AnimatedCard>
              );
            })}

            <Pressable
              style={[styles.applyAllButton, { backgroundColor: theme.success }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "All pricing recommendations applied");
              }}
            >
              <Feather name="check-circle" size={20} color="#fff" />
              <ThemedText style={styles.applyAllButtonText}>Apply All Recommendations</ThemedText>
            </Pressable>
          </>
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
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  medicineItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: "500",
  },
  medicinePrice: {
    fontSize: 12,
    marginTop: 2,
  },
  marginBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  marginText: {
    fontSize: 11,
    fontWeight: "600",
  },
  optimizeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  optimizeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  recommendationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  profitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  profitText: {
    fontSize: 12,
    fontWeight: "600",
  },
  priceComparison: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  priceColumn: {
    flex: 1,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  priceChange: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  arrowContainer: {
    paddingHorizontal: Spacing.md,
  },
  reasoningBox: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reasoningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  applyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  skipButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  skipButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  applyAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  applyAllButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
