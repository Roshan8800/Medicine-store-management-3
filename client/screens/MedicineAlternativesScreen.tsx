import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, TextInput as RNTextInput, ActivityIndicator, Alert } from "react-native";
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
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

interface Alternative {
  name: string;
  generic_name: string;
  reason: string;
  considerations: string;
}

interface AlternativesResult {
  alternatives: Alternative[];
}

const REASONS = [
  { id: "out_of_stock", label: "Out of Stock", icon: "package" },
  { id: "cost", label: "Lower Cost", icon: "dollar-sign" },
  { id: "side_effects", label: "Side Effects", icon: "alert-circle" },
  { id: "allergy", label: "Allergy", icon: "alert-triangle" },
  { id: "preference", label: "Patient Preference", icon: "user" },
];

export default function MedicineAlternativesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [medicineName, setMedicineName] = useState("");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AlternativesResult | null>(null);

  const { data: medicines } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/medicines"],
  });

  const findAlternatives = async () => {
    if (!medicineName.trim()) {
      Alert.alert("Enter Medicine", "Please enter a medicine name to find alternatives");
      return;
    }

    if (!selectedReason) {
      Alert.alert("Select Reason", "Please select why you need an alternative");
      return;
    }

    setIsLoading(true);
    setResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const reasonLabel = REASONS.find(r => r.id === selectedReason)?.label || selectedReason;
      const response = await apiRequest("POST", "/api/ai/alternatives", {
        medicine: medicineName.trim(),
        reason: reasonLabel,
      });
      const data = await response.json();

      if (data.success && data.data) {
        setResult(data.data as AlternativesResult);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", data.error || "Failed to find alternatives");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to AI service");
    } finally {
      setIsLoading(false);
    }
  };

  const selectMedicine = (name: string) => {
    setMedicineName(name);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addAlternative = (alternative: Alternative) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Alternative Selected",
      `${alternative.name} (${alternative.generic_name}) can be used as an alternative.`
    );
  };

  const popularMedicines = medicines?.slice(0, 6) || [
    { id: "1", name: "Paracetamol 500mg" },
    { id: "2", name: "Amoxicillin 500mg" },
    { id: "3", name: "Ibuprofen 400mg" },
    { id: "4", name: "Omeprazole 20mg" },
    { id: "5", name: "Metformin 500mg" },
    { id: "6", name: "Amlodipine 5mg" },
  ];

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={[styles.infoCard, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="refresh-cw" size={20} color={theme.primary} />
          <ThemedText style={[styles.infoText, { color: theme.primary }]}>
            AI-powered alternative finder helps you suggest equivalent medicines when needed.
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.cardTitle}>Medicine Name</ThemedText>

          <RNTextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundRoot,
                color: theme.text,
                borderColor: theme.divider,
              },
            ]}
            placeholder="Enter medicine name..."
            placeholderTextColor={theme.textDisabled}
            value={medicineName}
            onChangeText={setMedicineName}
          />

          <ThemedText style={[styles.quickLabel, { color: theme.textSecondary }]}>
            Quick select:
          </ThemedText>
          <View style={styles.quickButtons}>
            {popularMedicines.map((med) => (
              <Pressable
                key={med.id}
                style={[
                  styles.quickButton,
                  {
                    backgroundColor: medicineName === med.name ? theme.primary : theme.primary + "20",
                  },
                ]}
                onPress={() => selectMedicine(med.name)}
              >
                <ThemedText
                  style={[
                    styles.quickButtonText,
                    { color: medicineName === med.name ? "#fff" : theme.primary },
                  ]}
                >
                  {med.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.cardTitle}>Reason for Alternative</ThemedText>

          <View style={styles.reasonsGrid}>
            {REASONS.map((reason) => (
              <Pressable
                key={reason.id}
                style={[
                  styles.reasonCard,
                  {
                    backgroundColor: selectedReason === reason.id ? theme.primary : theme.backgroundRoot,
                    borderColor: selectedReason === reason.id ? theme.primary : theme.divider,
                  },
                ]}
                onPress={() => {
                  setSelectedReason(reason.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Feather
                  name={reason.icon as any}
                  size={24}
                  color={selectedReason === reason.id ? "#fff" : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.reasonLabel,
                    { color: selectedReason === reason.id ? "#fff" : theme.text },
                  ]}
                >
                  {reason.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[
              styles.searchButton,
              {
                backgroundColor:
                  medicineName.trim() && selectedReason && !isLoading
                    ? theme.primary
                    : theme.divider,
              },
            ]}
            onPress={findAlternatives}
            disabled={!medicineName.trim() || !selectedReason || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="search" size={20} color="#fff" />
                <ThemedText style={styles.searchButtonText}>Find Alternatives</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        {result && result.alternatives ? (
          <>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {result.alternatives.length} Alternative{result.alternatives.length !== 1 ? "s" : ""} Found
            </ThemedText>

            {result.alternatives.map((alternative, index) => (
              <AnimatedCard key={index}>
                <View style={[styles.alternativeCard, { backgroundColor: theme.backgroundDefault }]}>
                  <View style={styles.alternativeHeader}>
                    <View style={[styles.alternativeIcon, { backgroundColor: theme.success + "20" }]}>
                      <Feather name="check-circle" size={24} color={theme.success} />
                    </View>
                    <View style={styles.alternativeInfo}>
                      <ThemedText style={styles.alternativeName}>{alternative.name}</ThemedText>
                      <ThemedText style={[styles.alternativeGeneric, { color: theme.textSecondary }]}>
                        Generic: {alternative.generic_name}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.reasonBox, { backgroundColor: theme.info + "10" }]}>
                    <Feather name="info" size={14} color={theme.info} />
                    <ThemedText style={[styles.reasonText, { color: theme.info }]}>
                      {alternative.reason}
                    </ThemedText>
                  </View>

                  {alternative.considerations ? (
                    <View style={[styles.considerationsBox, { backgroundColor: theme.warning + "10" }]}>
                      <Feather name="alert-circle" size={14} color={theme.warning} />
                      <ThemedText style={[styles.considerationsText, { color: theme.warning }]}>
                        {alternative.considerations}
                      </ThemedText>
                    </View>
                  ) : null}

                  <View style={styles.actionRow}>
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: theme.primary }]}
                      onPress={() => addAlternative(alternative)}
                    >
                      <Feather name="plus" size={16} color="#fff" />
                      <ThemedText style={styles.actionButtonText}>Use This</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.secondaryButton, { borderColor: theme.divider }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        Alert.alert("Drug Info", `Detailed information about ${alternative.name}`);
                      }}
                    >
                      <Feather name="book-open" size={16} color={theme.textSecondary} />
                      <ThemedText style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
                        Details
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </AnimatedCard>
            ))}
          </>
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
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 14,
  },
  quickLabel: {
    fontSize: 12,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  quickButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  quickButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  reasonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  reasonCard: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  alternativeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  alternativeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  alternativeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  alternativeInfo: {
    flex: 1,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: "600",
  },
  alternativeGeneric: {
    fontSize: 13,
  },
  reasonBox: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  considerationsBox: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  considerationsText: {
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
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
