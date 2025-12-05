import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "InvoiceDetail">;

export default function InvoiceDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const route = useRoute<RouteProps>();
  const { invoiceId } = route.params;

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["/api/invoices", invoiceId],
  });

  const handleShare = async () => {
    if (!invoice) return;
    
    const inv = invoice as any;
    const itemsList = inv.items?.map((item: any) => 
      `${item.medicine_name} x${item.quantity} - Rs.${parseFloat(item.totalPrice).toFixed(2)}`
    ).join("\n") || "";
    
    const message = `
BINAYAK PHARMACY
Invoice: ${inv.invoiceNumber}
Date: ${new Date(inv.createdAt).toLocaleDateString("en-IN")}
${inv.customerName ? `Customer: ${inv.customerName}` : ""}

Items:
${itemsList}

Subtotal: Rs.${parseFloat(inv.subtotal).toFixed(2)}
Discount: Rs.${parseFloat(inv.discountAmount).toFixed(2)}
Tax: Rs.${parseFloat(inv.taxAmount).toFixed(2)}
Total: Rs.${parseFloat(inv.totalAmount).toFixed(2)}

Payment: ${inv.paymentMethod.toUpperCase()} - ${inv.paymentStatus.toUpperCase()}

Thank you for your purchase!
    `.trim();

    try {
      await Share.share({ message });
    } catch (error) {
      Alert.alert("Error", "Could not share invoice");
    }
  };

  if (isLoading || !invoice) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  const inv = invoice as any;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.storeName}>BINAYAK PHARMACY</ThemedText>
          <ThemedText style={styles.storeOwner}>Owner: Suman Sahu</ThemedText>
        </View>

        <View style={[styles.invoiceInfo, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.invoiceRow}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Invoice No</ThemedText>
            <ThemedText style={styles.value}>{inv.invoiceNumber}</ThemedText>
          </View>
          <View style={styles.invoiceRow}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Date</ThemedText>
            <ThemedText style={styles.value}>{formatDate(inv.createdAt)}</ThemedText>
          </View>
          {inv.customerName ? (
            <View style={styles.invoiceRow}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Customer</ThemedText>
              <ThemedText style={styles.value}>{inv.customerName}</ThemedText>
            </View>
          ) : null}
          {inv.customerPhone ? (
            <View style={styles.invoiceRow}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Phone</ThemedText>
              <ThemedText style={styles.value}>{inv.customerPhone}</ThemedText>
            </View>
          ) : null}
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Items</ThemedText>
        <View style={[styles.itemsTable, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.tableHeader, { borderBottomColor: theme.divider }]}>
            <ThemedText style={[styles.tableHeaderCell, styles.itemCol]}>Item</ThemedText>
            <ThemedText style={[styles.tableHeaderCell, styles.qtyCol]}>Qty</ThemedText>
            <ThemedText style={[styles.tableHeaderCell, styles.priceCol]}>Price</ThemedText>
            <ThemedText style={[styles.tableHeaderCell, styles.totalCol]}>Total</ThemedText>
          </View>
          {inv.items?.map((item: any, index: number) => (
            <View 
              key={index} 
              style={[
                styles.tableRow,
                index < inv.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider }
              ]}
            >
              <View style={styles.itemCol}>
                <ThemedText style={styles.itemName}>{item.medicine_name}</ThemedText>
                <ThemedText style={[styles.batchNum, { color: theme.textSecondary }]}>
                  Batch: {item.batch_number}
                </ThemedText>
              </View>
              <ThemedText style={styles.qtyCol}>{item.quantity}</ThemedText>
              <ThemedText style={styles.priceCol}>₹{parseFloat(item.unitPrice).toFixed(2)}</ThemedText>
              <ThemedText style={[styles.totalCol, { fontWeight: "600" }]}>
                ₹{parseFloat(item.totalPrice).toFixed(2)}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={[styles.totals, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.totalRow}>
            <ThemedText style={{ color: theme.textSecondary }}>Subtotal</ThemedText>
            <ThemedText>₹{parseFloat(inv.subtotal).toFixed(2)}</ThemedText>
          </View>
          {parseFloat(inv.discountAmount) > 0 ? (
            <View style={styles.totalRow}>
              <ThemedText style={{ color: theme.textSecondary }}>
                Discount ({inv.discountPercent}%)
              </ThemedText>
              <ThemedText style={{ color: theme.error }}>
                -₹{parseFloat(inv.discountAmount).toFixed(2)}
              </ThemedText>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <ThemedText style={{ color: theme.textSecondary }}>Tax (GST)</ThemedText>
            <ThemedText>₹{parseFloat(inv.taxAmount).toFixed(2)}</ThemedText>
          </View>
          <View style={[styles.totalRow, styles.grandTotal, { borderTopColor: theme.divider }]}>
            <ThemedText type="h4">Total</ThemedText>
            <ThemedText type="h3" style={{ color: theme.primary }}>
              ₹{parseFloat(inv.totalAmount).toFixed(2)}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.paymentInfo, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentItem}>
              <Feather 
                name={inv.paymentMethod === "cash" ? "dollar-sign" : inv.paymentMethod === "card" ? "credit-card" : "smartphone"} 
                size={20} 
                color={theme.primary} 
              />
              <ThemedText style={styles.paymentLabel}>{inv.paymentMethod.toUpperCase()}</ThemedText>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: inv.paymentStatus === "paid" ? theme.accent + "20" : theme.warning + "20" }
            ]}>
              <ThemedText style={[
                styles.statusText,
                { color: inv.paymentStatus === "paid" ? theme.accent : theme.warning }
              ]}>
                {inv.paymentStatus.toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </View>

        <Pressable style={[styles.shareButton, { backgroundColor: theme.primary }]} onPress={handleShare}>
          <Feather name="share-2" size={20} color="#FFFFFF" />
          <ThemedText style={styles.shareButtonText}>Share Invoice</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  storeName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  storeOwner: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 4,
  },
  invoiceInfo: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  itemsTable: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.7,
  },
  tableRow: {
    flexDirection: "row",
    padding: Spacing.md,
    alignItems: "center",
  },
  itemCol: {
    flex: 2,
  },
  qtyCol: {
    width: 40,
    textAlign: "center",
  },
  priceCol: {
    width: 60,
    textAlign: "right",
  },
  totalCol: {
    width: 70,
    textAlign: "right",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
  },
  batchNum: {
    fontSize: 11,
    marginTop: 2,
  },
  totals: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  grandTotal: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    marginBottom: 0,
  },
  paymentInfo: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  paymentLabel: {
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
