import React, { useState } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
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

type RouteProps = RouteProp<RootStackParamList, "AddMedicine">;

export default function AddMedicineScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();

  const [name, setName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [brand, setBrand] = useState("");
  const [strength, setStrength] = useState("");
  const [form, setForm] = useState("");
  const [packSize, setPackSize] = useState("1");
  const [barcode, setBarcode] = useState(route.params?.barcode || "");
  const [hsnCode, setHsnCode] = useState("");
  const [scheduleDrug, setScheduleDrug] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/medicines", {
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        brand: brand.trim() || undefined,
        strength: strength.trim() || undefined,
        form: form.trim() || undefined,
        packSize: parseInt(packSize) || 1,
        barcode: barcode.trim() || undefined,
        hsnCode: hsnCode.trim() || undefined,
        scheduleDrug: scheduleDrug.trim() || undefined,
        storageLocation: storageLocation.trim() || undefined,
        reorderLevel: parseInt(reorderLevel) || 10,
        description: description.trim() || undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      Alert.alert(
        "Success",
        `${name} has been added successfully!`,
        [
          {
            text: "Add Batch",
            onPress: () => navigation.navigate("AddBatch" as any, { medicineId: data.id }),
          },
          { text: "Done", onPress: () => navigation.goBack() },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to add medicine");
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Medicine name is required");
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
        <ThemedText type="h4" style={styles.sectionTitle}>Basic Information</ThemedText>
        <View style={styles.formSection}>
          <TextInput
            label="Medicine Name *"
            placeholder="Enter medicine name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            label="Generic Name"
            placeholder="Enter generic name"
            value={genericName}
            onChangeText={setGenericName}
          />
          <TextInput
            label="Brand"
            placeholder="Enter brand name"
            value={brand}
            onChangeText={setBrand}
          />
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <TextInput
                label="Strength"
                placeholder="e.g., 500mg"
                value={strength}
                onChangeText={setStrength}
              />
            </View>
            <View style={styles.halfInput}>
              <TextInput
                label="Form"
                placeholder="e.g., Tablet"
                value={form}
                onChangeText={setForm}
              />
            </View>
          </View>
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Product Details</ThemedText>
        <View style={styles.formSection}>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <TextInput
                label="Pack Size"
                placeholder="1"
                value={packSize}
                onChangeText={setPackSize}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInput
                label="Reorder Level"
                placeholder="10"
                value={reorderLevel}
                onChangeText={setReorderLevel}
                keyboardType="numeric"
              />
            </View>
          </View>
          <TextInput
            label="Barcode"
            placeholder="Enter or scan barcode"
            value={barcode}
            onChangeText={setBarcode}
          />
          <TextInput
            label="HSN Code"
            placeholder="Enter HSN code"
            value={hsnCode}
            onChangeText={setHsnCode}
          />
          <TextInput
            label="Schedule Drug"
            placeholder="e.g., H, H1, X"
            value={scheduleDrug}
            onChangeText={setScheduleDrug}
          />
          <TextInput
            label="Storage Location"
            placeholder="e.g., Rack A, Shelf 2"
            value={storageLocation}
            onChangeText={setStorageLocation}
          />
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Additional Info</ThemedText>
        <View style={styles.formSection}>
          <TextInput
            label="Description"
            placeholder="Enter product description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top" }}
          />
        </View>

        <Button onPress={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Adding..." : "Add Medicine"}
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
