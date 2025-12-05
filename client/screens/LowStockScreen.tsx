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

export default function LowStockScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();

  const { data: lowStockItems = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/medicines/low-stock"],
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/medicines/low-stock"] });
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getStockLevel = (current: number, reorder: number) => {
    const ratio = current / reorder;
    if (ratio === 0) return { label: "Out of Stock", color: theme.error };
    if (ratio <= 0.5) return { label: "Critical", color: theme.error };
    return { label: "Low", color: theme.warning };
  };

  const renderItem = ({ item }: { item: any }) => {
    const stockLevel = getStockLevel(Number(item.total_stock), item.reorder_level);

    return (
      <Pressable
        style={[styles.itemCard, { backgroundColor: theme.backgroundDefault }]}
        onPress={() => navigation.navigate("MedicineDetail", { medicineId: item.id })}
      >
        <View style={[styles.stockIndicator, { backgroundColor: stockLevel.color }]} />
        <View style={styles.itemInfo}>
          <ThemedText style={styles.medicineName}>{item.name}</ThemedText>
          <ThemedText style={[styles.medicineDetails, { color: theme.textSecondary }]}>
            {item.brand} {item.strength}
          </ThemedText>
        </View>
        <View style={styles.stockInfo}>
          <View style={[styles.stockBadge, { backgroundColor: stockLevel.color + "20" }]}>
            <ThemedText style={[styles.stockBadgeText, { color: stockLevel.color }]}>
              {stockLevel.label}
            </ThemedText>
          </View>
          <View style={styles.stockNumbers}>
            <ThemedText style={[styles.currentStock, { color: stockLevel.color }]}>
              {item.total_stock}
            </ThemedText>
            <ThemedText style={[styles.reorderLevel, { color: theme.textSecondary }]}>
              / {item.reorder_level}
            </ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={lowStockItems as any[]}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="check-circle" size={48} color={theme.accent} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                All stock levels are healthy
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: theme.textDisabled }]}>
                No items are below their reorder level
              </ThemedText>
            </View>
          }
          ListHeaderComponent={
            (lowStockItems as any[]).length > 0 ? (
              <View style={[styles.summaryCard, { backgroundColor: theme.warning + "20" }]}>
                <Feather name="alert-triangle" size={20} color={theme.warning} />
                <ThemedText style={{ flex: 1 }}>
                  <ThemedText style={{ fontWeight: "600" }}>{(lowStockItems as any[]).length} items</ThemedText>
                  {" "}need restocking
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
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  stockIndicator: {
    width: 4,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  itemInfo: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },
  medicineName: {
    fontWeight: "600",
    fontSize: 15,
  },
  medicineDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  stockInfo: {
    alignItems: "flex-end",
    marginRight: Spacing.sm,
  },
  stockBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  stockNumbers: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: Spacing.xs,
  },
  currentStock: {
    fontSize: 18,
    fontWeight: "700",
  },
  reorderLevel: {
    fontSize: 12,
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
