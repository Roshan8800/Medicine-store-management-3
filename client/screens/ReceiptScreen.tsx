import React, { useRef, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type RouteParams = {
  Receipt: {
    invoiceId: string;
    invoiceNumber: string;
    items: { name: string; quantity: number; price: number }[];
    subtotal: number;
    discount: number;
    total: number;
    customerName?: string;
    paymentMethod: string;
    date: string;
  };
};

export default function ReceiptScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RouteParams, "Receipt">>();
  const receiptRef = useRef<View>(null);

  const {
    invoiceNumber = "INV-2024-0001",
    items = [
      { name: "Paracetamol 500mg", quantity: 2, price: 50 },
      { name: "Amoxicillin 250mg", quantity: 1, price: 120 },
    ],
    subtotal = 220,
    discount = 20,
    total = 200,
    customerName,
    paymentMethod = "Cash",
    date = new Date().toLocaleString(),
  } = route.params || {};

  const handlePrint = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Printing is only available in Expo Go");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; }
            .subtitle { font-size: 12px; color: #666; }
            .info { margin: 15px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
            .item { margin: 8px 0; }
            .item-name { font-weight: bold; }
            .item-details { font-size: 12px; color: #666; }
            .totals { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; padding: 3px 0; }
            .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Binayak Pharmacy</div>
            <div class="subtitle">Your Health Partner</div>
          </div>
          <div class="info">
            <div class="row"><span>Invoice:</span><span>${invoiceNumber}</span></div>
            <div class="row"><span>Date:</span><span>${date}</span></div>
            ${customerName ? `<div class="row"><span>Customer:</span><span>${customerName}</span></div>` : ""}
            <div class="row"><span>Payment:</span><span>${paymentMethod}</span></div>
          </div>
          <div class="items">
            ${items.map(item => `
              <div class="item">
                <div class="item-name">${item.name}</div>
                <div class="item-details">${item.quantity} x Rs ${item.price} = Rs ${item.quantity * item.price}</div>
              </div>
            `).join("")}
          </div>
          <div class="totals">
            <div class="total-row"><span>Subtotal:</span><span>Rs ${subtotal}</span></div>
            <div class="total-row"><span>Discount:</span><span>-Rs ${discount}</span></div>
            <div class="total-row grand-total"><span>Total:</span><span>Rs ${total}</span></div>
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Get well soon</p>
          </div>
        </body>
      </html>
    `;

    try {
      await Print.printAsync({ html });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Error", "Failed to print receipt");
    }
  }, [invoiceNumber, items, subtotal, discount, total, customerName, paymentMethod, date]);

  const handleShare = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Sharing is only available in Expo Go");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const uri = await captureRef(receiptRef, {
        format: "png",
        quality: 1,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to share receipt");
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot ref={receiptRef as any}>
          <Animated.View entering={FadeInUp}>
            <Card style={styles.receiptCard}>
              <View style={styles.header}>
                <View style={[styles.logo, { backgroundColor: theme.primary }]}>
                  <Feather name="activity" size={32} color="#FFFFFF" />
                </View>
                <ThemedText type="h3" style={styles.storeName}>
                  Binayak Pharmacy
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Your Health Partner
                </ThemedText>
              </View>

              <View style={[styles.divider, { borderColor: theme.border }]} />

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Invoice</ThemedText>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>{invoiceNumber}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Date</ThemedText>
                  <ThemedText type="body">{date}</ThemedText>
                </View>
                {customerName ? (
                  <View style={styles.infoRow}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>Customer</ThemedText>
                    <ThemedText type="body">{customerName}</ThemedText>
                  </View>
                ) : null}
                <View style={styles.infoRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Payment</ThemedText>
                  <ThemedText type="body">{paymentMethod}</ThemedText>
                </View>
              </View>

              <View style={[styles.dashedDivider, { borderColor: theme.border }]} />

              <View style={styles.itemsSection}>
                {items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>
                        {item.name}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {item.quantity} x Rs {item.price}
                      </ThemedText>
                    </View>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      Rs {item.quantity * item.price}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <View style={[styles.dashedDivider, { borderColor: theme.border }]} />

              <View style={styles.totalsSection}>
                <View style={styles.totalRow}>
                  <ThemedText type="body">Subtotal</ThemedText>
                  <ThemedText type="body">Rs {subtotal}</ThemedText>
                </View>
                <View style={styles.totalRow}>
                  <ThemedText type="body">Discount</ThemedText>
                  <ThemedText type="body" style={{ color: theme.error }}>-Rs {discount}</ThemedText>
                </View>
                <View style={[styles.totalRow, styles.grandTotal, { borderTopColor: theme.border }]}>
                  <ThemedText type="h4">Total</ThemedText>
                  <ThemedText type="h3" style={{ color: theme.accent }}>Rs {total}</ThemedText>
                </View>
              </View>

              <View style={[styles.divider, { borderColor: theme.border }]} />

              <View style={styles.footer}>
                <ThemedText type="body" style={{ textAlign: "center" }}>
                  Thank you for your purchase!
                </ThemedText>
                <ThemedText type="small" style={{ textAlign: "center", color: theme.textSecondary, marginTop: 4 }}>
                  Get well soon
                </ThemedText>
              </View>
            </Card>
          </Animated.View>
        </ViewShot>

        <View style={styles.actions}>
          <Button variant="secondary" onPress={handleShare} style={{ flex: 1 }}>
            <Feather name="share-2" size={18} color={theme.text} style={{ marginRight: 8 }} />
            Share
          </Button>
          <Button onPress={handlePrint} style={{ flex: 1 }}>
            <Feather name="printer" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            Print
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  receiptCard: {
    padding: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  storeName: {
    marginTop: Spacing.sm,
  },
  divider: {
    borderBottomWidth: 2,
    marginVertical: Spacing.md,
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    marginVertical: Spacing.md,
  },
  infoSection: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemsSection: {
    gap: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  totalsSection: {
    gap: Spacing.sm,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  grandTotal: {
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 2,
  },
  footer: {
    marginTop: Spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
});
