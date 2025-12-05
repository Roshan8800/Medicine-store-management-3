import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { TextInput } from "@/components/TextInput";
import { useTheme } from "@/hooks/useTheme";
import { queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Medicine {
  id: string;
  name: string;
  brand: string;
  genericName: string;
  strength: string;
  form: string;
  categoryId: string;
  barcode: string;
  reorderLevel: number;
  isActive: boolean;
}

type FilterType = "all" | "low_stock" | "expiring";

export default function InventoryScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: medicines = [], isLoading, refetch } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines", searchQuery ? `?search=${searchQuery}` : ""],
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/medicines/low-stock"],
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredMedicines = medicines.filter((med) => {
    if (filter === "low_stock") {
      return lowStockItems.some((item: any) => item.id === med.id);
    }
    return true;
  });

  const renderMedicineItem = ({ item }: { item: Medicine }) => {
    const isLowStock = lowStockItems.some((ls: any) => ls.id === item.id);

    return (
      <Pressable
        style={[styles.medicineCard, { backgroundColor: theme.backgroundDefault }]}
        onPress={() => navigation.navigate("MedicineDetail", { medicineId: item.id })}
      >
        <View style={[styles.medicineIcon, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="package" size={24} color={theme.primary} />
        </View>
        <View style={styles.medicineInfo}>
          <ThemedText type="body" style={styles.medicineName}>{item.name}</ThemedText>
          <ThemedText style={[styles.medicineDetails, { color: theme.textSecondary }]}>
            {item.brand} {item.strength ? `| ${item.strength}` : ""}
          </ThemedText>
          {item.form ? (
            <ThemedText style={[styles.medicineForm, { color: theme.textDisabled }]}>
              {item.form}
            </ThemedText>
          ) : null}
        </View>
        {isLowStock ? (
          <View style={[styles.lowStockBadge, { backgroundColor: theme.warning + "20" }]}>
            <Feather name="alert-triangle" size={12} color={theme.warning} />
            <ThemedText style={[styles.lowStockText, { color: theme.warning }]}>
              Low
            </ThemedText>
          </View>
        ) : null}
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    );
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Low Stock", value: "low_stock" },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <ThemedText type="h3">Inventory</ThemedText>
        <Pressable
          style={[styles.scanButton, { backgroundColor: theme.backgroundDefault }]}
          onPress={() => navigation.navigate("BarcodeScanner")}
        >
          <Feather name="camera" size={20} color={theme.primary} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            placeholder="Search medicines..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.filters}>
        {filters.map((f) => (
          <Pressable
            key={f.value}
            style={[
              styles.filterChip,
              { backgroundColor: filter === f.value ? theme.primary : theme.backgroundDefault },
            ]}
            onPress={() => setFilter(f.value)}
          >
            <ThemedText
              style={[
                styles.filterText,
                { color: filter === f.value ? "#FFFFFF" : theme.text },
              ]}
            >
              {f.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredMedicines}
          renderItem={renderMedicineItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: tabBarHeight + Spacing.xl + 80 }
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="package" size={48} color={theme.textDisabled} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery ? "No medicines found" : "No medicines added yet"}
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: theme.textDisabled }]}>
                {searchQuery ? "Try a different search term" : "Add your first medicine to get started"}
              </ThemedText>
            </View>
          }
        />
      )}

      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary, bottom: tabBarHeight + Spacing.xl }, Shadows.fab]}
        onPress={() => navigation.navigate("AddMedicine")}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
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
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  medicineCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  medicineIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontWeight: "600",
  },
  medicineDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  medicineForm: {
    fontSize: 12,
    marginTop: 2,
  },
  lowStockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  lowStockText: {
    fontSize: 11,
    fontWeight: "600",
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
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
