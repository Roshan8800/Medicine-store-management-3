import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CartItem {
  medicineId: string;
  batchId: string;
  name: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  gstPercent: number;
  maxQuantity: number;
}

export default function BillingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash");

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = (subtotal * parseFloat(discountPercent || "0")) / 100;
  const taxAmount = cart.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice * item.gstPercent) / 100,
    0
  );
  const totalAmount = subtotal - discountAmount + taxAmount;

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const items = cart.map((item) => ({
        medicineId: item.medicineId,
        batchId: item.batchId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        gstPercent: item.gstPercent.toString(),
        totalPrice: (item.quantity * item.unitPrice).toString(),
      }));

      const response = await apiRequest("POST", "/api/invoices", {
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        subtotal: subtotal.toString(),
        discountAmount: discountAmount.toString(),
        discountPercent: discountPercent,
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        paymentMethod,
        paymentStatus: "paid",
        items,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      Alert.alert(
        "Invoice Created",
        `Invoice ${data.invoiceNumber} created successfully!\nTotal: ₹${totalAmount.toFixed(2)}`,
        [
          {
            text: "View Invoice",
            onPress: () => navigation.navigate("InvoiceDetail", { invoiceId: data.id }),
          },
          { text: "New Bill", onPress: clearBill },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create invoice");
    },
  });

  const clearBill = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscountPercent("0");
  };

  const handleScanBarcode = () => {
    navigation.navigate("BarcodeScanner");
  };

  const updateQuantity = (index: number, change: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      const item = newCart[index];
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        return newCart.filter((_, i) => i !== index);
      }
      if (newQuantity > item.maxQuantity) {
        Alert.alert("Insufficient Stock", `Only ${item.maxQuantity} units available`);
        return prev;
      }
      item.quantity = newQuantity;
      return newCart;
    });
  };

  const handleCreateInvoice = () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please add items to the cart first");
      return;
    }
    createInvoiceMutation.mutate();
  };

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => (
    <View style={[styles.cartItem, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.cartItemInfo}>
        <ThemedText type="body" style={styles.itemName}>{item.name}</ThemedText>
        <ThemedText style={[styles.itemBatch, { color: theme.textSecondary }]}>
          Batch: {item.batchNumber}
        </ThemedText>
        <ThemedText style={[styles.itemPrice, { color: theme.primary }]}>
          ₹{item.unitPrice.toFixed(2)} x {item.quantity} = ₹{(item.unitPrice * item.quantity).toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.quantityControls}>
        <Pressable
          style={[styles.quantityButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => updateQuantity(index, -1)}
        >
          <Feather name="minus" size={16} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.quantityText}>{item.quantity}</ThemedText>
        <Pressable
          style={[styles.quantityButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => updateQuantity(index, 1)}
        >
          <Feather name="plus" size={16} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <ThemedText type="h3">New Bill</ThemedText>
        <View style={styles.headerActions}>
          <Pressable onPress={clearBill} style={styles.clearButton}>
            <Feather name="trash-2" size={20} color={theme.error} />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={cart}
          renderItem={renderCartItem}
          keyExtractor={(item, index) => `${item.batchId}-${index}`}
          contentContainerStyle={styles.cartList}
          ListEmptyComponent={
            <View style={styles.emptyCart}>
              <Feather name="shopping-cart" size={48} color={theme.textDisabled} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No items in cart
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: theme.textDisabled }]}>
                Scan a barcode or search to add items
              </ThemedText>
            </View>
          }
        />

        <View style={[styles.billSummary, { backgroundColor: theme.backgroundDefault, paddingBottom: tabBarHeight + Spacing.xl }]}>
          <View style={styles.customerSection}>
            <TextInput
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChangeText={setCustomerName}
              style={styles.customerInput}
            />
            <TextInput
              placeholder="Phone (Optional)"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
              style={styles.customerInput}
            />
          </View>

          <View style={styles.paymentMethods}>
            {(["cash", "card", "upi"] as const).map((method) => (
              <Pressable
                key={method}
                style={[
                  styles.paymentMethod,
                  { borderColor: paymentMethod === method ? theme.primary : theme.border },
                  paymentMethod === method && { backgroundColor: theme.primary + "20" },
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Feather
                  name={method === "cash" ? "dollar-sign" : method === "card" ? "credit-card" : "smartphone"}
                  size={16}
                  color={paymentMethod === method ? theme.primary : theme.textSecondary}
                />
                <ThemedText style={[
                  styles.paymentMethodText,
                  paymentMethod === method && { color: theme.primary }
                ]}>
                  {method.toUpperCase()}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <ThemedText style={{ color: theme.textSecondary }}>Subtotal</ThemedText>
              <ThemedText>₹{subtotal.toFixed(2)}</ThemedText>
            </View>
            <View style={styles.totalRow}>
              <View style={styles.discountRow}>
                <ThemedText style={{ color: theme.textSecondary }}>Discount</ThemedText>
                <TextInput
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                  keyboardType="numeric"
                  style={styles.discountInput}
                  placeholder="0"
                />
                <ThemedText style={{ color: theme.textSecondary }}>%</ThemedText>
              </View>
              <ThemedText style={{ color: theme.error }}>-₹{discountAmount.toFixed(2)}</ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText style={{ color: theme.textSecondary }}>GST</ThemedText>
              <ThemedText>₹{taxAmount.toFixed(2)}</ThemedText>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <ThemedText type="h4">Total</ThemedText>
              <ThemedText type="h3" style={{ color: theme.primary }}>
                ₹{totalAmount.toFixed(2)}
              </ThemedText>
            </View>
          </View>

          <Button
            onPress={handleCreateInvoice}
            disabled={cart.length === 0 || createInvoiceMutation.isPending}
          >
            {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </View>
      </View>

      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary }, Shadows.fab]}
        onPress={handleScanBarcode}
      >
        <Feather name="camera" size={24} color="#FFFFFF" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  clearButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  cartList: {
    padding: Spacing.lg,
    paddingBottom: 0,
    flexGrow: 1,
  },
  cartItem: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    alignItems: "center",
  },
  cartItemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: "600",
  },
  itemBatch: {
    fontSize: 12,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "center",
  },
  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
    fontSize: 16,
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    fontSize: 13,
  },
  billSummary: {
    padding: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  customerSection: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  customerInput: {
    flex: 1,
  },
  paymentMethods: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  paymentMethod: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: "500",
  },
  totalsSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  discountInput: {
    width: 50,
    height: 32,
    textAlign: "center",
    paddingHorizontal: Spacing.sm,
  },
  grandTotal: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: 180,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
