import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, TextInput as RNTextInput, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

interface Interaction {
  drugs: string[];
  severity: "high" | "moderate" | "low";
  description: string;
  recommendation: string;
}

interface InteractionResult {
  interactions: Interaction[];
  safe: boolean;
}

export default function DrugInteractionsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [drugs, setDrugs] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);

  const addDrug = () => {
    if (inputValue.trim() && !drugs.includes(inputValue.trim().toLowerCase())) {
      setDrugs([...drugs, inputValue.trim()]);
      setInputValue("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const removeDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const checkInteractions = async () => {
    if (drugs.length < 2) {
      Alert.alert("Add Drugs", "Please add at least 2 drugs to check for interactions");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await apiRequest("POST", "/api/ai/drug-interactions", { drugs });
      const data = await response.json();

      if (data.success) {
        setResult(data.data as InteractionResult);
        Haptics.notificationAsync(
          data.data.safe
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
      } else {
        Alert.alert("Error", data.error || "Failed to check interactions");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to AI service");
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return theme.error;
      case "moderate":
        return theme.warning;
      case "low":
        return theme.info;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={[styles.infoCard, { backgroundColor: theme.warning + "20" }]}>
          <Feather name="alert-triangle" size={20} color={theme.warning} />
          <ThemedText style={[styles.infoText, { color: theme.warning }]}>
            This is an AI-powered tool for reference only. Always consult a healthcare professional for medical decisions.
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.cardTitle}>Add Medications</ThemedText>
          
          <View style={styles.inputRow}>
            <RNTextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundRoot,
                  color: theme.text,
                  borderColor: theme.divider,
                },
              ]}
              placeholder="Enter drug name..."
              placeholderTextColor={theme.textDisabled}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={addDrug}
              returnKeyType="done"
            />
            <Pressable
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={addDrug}
            >
              <Feather name="plus" size={24} color="#fff" />
            </Pressable>
          </View>

          {drugs.length > 0 ? (
            <View style={styles.drugsContainer}>
              {drugs.map((drug, index) => (
                <View
                  key={index}
                  style={[styles.drugChip, { backgroundColor: theme.primary + "20" }]}
                >
                  <ThemedText style={[styles.drugText, { color: theme.primary }]}>
                    {drug}
                  </ThemedText>
                  <Pressable onPress={() => removeDrug(index)}>
                    <Feather name="x" size={16} color={theme.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            style={[
              styles.checkButton,
              {
                backgroundColor: drugs.length >= 2 && !isLoading ? theme.primary : theme.divider,
              },
            ]}
            onPress={checkInteractions}
            disabled={drugs.length < 2 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="zap" size={20} color="#fff" />
                <ThemedText style={styles.checkButtonText}>Check Interactions</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        {result ? (
          <View style={[styles.resultCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.resultHeader}>
              <View
                style={[
                  styles.resultIcon,
                  { backgroundColor: result.safe ? theme.success + "20" : theme.error + "20" },
                ]}
              >
                <Feather
                  name={result.safe ? "check-circle" : "alert-circle"}
                  size={32}
                  color={result.safe ? theme.success : theme.error}
                />
              </View>
              <ThemedText type="h3" style={[styles.resultTitle, { color: result.safe ? theme.success : theme.error }]}>
                {result.safe ? "No Major Interactions Found" : "Interactions Detected"}
              </ThemedText>
            </View>

            {result.interactions.length > 0 ? (
              <View style={styles.interactionsList}>
                {result.interactions.map((interaction, index) => (
                  <View
                    key={index}
                    style={[
                      styles.interactionItem,
                      { borderLeftColor: getSeverityColor(interaction.severity) },
                    ]}
                  >
                    <View style={styles.interactionHeader}>
                      <ThemedText style={styles.interactionDrugs}>
                        {interaction.drugs.join(" + ")}
                      </ThemedText>
                      <View
                        style={[
                          styles.severityBadge,
                          { backgroundColor: getSeverityColor(interaction.severity) + "20" },
                        ]}
                      >
                        <ThemedText
                          style={[styles.severityText, { color: getSeverityColor(interaction.severity) }]}
                        >
                          {interaction.severity.toUpperCase()}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={[styles.interactionDescription, { color: theme.textSecondary }]}>
                      {interaction.description}
                    </ThemedText>
                    <View style={[styles.recommendationBox, { backgroundColor: theme.info + "10" }]}>
                      <Feather name="info" size={14} color={theme.info} />
                      <ThemedText style={[styles.recommendationText, { color: theme.info }]}>
                        {interaction.recommendation}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText style={[styles.noInteractionsText, { color: theme.textSecondary }]}>
                These medications appear to be safe to use together. However, always follow your healthcare provider's advice.
              </ThemedText>
            )}
          </View>
        ) : null}
      </KeyboardAwareScrollViewCompat>
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
  infoCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    marginBottom: Spacing.lg,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 14,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  drugsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  drugChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  drugText: {
    fontSize: 14,
    fontWeight: "500",
  },
  checkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  checkButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  resultCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  resultIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  resultTitle: {
    textAlign: "center",
  },
  interactionsList: {
    gap: Spacing.lg,
  },
  interactionItem: {
    borderLeftWidth: 4,
    paddingLeft: Spacing.md,
  },
  interactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  interactionDrugs: {
    fontWeight: "600",
    fontSize: 15,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  interactionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  recommendationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  recommendationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  noInteractionsText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});
