import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeInRight, useAnimatedStyle, SlideInUp, SlideOutDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLongPressGesture, useSwipeGesture } from "@/hooks/useGestures";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  status: "pending" | "received" | "partial" | "cancelled";
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "#FF9800",
  received: "#4CAF50",
  partial: "#2196F3",
  cancelled: "#F44336",
};

export default function PurchaseOrdersScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: orders = [], isLoading, refetch } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const mockOrders: PurchaseOrder[] = [
    { id: "1", poNumber: "PO-2024-001", supplierName: "MedSupply Co.", status: "pending", totalAmount: 45000, itemCount: 15, createdAt: "2024-01-15" },
    { id: "2", poNumber: "PO-2024-002", supplierName: "Pharma Distributors", status: "received", totalAmount: 32000, itemCount: 8, createdAt: "2024-01-10" },
    { id: "3", poNumber: "PO-2024-003", supplierName: "Health Plus", status: "partial", totalAmount: 28000, itemCount: 12, createdAt: "2024-01-08" },
  ];

  const displayOrders = orders.length > 0 ? orders : mockOrders;
  const filteredOrders = filterStatus === "all" 
    ? displayOrders 
    : displayOrders.filter(o => o.status === filterStatus);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/purchase-orders/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleStatusChange = (order: PurchaseOrder, newStatus: string) => {
    Alert.alert(
      "Update Status",
      `Mark ${order.poNumber} as ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Update", onPress: () => updateStatusMutation.mutate({ id: order.id, status: newStatus }) },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusFilters = ["all", "pending", "received", "partial", "cancelled"];

  const renderOrder = ({ item, index }: { item: PurchaseOrder; index: number }) => (
    <PurchaseOrderItem
      order={item}
      onMarkReceived={() => handleStatusChange(item, "received")}
      onCancel={() => handleStatusChange(item, "cancelled")}
      formatDate={formatDate}
      index={index}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.filterSection, { paddingTop: headerHeight + Spacing.lg }]}>
        {statusFilters.map((status) => (
          <Pressable
            key={status}
            onPress={() => setFilterStatus(status)}
            style={[
              styles.filterChip,
              { 
                backgroundColor: filterStatus === status 
                  ? (status === "all" ? theme.primary : statusColors[status])
                  : theme.backgroundSecondary,
              },
            ]}
          >
            <ThemedText
              type="caption"
              style={{ 
                color: filterStatus === status ? "#FFFFFF" : theme.textSecondary,
                textTransform: "capitalize",
              }}
            >
              {status}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xl + 80 },
        ]}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="file-text" size={48} color={theme.textDisabled} />
            <ThemedText style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
              No purchase orders found
            </ThemedText>
          </View>
        }
      />

      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary, bottom: insets.bottom + Spacing.xl }]}
        onPress={() => setShowForm(true)}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      {showForm ? (
        <Animated.View 
          entering={SlideInUp}
          exiting={SlideOutDown}
          style={[styles.formOverlay, { backgroundColor: theme.overlay }]}
        >
          <KeyboardAwareScrollViewCompat>
            <Card style={[styles.form, { marginTop: headerHeight + Spacing.xl }]}>
              <ThemedText type="h4" style={styles.formTitle}>New Purchase Order</ThemedText>
              
              <TextInput
                label="Supplier"
                placeholder="Select supplier"
              />
              
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                Add items to this order from the inventory screen
              </ThemedText>
              
              <View style={styles.formButtons}>
                <Button variant="secondary" onPress={() => setShowForm(false)} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button style={{ flex: 1 }}>
                  Create Order
                </Button>
              </View>
            </Card>
          </KeyboardAwareScrollViewCompat>
        </Animated.View>
      ) : null}
    </ThemedView>
  );
}

function PurchaseOrderItem({
  order,
  onMarkReceived,
  onCancel,
  formatDate,
  index,
}: {
  order: PurchaseOrder;
  onMarkReceived: () => void;
  onCancel: () => void;
  formatDate: (date: string) => string;
  index: number;
}) {
  const { theme } = useTheme();
  
  const { gesture: swipeGesture, translateX } = useSwipeGesture({
    onSwipeRight: order.status === "pending" ? onMarkReceived : undefined,
    onSwipeLeft: order.status === "pending" ? onCancel : undefined,
  });

  const { gesture: longPressGesture, scale } = useLongPressGesture({
    onLongPress: () => {
      Alert.alert(
        order.poNumber,
        `Supplier: ${order.supplierName}\nItems: ${order.itemCount}\nTotal: Rs ${order.totalAmount.toLocaleString()}`,
        [
          { text: "Mark Received", onPress: onMarkReceived },
          { text: "Cancel Order", style: "destructive", onPress: onCancel },
          { text: "Close", style: "cancel" },
        ]
      );
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const statusColor = statusColors[order.status] || theme.textSecondary;

  return (
    <Animated.View entering={FadeInRight.delay(index * 50)}>
      <GestureDetector gesture={longPressGesture}>
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={animatedStyle}>
            <Card style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    {order.poNumber}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {order.supplierName}
                  </ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <ThemedText type="caption" style={{ color: statusColor, textTransform: "capitalize" }}>
                    {order.status}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.orderDetailItem}>
                  <Feather name="package" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                    {order.itemCount} items
                  </ThemedText>
                </View>
                <View style={styles.orderDetailItem}>
                  <Feather name="calendar" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                    {formatDate(order.createdAt)}
                  </ThemedText>
                </View>
                <ThemedText type="body" style={{ fontWeight: "600", color: theme.accent }}>
                  Rs {order.totalAmount.toLocaleString()}
                </ThemedText>
              </View>
            </Card>
          </Animated.View>
        </GestureDetector>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
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
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing["5xl"],
  },
  orderCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  formOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  form: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  formTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  formButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
});
