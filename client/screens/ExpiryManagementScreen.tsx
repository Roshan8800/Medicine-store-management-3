import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FilterDays = 7 | 30 | 60 | 90;

export default function ExpiryManagementScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const [filterDays, setFilterDays] = useState<FilterDays>(30);

  const { data: expiringBatches = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/batches/expiring", `?days=${filterDays}`],
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/batches/expiring"] });
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryColor = (days: number) => {
    if (days <= 7) return theme.error;
    if (days <= 30) return theme.warning;
    return theme.textSecondary;
  };

  const filters: { label: string; value: FilterDays }[] = [
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
    { label: "60 Days", value: 60 },
    { label: "90 Days", value: 90 },
  ];

  const renderBatch = ({ item }: { item: any }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date);
    const expiryColor = getExpiryColor(daysUntilExpiry);

    return (
      <Pressable
        style={[styles.batchCard, { backgroundColor: theme.backgroundDefault }]}
        onPress={() => navigation.navigate("MedicineDetail", { medicineId: item.medicine_id })}
      >
        <View style={[styles.expiryIndicator, { backgroundColor: expiryColor }]} />
        <View style={styles.batchInfo}>
          <ThemedText style={styles.medicineName}>{item.medicine_name}</ThemedText>
          <ThemedText style={[styles.batchDetails, { color: theme.textSecondary }]}>
            {item.brand} | Batch: {item.batch_number}
          </ThemedText>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Qty</ThemedText>
              <ThemedText style={styles.statValue}>{item.quantity}</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>MRP</ThemedText>
              <ThemedText style={styles.statValue}>₹{parseFloat(item.mrp).toFixed(0)}</ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.expiryInfo}>
          <ThemedText style={[styles.expiryDate, { color: expiryColor }]}>
            {formatDate(item.expiry_date)}
          </ThemedText>
          <ThemedText style={[styles.daysLeft, { color: expiryColor }]}>
            {daysUntilExpiry <= 0 ? "Expired" : `${daysUntilExpiry} days`}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.filterContainer, { paddingTop: headerHeight + Spacing.md }]}>
        {filters.map((filter) => (
          <Pressable
            key={filter.value}
            style={[
              styles.filterChip,
              { backgroundColor: filterDays === filter.value ? theme.primary : theme.backgroundDefault },
            ]}
            onPress={() => setFilterDays(filter.value)}
          >
            <ThemedText
              style={[
                styles.filterText,
                { color: filterDays === filter.value ? "#FFFFFF" : theme.text },
              ]}
            >
              {filter.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={expiringBatches as any[]}
          renderItem={renderBatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + Spacing.xl }
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="check-circle" size={48} color={theme.accent} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No items expiring soon
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: theme.textDisabled }]}>
                All your stock is safe for the next {filterDays} days
              </ThemedText>
            </View>
          }
          ListHeaderComponent={
            (expiringBatches as any[]).length > 0 ? (
              <View style={[styles.summaryCard, { backgroundColor: theme.warning + "20" }]}>
                <Feather name="alert-triangle" size={20} color={theme.warning} />
                <ThemedText style={{ flex: 1 }}>
                  <ThemedText style={{ fontWeight: "600" }}>{(expiringBatches as any[]).length} items</ThemedText>
                  {" "}expiring in next {filterDays} days
                </ThemedText>
              </View>
            ) : null
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  batchCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  expiryIndicator: {
    width: 4,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  batchInfo: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },
  medicineName: {
    fontWeight: "600",
    fontSize: 15,
  },
  batchDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  stat: {},
  statLabel: {
    fontSize: 11,
  },
  statValue: {
    fontWeight: "600",
    fontSize: 14,
  },
  expiryInfo: {
    alignItems: "flex-end",
  },
  expiryDate: {
    fontSize: 13,
    fontWeight: "600",
  },
  daysLeft: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
    fontSize: 16,
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    fontSize: 13,
    textAlign: "center",
  },
});
