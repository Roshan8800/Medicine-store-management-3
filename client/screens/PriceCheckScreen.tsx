import React, { useState, useRef } from "react";
import { View, StyleSheet, Pressable, TextInput as RNTextInput, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeInDown, ZoomIn, useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PriceInfo {
  id: string;
  name: string;
  brand?: string;
  strength?: string;
  form?: string;
  mrp: number;
  sellingPrice: number;
  stock: number;
  expiryDate?: string;
  batchNumber?: string;
}

export default function PriceCheckScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const inputRef = useRef<RNTextInput>(null);
  const [barcode, setBarcode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const scale = useSharedValue(1);

  const handleLookup = async () => {
    if (!barcode.trim()) {
      Alert.alert("Error", "Please enter or scan a barcode");
      return;
    }

    setIsLoading(true);
    scale.value = withSpring(0.95);

    try {
      const response = await apiRequest("GET", `/api/medicines/barcode/${barcode}`);
      const medicine = await response.json();
      
      setPriceInfo({
        id: medicine.id,
        name: medicine.name,
        brand: medicine.brand,
        strength: medicine.strength,
        form: medicine.form,
        mrp: parseFloat(medicine.mrp || "0"),
        sellingPrice: parseFloat(medicine.sellingPrice || "0"),
        stock: medicine.stock || 0,
        expiryDate: medicine.expiryDate,
        batchNumber: medicine.batchNumber,
      });
      
      setShowResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPriceInfo(null);
      Alert.alert(
        "Not Found",
        `No medicine found with barcode: ${barcode}`,
        [
          { text: "Try Again", onPress: () => inputRef.current?.focus() },
          { text: "Add New", onPress: () => navigation.navigate("AddMedicine", { barcode }) },
        ]
      );
    } finally {
      setIsLoading(false);
      scale.value = withSpring(1);
    }
  };

  const handleClear = () => {
    setBarcode("");
    setPriceInfo(null);
    setShowResult(false);
    inputRef.current?.focus();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatCurrency = (amount: number) => `Rs ${amount.toFixed(2)}`;
  const discount = priceInfo ? ((priceInfo.mrp - priceInfo.sellingPrice) / priceInfo.mrp * 100).toFixed(0) : "0";

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + Spacing.xl }]}>
        <Animated.View entering={FadeInUp.delay(100)}>
          <View style={[styles.searchCard, { backgroundColor: theme.cardBackground }]}>
            <ThemedText type="h4" style={styles.title}>Price Check</ThemedText>
            <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
              Scan or enter barcode to check price
            </ThemedText>

            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="maximize" size={24} color={theme.textSecondary} />
              <RNTextInput
                ref={inputRef}
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter barcode"
                placeholderTextColor={theme.textSecondary}
                value={barcode}
                onChangeText={setBarcode}
                onSubmitEditing={handleLookup}
                returnKeyType="search"
                keyboardType="default"
                autoFocus
              />
              {barcode.length > 0 ? (
                <Pressable onPress={handleClear}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.buttonRow}>
              <Animated.View style={[styles.lookupButton, animatedButtonStyle]}>
                <Button onPress={handleLookup} loading={isLoading}>
                  Check Price
                </Button>
              </Animated.View>
              <Pressable 
                onPress={() => navigation.navigate("BarcodeScanner")}
                style={[styles.scanButton, { backgroundColor: theme.primary + "20" }]}
              >
                <Feather name="camera" size={24} color={theme.primary} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {showResult && priceInfo ? (
          <Animated.View entering={ZoomIn.delay(200)}>
            <Card style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={[styles.stockBadge, { 
                  backgroundColor: priceInfo.stock > 0 ? theme.accent + "20" : theme.error + "20" 
                }]}>
                  <Feather 
                    name={priceInfo.stock > 0 ? "check-circle" : "x-circle"} 
                    size={16} 
                    color={priceInfo.stock > 0 ? theme.accent : theme.error} 
                  />
                  <ThemedText 
                    type="small" 
                    style={{ 
                      color: priceInfo.stock > 0 ? theme.accent : theme.error,
                      marginLeft: 4,
                    }}
                  >
                    {priceInfo.stock > 0 ? "In Stock" : "Out of Stock"}
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="h3" style={styles.medicineName}>
                {priceInfo.name}
              </ThemedText>
              
              {priceInfo.brand || priceInfo.strength ? (
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  {[priceInfo.brand, priceInfo.strength, priceInfo.form].filter(Boolean).join(" | ")}
                </ThemedText>
              ) : null}

              <View style={styles.priceSection}>
                <View style={styles.priceRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>MRP</ThemedText>
                  <ThemedText type="body" style={{ textDecorationLine: "line-through", color: theme.textSecondary }}>
                    {formatCurrency(priceInfo.mrp)}
                  </ThemedText>
                </View>
                <View style={styles.priceRow}>
                  <ThemedText type="h4">Selling Price</ThemedText>
                  <ThemedText type="h2" style={{ color: theme.accent }}>
                    {formatCurrency(priceInfo.sellingPrice)}
                  </ThemedText>
                </View>
                {parseInt(discount) > 0 ? (
                  <View style={[styles.discountBadge, { backgroundColor: theme.error + "20" }]}>
                    <ThemedText type="small" style={{ color: theme.error, fontWeight: "600" }}>
                      {discount}% OFF
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Feather name="package" size={16} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 6 }}>
                    Stock: {priceInfo.stock}
                  </ThemedText>
                </View>
                {priceInfo.batchNumber ? (
                  <View style={styles.infoItem}>
                    <Feather name="hash" size={16} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 6 }}>
                      {priceInfo.batchNumber}
                    </ThemedText>
                  </View>
                ) : null}
                {priceInfo.expiryDate ? (
                  <View style={styles.infoItem}>
                    <Feather name="calendar" size={16} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 6 }}>
                      Exp: {new Date(priceInfo.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={styles.actionButtons}>
                <Button 
                  variant="secondary" 
                  onPress={() => navigation.navigate("MedicineDetail", { medicineId: priceInfo.id })}
                  style={{ flex: 1 }}
                >
                  View Details
                </Button>
                <Button 
                  onPress={handleClear}
                  style={{ flex: 1 }}
                >
                  New Lookup
                </Button>
              </View>
            </Card>
          </Animated.View>
        ) : !showResult ? (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.hintContainer}>
            <Feather name="info" size={48} color={theme.textDisabled} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.lg, textAlign: "center" }}>
              Enter a barcode or scan to check medicine price and availability
            </ThemedText>
          </Animated.View>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  searchCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 56,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 18,
    height: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  lookupButton: {
    flex: 1,
  },
  scanButton: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  resultCard: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  medicineName: {
    marginTop: Spacing.sm,
  },
  priceSection: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: BorderRadius.lg,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  discountBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  hintContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
});
