import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BarcodeScannerScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const response = await apiRequest("GET", `/api/medicines/barcode/${data}`);
      const medicine = await response.json();
      
      Alert.alert(
        "Medicine Found",
        `${medicine.name}\n${medicine.brand || ""} ${medicine.strength || ""}`,
        [
          { text: "View Details", onPress: () => navigation.navigate("MedicineDetail", { medicineId: medicine.id }) },
          { text: "Scan Again", onPress: () => setScanned(false) },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Medicine Not Found",
        `No medicine found with barcode: ${data}`,
        [
          { text: "Add New", onPress: () => navigation.navigate("AddMedicine", { barcode: data }) },
          { text: "Scan Again", onPress: () => setScanned(false) },
        ]
      );
    }
  };

  const handleManualSearch = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert("Error", "Please enter a barcode");
      return;
    }
    await handleBarcodeScanned({ data: manualBarcode.trim() });
  };

  if (Platform.OS === "web") {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.webHeader}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>
        <View style={styles.webContent}>
          <Feather name="camera-off" size={64} color={theme.textDisabled} />
          <ThemedText type="h4" style={styles.webTitle}>Camera Not Available</ThemedText>
          <ThemedText style={[styles.webSubtitle, { color: theme.textSecondary }]}>
            Run in Expo Go to use barcode scanning
          </ThemedText>
          <View style={styles.manualEntry}>
            <TextInput
              placeholder="Enter barcode manually"
              value={manualBarcode}
              onChangeText={setManualBarcode}
            />
            <Button onPress={handleManualSearch}>Search</Button>
          </View>
        </View>
      </ThemedView>
    );
  }

  if (!permission) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Feather name="camera-off" size={64} color={theme.textDisabled} />
        <ThemedText type="h4" style={{ marginTop: Spacing.lg }}>Camera Access Required</ThemedText>
        <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
          Allow camera access to scan barcodes
        </ThemedText>
        <Button onPress={requestPermission} style={{ marginTop: Spacing.lg }}>
          Grant Permission
        </Button>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: Spacing.lg }}>
          <ThemedText type="link">Cancel</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"],
        }}
      />
      
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Scan Barcode</ThemedText>
          <Pressable onPress={() => setShowManualEntry(!showManualEntry)} style={styles.headerButton}>
            <Feather name="edit-3" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <ThemedText style={styles.instructions}>
            Position barcode within the frame
          </ThemedText>
        </View>

        {showManualEntry ? (
          <View style={[styles.manualEntryOverlay, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <TextInput
              placeholder="Enter barcode manually"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              style={{ backgroundColor: "#FFFFFF" }}
            />
            <Button onPress={handleManualSearch}>Search</Button>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  permissionText: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  webHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: Spacing.lg,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  webContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  webTitle: {
    marginTop: Spacing.lg,
  },
  webSubtitle: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  manualEntry: {
    width: "100%",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 280,
    height: 180,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFFFFF",
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    color: "#FFFFFF",
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  manualEntryOverlay: {
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
});
