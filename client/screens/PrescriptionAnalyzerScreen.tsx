import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, TextInput as RNTextInput, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AnimatedCard } from "@/components/AnimatedCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity_needed: number;
}

interface PrescriptionResult {
  medications: Medication[];
  warnings: string[];
  is_valid: boolean;
  notes: string;
}

const SAMPLE_PRESCRIPTIONS = [
  "Tab Paracetamol 500mg - 1 tablet 3 times daily for 5 days\nTab Amoxicillin 500mg - 1 capsule 3 times daily for 7 days",
  "Cap Omeprazole 20mg - 1 capsule before breakfast for 14 days\nTab Domperidone 10mg - 1 tablet 3 times daily before meals for 7 days",
  "Tab Metformin 500mg - 1 tablet twice daily with meals\nTab Amlodipine 5mg - 1 tablet once daily in the morning",
];

export default function PrescriptionAnalyzerScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [prescriptionText, setPrescriptionText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PrescriptionResult | null>(null);

  const analyzePrescription = async () => {
    if (!prescriptionText.trim()) {
      Alert.alert("Enter Prescription", "Please enter prescription text to analyze");
      return;
    }

    setIsLoading(true);
    setResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await apiRequest("POST", "/api/ai/analyze-prescription", {
        prescriptionText: prescriptionText.trim(),
      });
      const data = await response.json();

      if (data.success && data.data) {
        setResult(data.data as PrescriptionResult);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", data.error || "Failed to analyze prescription");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to AI service");
    } finally {
      setIsLoading(false);
    }
  };

  const useSamplePrescription = (index: number) => {
    setPrescriptionText(SAMPLE_PRESCRIPTIONS[index]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addToCart = (medication: Medication) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Added to Cart",
      `${medication.name} x ${medication.quantity_needed} units added to sale cart`
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={[styles.infoCard, { backgroundColor: theme.info + "20" }]}>
          <Feather name="file-text" size={20} color={theme.info} />
          <ThemedText style={[styles.infoText, { color: theme.info }]}>
            Enter or paste prescription text to extract medications and quantities automatically using AI.
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.cardTitle}>Prescription Text</ThemedText>

          <RNTextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.backgroundRoot,
                color: theme.text,
                borderColor: theme.divider,
              },
            ]}
            placeholder="Enter prescription details here..."
            placeholderTextColor={theme.textDisabled}
            value={prescriptionText}
            onChangeText={setPrescriptionText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <ThemedText style={[styles.sampleLabel, { color: theme.textSecondary }]}>
            Try a sample:
          </ThemedText>
          <View style={styles.sampleButtons}>
            {["Cold & Flu", "Gastric", "Chronic"].map((label, index) => (
              <Pressable
                key={index}
                style={[styles.sampleButton, { backgroundColor: theme.primary + "20" }]}
                onPress={() => useSamplePrescription(index)}
              >
                <ThemedText style={[styles.sampleButtonText, { color: theme.primary }]}>
                  {label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[
              styles.analyzeButton,
              {
                backgroundColor: prescriptionText.trim() && !isLoading ? theme.primary : theme.divider,
              },
            ]}
            onPress={analyzePrescription}
            disabled={!prescriptionText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="cpu" size={20} color="#fff" />
                <ThemedText style={styles.analyzeButtonText}>Analyze with AI</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        {result ? (
          <>
            <View style={styles.resultHeader}>
              <View
                style={[
                  styles.validityBadge,
                  { backgroundColor: result.is_valid ? theme.success + "20" : theme.error + "20" },
                ]}
              >
                <Feather
                  name={result.is_valid ? "check-circle" : "alert-circle"}
                  size={16}
                  color={result.is_valid ? theme.success : theme.error}
                />
                <ThemedText
                  style={[
                    styles.validityText,
                    { color: result.is_valid ? theme.success : theme.error },
                  ]}
                >
                  {result.is_valid ? "Valid Prescription" : "Needs Review"}
                </ThemedText>
              </View>
              <ThemedText type="h4">Extracted Medications</ThemedText>
            </View>

            {result.medications.map((medication, index) => (
              <AnimatedCard key={index}>
                <View style={[styles.medicationCard, { backgroundColor: theme.backgroundDefault }]}>
                  <View style={styles.medicationHeader}>
                    <View style={[styles.medicationIcon, { backgroundColor: theme.primary + "20" }]}>
                      <Feather name="package" size={20} color={theme.primary} />
                    </View>
                    <View style={styles.medicationInfo}>
                      <ThemedText style={styles.medicationName}>{medication.name}</ThemedText>
                      <ThemedText style={[styles.medicationDosage, { color: theme.textSecondary }]}>
                        {medication.dosage}
                      </ThemedText>
                    </View>
                    <View style={[styles.quantityBadge, { backgroundColor: theme.success + "20" }]}>
                      <ThemedText style={[styles.quantityText, { color: theme.success }]}>
                        x{medication.quantity_needed}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.medicationDetails}>
                    <View style={styles.detailItem}>
                      <Feather name="clock" size={14} color={theme.textSecondary} />
                      <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                        {medication.frequency}
                      </ThemedText>
                    </View>
                    <View style={styles.detailItem}>
                      <Feather name="calendar" size={14} color={theme.textSecondary} />
                      <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                        {medication.duration}
                      </ThemedText>
                    </View>
                  </View>

                  <Pressable
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={() => addToCart(medication)}
                  >
                    <Feather name="shopping-cart" size={16} color="#fff" />
                    <ThemedText style={styles.addButtonText}>Add to Sale</ThemedText>
                  </Pressable>
                </View>
              </AnimatedCard>
            ))}

            {result.warnings.length > 0 ? (
              <View style={[styles.warningsCard, { backgroundColor: theme.warning + "20" }]}>
                <View style={styles.warningsHeader}>
                  <Feather name="alert-triangle" size={20} color={theme.warning} />
                  <ThemedText style={[styles.warningsTitle, { color: theme.warning }]}>
                    Warnings
                  </ThemedText>
                </View>
                {result.warnings.map((warning, index) => (
                  <View key={index} style={styles.warningItem}>
                    <ThemedText style={[styles.warningText, { color: theme.warning }]}>
                      • {warning}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : null}

            {result.notes ? (
              <View style={[styles.notesCard, { backgroundColor: theme.info + "10" }]}>
                <Feather name="info" size={16} color={theme.info} />
                <ThemedText style={[styles.notesText, { color: theme.info }]}>
                  {result.notes}
                </ThemedText>
              </View>
            ) : null}

            <Pressable
              style={[styles.addAllButton, { backgroundColor: theme.success }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "All medications added to sale cart");
              }}
            >
              <Feather name="check-circle" size={20} color="#fff" />
              <ThemedText style={styles.addAllButtonText}>Add All to Sale</ThemedText>
            </Pressable>
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
  textArea: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 120,
  },
  sampleLabel: {
    fontSize: 12,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sampleButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sampleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  sampleButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  analyzeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  resultHeader: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  validityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  validityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  medicationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  medicationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  medicationIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 15,
    fontWeight: "600",
  },
  medicationDosage: {
    fontSize: 13,
  },
  quantityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "700",
  },
  medicationDetails: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  warningsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  warningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  warningsTitle: {
    fontWeight: "600",
    fontSize: 15,
  },
  warningItem: {
    marginLeft: Spacing.md,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  notesCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  addAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  addAllButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
