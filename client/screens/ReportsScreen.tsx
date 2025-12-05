import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
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
import { queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DateRange = "today" | "week" | "month" | "custom";

interface DashboardStats {
  todaySales?: { total_revenue: number; total_bills: number };
  weeklySales?: number;
  monthlySales?: number;
  totalMedicines?: number;
  lowStockCount?: number;
  expiringCount?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  totalAmount: number;
}

export default function ReportsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const [dateRange, setDateRange] = useState<DateRange>("today");

  const { data: stats, refetch } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
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

  const dateRanges: { label: string; value: DateRange }[] = [
    { label: "Today", value: "today" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
  ];

  const getSalesValue = () => {
    switch (dateRange) {
      case "today":
        return stats?.todaySales?.total_revenue || 0;
      case "week":
        return stats?.weeklySales || 0;
      case "month":
        return stats?.monthlySales || 0;
      default:
        return stats?.todaySales?.total_revenue || 0;
    }
  };

  const recentInvoices = invoices.slice(0, 5);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <ThemedText type="h3">Reports</ThemedText>
        <Pressable style={[styles.exportButton, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="download" size={20} color={theme.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + Spacing.xl }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.dateFilters}>
          {dateRanges.map((range) => (
            <Pressable
              key={range.value}
              style={[
                styles.dateChip,
                { backgroundColor: dateRange === range.value ? theme.primary : theme.backgroundDefault },
              ]}
              onPress={() => setDateRange(range.value)}
            >
              <ThemedText
                style={[
                  styles.dateChipText,
                  { color: dateRange === range.value ? "#FFFFFF" : theme.text },
                ]}
              >
                {range.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <Card style={{ ...styles.summaryCard, backgroundColor: theme.primary }} elevation={0}>
          <ThemedText style={styles.summaryLabel}>Total Sales</ThemedText>
          <ThemedText style={styles.summaryValue}>
            {formatCurrency(getSalesValue())}
          </ThemedText>
          <ThemedText style={styles.summaryPeriod}>
            {dateRange === "today" ? "Today" : dateRange === "week" ? "Last 7 days" : "Last 30 days"}
          </ThemedText>
        </Card>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="file-text" size={24} color={theme.primary} />
            <ThemedText style={styles.statValue}>
              {stats?.todaySales?.total_bills || 0}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Bills Today
            </ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="package" size={24} color={theme.accent} />
            <ThemedText style={styles.statValue}>
              {stats?.totalMedicines || 0}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Products
            </ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="alert-triangle" size={24} color={theme.warning} />
            <ThemedText style={styles.statValue}>
              {stats?.lowStockCount || 0}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Low Stock
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Recent Transactions</ThemedText>
            <Pressable>
              <ThemedText type="link" style={{ fontSize: 14 }}>View All</ThemedText>
            </Pressable>
          </View>

          {recentInvoices.length > 0 ? (
            recentInvoices.map((invoice: any) => (
              <Pressable
                key={invoice.id}
                style={[styles.invoiceCard, { backgroundColor: theme.backgroundDefault }]}
                onPress={() => navigation.navigate("InvoiceDetail", { invoiceId: invoice.id })}
              >
                <View style={styles.invoiceInfo}>
                  <ThemedText style={styles.invoiceNumber}>{invoice.invoiceNumber}</ThemedText>
                  <ThemedText style={[styles.invoiceDate, { color: theme.textSecondary }]}>
                    {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </ThemedText>
                </View>
                <View style={styles.invoiceAmount}>
                  <ThemedText style={[styles.amount, { color: theme.primary }]}>
                    {formatCurrency(parseFloat(invoice.totalAmount))}
                  </ThemedText>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: invoice.paymentStatus === "paid" ? theme.accent + "20" : theme.warning + "20" }
                  ]}>
                    <ThemedText style={[
                      styles.statusText,
                      { color: invoice.paymentStatus === "paid" ? theme.accent : theme.warning }
                    ]}>
                      {invoice.paymentStatus.toUpperCase()}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather name="file-text" size={40} color={theme.textDisabled} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No transactions yet
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Quick Reports</ThemedText>
          <View style={styles.reportGrid}>
            <Pressable
              style={[styles.reportCard, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => navigation.navigate("ExpiryManagement")}
            >
              <Feather name="clock" size={24} color={theme.error} />
              <ThemedText style={styles.reportTitle}>Expiry Report</ThemedText>
              <ThemedText style={[styles.reportDesc, { color: theme.textSecondary }]}>
                {stats?.expiringCount || 0} items expiring
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.reportCard, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => navigation.navigate("LowStock")}
            >
              <Feather name="alert-triangle" size={24} color={theme.warning} />
              <ThemedText style={styles.reportTitle}>Low Stock</ThemedText>
              <ThemedText style={[styles.reportDesc, { color: theme.textSecondary }]}>
                {stats?.lowStockCount || 0} items low
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  dateFilters: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dateChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  summaryCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    marginTop: Spacing.xs,
  },
  summaryPeriod: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  invoiceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontWeight: "600",
  },
  invoiceDate: {
    fontSize: 12,
    marginTop: 2,
  },
  invoiceAmount: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
  },
  reportGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  reportCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  reportTitle: {
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  reportDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
