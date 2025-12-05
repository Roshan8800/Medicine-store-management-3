import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, TextInput as RNTextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeInRight, FadeOutLeft, useAnimatedStyle, withSpring, useSharedValue, runOnJS } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { useTheme } from "@/hooks/useTheme";
import { useSwipeGesture, useDoubleTapGesture } from "@/hooks/useGestures";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CartItem {
  id: string;
  medicineId: string;
  batchId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface Medicine {
  id: string;
  name: string;
  brand?: string;
  strength?: string;
  sellingPrice: number;
  stock: number;
  batchId: string;
}

export default function QuickSaleScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const barcodeRef = useRef<RNTextInput>(null);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash");
  const [discount, setDiscount] = useState("");

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: {
      items: { medicineId: string; batchId: string; quantity: number; unitPrice: number; discountPercent: number }[];
      customerName?: string;
      customerPhone?: string;
      paymentMethod: string;
      discountPercent: number;
    }) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Sale Complete",
        `Invoice ${invoice.invoiceNumber} created successfully`,
        [
          { text: "New Sale", onPress: () => setCart([]) },
          { text: "View Invoice", onPress: () => navigation.navigate("InvoiceDetail", { invoiceId: invoice.id }) },
        ]
      );
    },
    onError: () => {
      Alert.alert("Error", "Failed to create invoice");
    },
  });

  const handleBarcodeSubmit = useCallback(async () => {
    if (!barcode.trim()) return;

    try {
      const response = await apiRequest("GET", `/api/medicines/barcode/${barcode}`);
      const medicine = await response.json();
      
      addToCart({
        id: Date.now().toString(),
        medicineId: medicine.id,
        batchId: medicine.batchId || medicine.id,
        name: `${medicine.name} ${medicine.strength || ""}`.trim(),
        quantity: 1,
        unitPrice: parseFloat(medicine.sellingPrice || "0"),
        discount: 0,
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Not Found", `No medicine found with barcode: ${barcode}`);
    }
    
    setBarcode("");
    barcodeRef.current?.focus();
  }, [barcode]);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.medicineId === item.medicineId && i.batchId === item.batchId);
      if (existing) {
        return prev.map(i => 
          i.id === existing.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const discountAmount = subtotal * (parseFloat(discount) || 0) / 100;
  const total = subtotal - discountAmount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert("Error", "Add items to cart first");
      return;
    }

    createInvoiceMutation.mutate({
      items: cart.map(item => ({
        medicineId: item.medicineId,
        batchId: item.batchId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discount,
      })),
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      paymentMethod,
      discountPercent: parseFloat(discount) || 0,
    });
  };

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => (
    <CartItemRow
      item={item}
      onIncrease={() => updateQuantity(item.id, 1)}
      onDecrease={() => updateQuantity(item.id, -1)}
      onRemove={() => removeItem(item.id)}
      index={index}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.barcodeSection, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={[styles.barcodeInput, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="maximize" size={20} color={theme.textSecondary} />
          <RNTextInput
            ref={barcodeRef}
            style={[styles.barcodeTextInput, { color: theme.text }]}
            placeholder="Scan or enter barcode"
            placeholderTextColor={theme.textSecondary}
            value={barcode}
            onChangeText={setBarcode}
            onSubmitEditing={handleBarcodeSubmit}
            returnKeyType="done"
            autoFocus
          />
          <Pressable onPress={() => navigation.navigate("BarcodeScanner")} style={styles.scanButton}>
            <Feather name="camera" size={20} color={theme.primary} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={renderCartItem}
        contentContainerStyle={styles.cartList}
        ListEmptyComponent={
          <View style={styles.emptyCart}>
            <Feather name="shopping-cart" size={48} color={theme.textDisabled} />
            <ThemedText style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
              Scan items to add to cart
            </ThemedText>
          </View>
        }
      />

      <Card style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.customerRow}>
          <TextInput
            placeholder="Customer name"
            value={customerName}
            onChangeText={setCustomerName}
            style={{ flex: 1 }}
          />
          <TextInput
            placeholder="Phone"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
            style={{ flex: 1 }}
          />
        </View>

        <View style={styles.paymentMethods}>
          {(["cash", "card", "upi"] as const).map((method) => (
            <Pressable
              key={method}
              onPress={() => setPaymentMethod(method)}
              style={[
                styles.paymentButton,
                { 
                  backgroundColor: paymentMethod === method ? theme.primary : theme.backgroundSecondary,
                },
              ]}
            >
              <Feather 
                name={method === "cash" ? "dollar-sign" : method === "card" ? "credit-card" : "smartphone"} 
                size={16} 
                color={paymentMethod === method ? "#FFFFFF" : theme.textSecondary} 
              />
              <ThemedText 
                type="small" 
                style={{ 
                  color: paymentMethod === method ? "#FFFFFF" : theme.text,
                  marginLeft: 4,
                  textTransform: "capitalize",
                }}
              >
                {method}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.summaryRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Subtotal</ThemedText>
          <ThemedText type="body">Rs {subtotal.toFixed(2)}</ThemedText>
        </View>

        <View style={styles.discountRow}>
          <TextInput
            placeholder="Discount %"
            value={discount}
            onChangeText={setDiscount}
            keyboardType="numeric"
            style={{ width: 100 }}
          />
          <ThemedText type="body" style={{ color: theme.error }}>
            -Rs {discountAmount.toFixed(2)}
          </ThemedText>
        </View>

        <View style={styles.totalRow}>
          <ThemedText type="h4">Total</ThemedText>
          <ThemedText type="h3" style={{ color: theme.accent }}>
            Rs {total.toFixed(2)}
          </ThemedText>
        </View>

        <Button 
          onPress={handleCheckout}
          loading={createInvoiceMutation.isPending}
          disabled={cart.length === 0}
        >
          Complete Sale
        </Button>
      </Card>
    </ThemedView>
  );
}

function CartItemRow({ 
  item, 
  onIncrease, 
  onDecrease, 
  onRemove,
  index 
}: { 
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  index: number;
}) {
  const { theme } = useTheme();

  const { gesture: swipeGesture, translateX } = useSwipeGesture({
    onSwipeLeft: onRemove,
  });

  const { gesture: doubleTapGesture } = useDoubleTapGesture({
    onDoubleTap: onRemove,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const itemTotal = item.unitPrice * item.quantity;

  return (
    <Animated.View entering={FadeInRight.delay(index * 50)} exiting={FadeOutLeft}>
      <GestureDetector gesture={doubleTapGesture}>
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={animatedStyle}>
            <Card style={styles.cartItem}>
              <View style={styles.itemInfo}>
                <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
                  {item.name}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Rs {item.unitPrice.toFixed(2)} each
                </ThemedText>
              </View>
              
              <View style={styles.quantityControls}>
                <Pressable 
                  onPress={onDecrease}
                  style={[styles.qtyButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <Feather name="minus" size={16} color={theme.text} />
                </Pressable>
                <ThemedText type="body" style={styles.qtyText}>
                  {item.quantity}
                </ThemedText>
                <Pressable 
                  onPress={onIncrease}
                  style={[styles.qtyButton, { backgroundColor: theme.primary }]}
                >
                  <Feather name="plus" size={16} color="#FFFFFF" />
                </Pressable>
              </View>

              <ThemedText type="body" style={{ fontWeight: "600", minWidth: 70, textAlign: "right" }}>
                Rs {itemTotal.toFixed(2)}
              </ThemedText>
            </Card>
          </Animated.View>
        </GestureDetector>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  barcodeSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  barcodeInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 52,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  barcodeTextInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  scanButton: {
    padding: Spacing.sm,
  },
  cartList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flexGrow: 1,
  },
  emptyCart: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    minWidth: 30,
    textAlign: "center",
    fontWeight: "600",
  },
  footer: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  customerRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  paymentMethods: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  paymentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
});
