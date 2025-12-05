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
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  isActive: boolean;
}

export default function SupplierListScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();

  const { data: suppliers = [], isLoading, refetch } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderSupplier = ({ item }: { item: Supplier }) => (
    <Pressable style={[styles.supplierCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.avatar, { backgroundColor: theme.primary + "20" }]}>
        <Feather name="truck" size={24} color={theme.primary} />
      </View>
      <View style={styles.supplierInfo}>
        <ThemedText type="body" style={styles.supplierName}>{item.name}</ThemedText>
        {item.contactPerson ? (
          <ThemedText style={[styles.contactPerson, { color: theme.textSecondary }]}>
            {item.contactPerson}
          </ThemedText>
        ) : null}
        {item.phone ? (
          <View style={styles.contactRow}>
            <Feather name="phone" size={12} color={theme.textSecondary} />
            <ThemedText style={[styles.contactText, { color: theme.textSecondary }]}>
              {item.phone}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={suppliers}
        renderItem={renderSupplier}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl + 80 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="truck" size={48} color={theme.textDisabled} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No suppliers added yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.textDisabled }]}>
              Add your first supplier to manage purchases
            </ThemedText>
            <Button 
              onPress={() => navigation.navigate("AddSupplier")}
              style={{ marginTop: Spacing.lg }}
            >
              Add Supplier
            </Button>
          </View>
        }
      />

      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary, bottom: insets.bottom + Spacing.xl }, Shadows.fab]}
        onPress={() => navigation.navigate("AddSupplier")}
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  supplierCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontWeight: "600",
  },
  contactPerson: {
    fontSize: 13,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  contactText: {
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
