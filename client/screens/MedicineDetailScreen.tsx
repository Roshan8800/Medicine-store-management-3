import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "MedicineDetail">;

interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: string;
  mrp: string;
  sellingPrice: string;
  gstPercent: string;
}

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  strength: string;
  form: string;
  packSize: number;
  barcode: string;
  hsnCode: string;
  scheduleDrug: string;
  storageLocation: string;
  reorderLevel: number;
  description: string;
  batches: Batch[];
}

export default function MedicineDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { medicineId } = route.params;

  const { data: medicine, isLoading } = useQuery<Medicine>({
    queryKey: ["/api/medicines", medicineId],
  });

  if (isLoading || !medicine) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  const totalStock = medicine.batches?.reduce((sum, b) => sum + b.quantity, 0) || 0;
  const isLowStock = totalStock <= medicine.reorderLevel;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={[styles.headerCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="package" size={32} color={theme.primary} />
          </View>
          <View style={styles.headerInfo}>
            <ThemedText type="h3">{medicine.name}</ThemedText>
            {medicine.genericName ? (
              <ThemedText style={[styles.genericName, { color: theme.textSecondary }]}>
                {medicine.genericName}
              </ThemedText>
            ) : null}
            <View style={styles.badges}>
              {medicine.brand ? (
                <View style={[styles.badge, { backgroundColor: theme.primary + "20" }]}>
                  <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
                    {medicine.brand}
                  </ThemedText>
                </View>
              ) : null}
              {medicine.form ? (
                <View style={[styles.badge, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText style={[styles.badgeText, { color: theme.textSecondary }]}>
                    {medicine.form}
                  </ThemedText>
                </View>
              ) : null}
              {medicine.strength ? (
                <View style={[styles.badge, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText style={[styles.badgeText, { color: theme.textSecondary }]}>
                    {medicine.strength}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.stockSection}>
          <View style={[
            styles.stockCard,
            { backgroundColor: isLowStock ? theme.warning + "20" : theme.accent + "20" }
          ]}>
            <Feather
              name={isLowStock ? "alert-triangle" : "check-circle"}
              size={24}
              color={isLowStock ? theme.warning : theme.accent}
            />
            <View style={styles.stockInfo}>
              <ThemedText type="h2" style={{ color: isLowStock ? theme.warning : theme.accent }}>
                {totalStock}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary }}>Total Stock</ThemedText>
            </View>
            <View style={styles.stockMeta}>
              <ThemedText style={[styles.reorderLabel, { color: theme.textSecondary }]}>
                Reorder at: {medicine.reorderLevel}
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Details</ThemedText>
        <View style={[styles.detailsCard, { backgroundColor: theme.backgroundDefault }]}>
          {[
            { label: "Pack Size", value: medicine.packSize },
            { label: "Barcode", value: medicine.barcode || "N/A" },
            { label: "HSN Code", value: medicine.hsnCode || "N/A" },
            { label: "Schedule", value: medicine.scheduleDrug || "N/A" },
            { label: "Storage Location", value: medicine.storageLocation || "N/A" },
          ].map((item, index) => (
            <View
              key={index}
              style={[
                styles.detailRow,
                index < 4 && { borderBottomWidth: 1, borderBottomColor: theme.divider },
              ]}
            >
              <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                {item.label}
              </ThemedText>
              <ThemedText style={styles.detailValue}>{item.value}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Batches</ThemedText>
          <Pressable onPress={() => navigation.navigate("AddBatch", { medicineId })}>
            <ThemedText type="link">Add Batch</ThemedText>
          </Pressable>
        </View>

        {medicine.batches && medicine.batches.length > 0 ? (
          medicine.batches.map((batch) => {
            const expiringSoon = isExpiringSoon(batch.expiryDate);
            return (
              <Pressable
                key={batch.id}
                style={[styles.batchCard, { backgroundColor: theme.backgroundDefault }]}
                onPress={() => navigation.navigate("StockAdjustment", { medicineId, batchId: batch.id })}
              >
                <View style={styles.batchHeader}>
                  <ThemedText style={styles.batchNumber}>Batch: {batch.batchNumber}</ThemedText>
                  {expiringSoon ? (
                    <View style={[styles.expiryBadge, { backgroundColor: theme.error + "20" }]}>
                      <Feather name="clock" size={12} color={theme.error} />
                      <ThemedText style={[styles.expiryText, { color: theme.error }]}>
                        Expiring
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
                <View style={styles.batchDetails}>
                  <View style={styles.batchRow}>
                    <ThemedText style={[styles.batchLabel, { color: theme.textSecondary }]}>
                      Expiry
                    </ThemedText>
                    <ThemedText>{formatDate(batch.expiryDate)}</ThemedText>
                  </View>
                  <View style={styles.batchRow}>
                    <ThemedText style={[styles.batchLabel, { color: theme.textSecondary }]}>
                      Qty
                    </ThemedText>
                    <ThemedText style={{ fontWeight: "600" }}>{batch.quantity}</ThemedText>
                  </View>
                  <View style={styles.batchRow}>
                    <ThemedText style={[styles.batchLabel, { color: theme.textSecondary }]}>
                      MRP
                    </ThemedText>
                    <ThemedText style={{ color: theme.primary }}>
                      ₹{parseFloat(batch.mrp).toFixed(2)}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View style={[styles.emptyBatches, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="inbox" size={32} color={theme.textDisabled} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No batches available
            </ThemedText>
            <Button
              onPress={() => navigation.navigate("AddBatch", { medicineId })}
              style={{ marginTop: Spacing.md }}
            >
              Add First Batch
            </Button>
          </View>
        )}
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
  headerCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  genericName: {
    fontSize: 14,
    marginTop: 2,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  stockSection: {
    marginBottom: Spacing.xl,
  },
  stockCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  stockInfo: {
    flex: 1,
  },
  stockMeta: {},
  reorderLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  detailsCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  batchCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  batchNumber: {
    fontWeight: "600",
  },
  expiryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  expiryText: {
    fontSize: 11,
    fontWeight: "500",
  },
  batchDetails: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  batchRow: {},
  batchLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  emptyBatches: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  emptyText: {
    marginTop: Spacing.sm,
  },
});
