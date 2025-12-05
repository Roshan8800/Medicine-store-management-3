import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { PharmacyHeaderTitle } from "@/components/HeaderTitle";
import { DrawerMenu } from "@/components/DrawerMenu";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <PharmacyHeaderTitle />
        <View style={styles.headerRight}>
          <Pressable
            style={[styles.iconButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => setDrawerVisible(true)}
          >
            <Feather name="menu" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + Spacing.xl }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedText style={[styles.greeting, { color: theme.textSecondary }]}>
          Welcome back, {user?.name || "User"}
        </ThemedText>

        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, { backgroundColor: theme.primary }]} elevation={0}>
            <Feather name="dollar-sign" size={24} color="#FFFFFF" />
            <ThemedText style={styles.statLabel}>Today's Sales</ThemedText>
            <ThemedText style={styles.statValue}>
              {formatCurrency(stats?.todaySales?.total_revenue || 0)}
            </ThemedText>
            <ThemedText style={styles.statSubtext}>
              {stats?.todaySales?.total_bills || 0} bills
            </ThemedText>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.accent }]} elevation={0}>
            <Feather name="trending-up" size={24} color="#FFFFFF" />
            <ThemedText style={styles.statLabel}>Weekly Sales</ThemedText>
            <ThemedText style={styles.statValue}>
              {formatCurrency(stats?.weeklySales || 0)}
            </ThemedText>
          </Card>
        </View>

        <View style={styles.alertsSection}>
          <Pressable
            style={[styles.alertCard, { backgroundColor: theme.warning + "20" }]}
            onPress={() => navigation.navigate("LowStock")}
          >
            <View style={[styles.alertIconContainer, { backgroundColor: theme.warning }]}>
              <Feather name="alert-triangle" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.alertContent}>
              <ThemedText type="h4">Low Stock Items</ThemedText>
              <ThemedText style={{ color: theme.textSecondary }}>
                {stats?.lowStockCount || 0} items need attention
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={24} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.alertCard, { backgroundColor: theme.error + "20" }]}
            onPress={() => navigation.navigate("ExpiryManagement")}
          >
            <View style={[styles.alertIconContainer, { backgroundColor: theme.error }]}>
              <Feather name="clock" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.alertContent}>
              <ThemedText type="h4">Expiring Soon</ThemedText>
              <ThemedText style={{ color: theme.textSecondary }}>
                {stats?.expiringCount || 0} items in next 30 days
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={24} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.quickActions}>
          <Pressable
            style={[styles.quickActionCard, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => navigation.navigate("Main", { screen: "Billing" } as any)}
          >
            <Feather name="plus-circle" size={28} color={theme.primary} />
            <ThemedText style={styles.quickActionText}>New Bill</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.quickActionCard, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => navigation.navigate("AddMedicine")}
          >
            <Feather name="package" size={28} color={theme.primary} />
            <ThemedText style={styles.quickActionText}>Add Medicine</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.quickActionCard, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => navigation.navigate("BarcodeScanner")}
          >
            <Feather name="camera" size={28} color={theme.primary} />
            <ThemedText style={styles.quickActionText}>Scan Barcode</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.quickActionCard, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => navigation.navigate("SupplierList")}
          >
            <Feather name="truck" size={28} color={theme.primary} />
            <ThemedText style={styles.quickActionText}>Suppliers</ThemedText>
          </Pressable>
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Store Stats</ThemedText>
        <View style={styles.storeStats}>
          <View style={[styles.storeStatItem, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.storeStatValue, { color: theme.primary }]}>
              {stats?.totalMedicines || 0}
            </ThemedText>
            <ThemedText style={styles.storeStatLabel}>Medicines</ThemedText>
          </View>
          <View style={[styles.storeStatItem, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.storeStatValue, { color: theme.primary }]}>
              {stats?.totalSuppliers || 0}
            </ThemedText>
            <ThemedText style={styles.storeStatLabel}>Suppliers</ThemedText>
          </View>
          <View style={[styles.storeStatItem, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.storeStatValue, { color: theme.primary }]}>
              {formatCurrency(stats?.monthlySales || 0)}
            </ThemedText>
            <ThemedText style={styles.storeStatLabel}>Monthly Sales</ThemedText>
          </View>
        </View>
      </ScrollView>

      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
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
  headerRight: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  greeting: {
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: Spacing.sm,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginTop: Spacing.xs,
  },
  statSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: Spacing.xs,
  },
  alertsSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickActionCard: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  storeStats: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  storeStatItem: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  storeStatValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  storeStatLabel: {
    fontSize: 11,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
});
