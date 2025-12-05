import React, { useState } from "react";
import { View, StyleSheet, Alert, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "AddBatch">;

export default function AddBatchScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { medicineId } = route.params;

  const { data: medicine } = useQuery({
    queryKey: ["/api/medicines", medicineId],
  });

  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [manufacturingDate, setManufacturingDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [gstPercent, setGstPercent] = useState("12");
  const [quantity, setQuantity] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/batches", {
        medicineId,
        batchNumber: batchNumber.trim(),
        expiryDate: new Date(expiryDate).toISOString(),
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate).toISOString() : undefined,
        purchasePrice: purchasePrice.trim(),
        mrp: mrp.trim(),
        sellingPrice: sellingPrice.trim() || mrp.trim(),
        gstPercent: gstPercent.trim(),
        quantity: parseInt(quantity),
        initialQuantity: parseInt(quantity),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      Alert.alert("Success", "Batch added successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to add batch");
    },
  });

  const handleSubmit = () => {
    if (!batchNumber.trim()) {
      Alert.alert("Error", "Batch number is required");
      return;
    }
    if (!expiryDate) {
      Alert.alert("Error", "Expiry date is required");
      return;
    }
    if (!purchasePrice || !mrp) {
      Alert.alert("Error", "Purchase price and MRP are required");
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      Alert.alert("Error", "Valid quantity is required");
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
        {medicine ? (
          <View style={[styles.medicineInfo, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4">{(medicine as any).name}</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {(medicine as any).brand} {(medicine as any).strength}
            </ThemedText>
          </View>
        ) : null}

        <ThemedText type="h4" style={styles.sectionTitle}>Batch Details</ThemedText>
        <View style={styles.formSection}>
          <TextInput
            label="Batch Number *"
            placeholder="Enter batch number"
            value={batchNumber}
            onChangeText={setBatchNumber}
            autoCapitalize="characters"
          />
          <TextInput
            label="Expiry Date * (YYYY-MM-DD)"
            placeholder="2025-12-31"
            value={expiryDate}
            onChangeText={setExpiryDate}
          />
          <TextInput
            label="Manufacturing Date (YYYY-MM-DD)"
            placeholder="2024-01-01"
            value={manufacturingDate}
            onChangeText={setManufacturingDate}
          />
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Pricing</ThemedText>
        <View style={styles.formSection}>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <TextInput
                label="Purchase Price *"
                placeholder="0.00"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInput
                label="MRP *"
                placeholder="0.00"
                value={mrp}
                onChangeText={setMrp}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <TextInput
                label="Selling Price"
                placeholder="Same as MRP"
                value={sellingPrice}
                onChangeText={setSellingPrice}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInput
                label="GST %"
                placeholder="12"
                value={gstPercent}
                onChangeText={setGstPercent}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Stock</ThemedText>
        <View style={styles.formSection}>
          <TextInput
            label="Quantity *"
            placeholder="Enter quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
        </View>

        <Button 
          onPress={handleSubmit} 
          disabled={createMutation.isPending}
          style={{ marginTop: Spacing.xl }}
        >
          {createMutation.isPending ? "Adding..." : "Add Batch"}
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
  medicineInfo: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  formSection: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
});
