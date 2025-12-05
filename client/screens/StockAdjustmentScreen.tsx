import React, { useState } from "react";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "StockAdjustment">;
type AdjustmentType = "add" | "remove" | "damage" | "expired" | "return";

export default function StockAdjustmentScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { medicineId, batchId } = route.params;

  const { data: medicine } = useQuery({
    queryKey: ["/api/medicines", medicineId],
  });

  const batch = (medicine as any)?.batches?.find((b: any) => b.id === batchId);

  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const adjustmentTypes: { value: AdjustmentType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { value: "add", label: "Add Stock", icon: "plus-circle" },
    { value: "remove", label: "Remove", icon: "minus-circle" },
    { value: "damage", label: "Damaged", icon: "alert-triangle" },
    { value: "expired", label: "Expired", icon: "clock" },
    { value: "return", label: "Returned", icon: "corner-up-left" },
  ];

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stock-adjustments", {
        batchId,
        adjustmentType,
        quantity: parseInt(quantity),
        reason: reason.trim() || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      Alert.alert("Success", "Stock adjusted successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to adjust stock");
    },
  });

  const handleSubmit = () => {
    if (!quantity || parseInt(quantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }
    if (adjustmentType !== "add" && parseInt(quantity) > (batch?.quantity || 0)) {
      Alert.alert("Error", "Cannot remove more than available quantity");
      return;
    }
    createMutation.mutate();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        {medicine && batch ? (
          <View style={[styles.batchInfo, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4">{(medicine as any).name}</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              Batch: {batch.batchNumber}
            </ThemedText>
            <View style={styles.currentStock}>
              <ThemedText style={{ color: theme.textSecondary }}>Current Stock:</ThemedText>
              <ThemedText type="h3" style={{ color: theme.primary, marginLeft: Spacing.sm }}>
                {batch.quantity}
              </ThemedText>
            </View>
          </View>
        ) : null}

        <ThemedText type="h4" style={styles.sectionTitle}>Adjustment Type</ThemedText>
        <View style={styles.typeGrid}>
          {adjustmentTypes.map((type) => (
            <Pressable
              key={type.value}
              style={[
                styles.typeCard,
                { 
                  backgroundColor: adjustmentType === type.value ? theme.primary : theme.backgroundDefault,
                  borderColor: adjustmentType === type.value ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setAdjustmentType(type.value)}
            >
              <Feather
                name={type.icon}
                size={24}
                color={adjustmentType === type.value ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                style={[
                  styles.typeLabel,
                  { color: adjustmentType === type.value ? "#FFFFFF" : theme.text },
                ]}
              >
                {type.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Details</ThemedText>
        <View style={styles.formSection}>
          <TextInput
            label="Quantity *"
            placeholder="Enter quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
          <TextInput
            label="Reason (Optional)"
            placeholder="Enter reason for adjustment"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top" }}
          />
        </View>

        <View style={[styles.preview, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={{ color: theme.textSecondary }}>New Stock Level:</ThemedText>
          <ThemedText type="h3" style={{ color: theme.primary }}>
            {batch
              ? adjustmentType === "add"
                ? batch.quantity + (parseInt(quantity) || 0)
                : Math.max(0, batch.quantity - (parseInt(quantity) || 0))
              : 0}
          </ThemedText>
        </View>

        <Button
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          style={{ marginTop: Spacing.lg }}
        >
          {createMutation.isPending ? "Adjusting..." : "Confirm Adjustment"}
        </Button>
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
  batchInfo: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  currentStock: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  typeCard: {
    width: "31%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    gap: Spacing.xs,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  formSection: {
    gap: Spacing.md,
  },
  preview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
});
