import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, FadeInRight, SlideInUp, SlideOutDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as Contacts from "expo-contacts";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useSwipeGesture, useLongPressGesture } from "@/hooks/useGestures";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalPurchases?: number;
  lastVisit?: string;
}

export default function CustomersScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: customers = [], isLoading, refetch } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Customer>) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      resetForm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Customer name is required");
      return;
    }
    createMutation.mutate({ name, phone, email, address });
  };

  const handleImportFromContacts = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Contact import is only available in Expo Go");
      return;
    }

    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need access to your contacts to import them");
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
    });

    if (data.length > 0) {
      const contact = data[0];
      setName(contact.name || "");
      setPhone(contact.phoneNumbers?.[0]?.number || "");
      setEmail(contact.emails?.[0]?.email || "");
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (emailAddress: string) => {
    Linking.openURL(`mailto:${emailAddress}`);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCustomer = ({ item, index }: { item: Customer; index: number }) => (
    <CustomerItem
      customer={item}
      onCall={item.phone ? () => handleCall(item.phone!) : undefined}
      onEmail={item.email ? () => handleEmail(item.email!) : undefined}
      onDelete={() => {
        Alert.alert("Delete Customer", `Delete ${item.name}?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
        ]);
      }}
      index={index}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchContainer, { paddingTop: headerHeight + Spacing.lg }]}>
        <TextInput
          placeholder="Search customers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Feather name="search" size={20} color={theme.textSecondary} />}
        />
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xl + 80 },
        ]}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={48} color={theme.textDisabled} />
            <ThemedText style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
              {searchQuery ? "No customers found" : "No customers yet"}
            </ThemedText>
          </View>
        }
      />

      {showForm ? (
        <Animated.View 
          entering={SlideInUp}
          exiting={SlideOutDown}
          style={[styles.formOverlay, { backgroundColor: theme.overlay }]}
        >
          <KeyboardAwareScrollViewCompat>
            <Card style={[styles.form, { marginTop: headerHeight + Spacing.xl }]}>
              <View style={styles.formHeader}>
                <ThemedText type="h4">Add Customer</ThemedText>
                <Pressable onPress={handleImportFromContacts}>
                  <Feather name="user-plus" size={24} color={theme.primary} />
                </Pressable>
              </View>
              
              <TextInput
                label="Name"
                placeholder="Customer name"
                value={name}
                onChangeText={setName}
              />
              
              <TextInput
                label="Phone"
                placeholder="Phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              
              <TextInput
                label="Email"
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                label="Address"
                placeholder="Address"
                value={address}
                onChangeText={setAddress}
                multiline
              />
              
              <View style={styles.formButtons}>
                <Button variant="secondary" onPress={resetForm} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button 
                  onPress={handleSubmit} 
                  loading={createMutation.isPending}
                  style={{ flex: 1 }}
                >
                  Add
                </Button>
              </View>
            </Card>
          </KeyboardAwareScrollViewCompat>
        </Animated.View>
      ) : null}

      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary, bottom: insets.bottom + Spacing.xl }]}
        onPress={() => setShowForm(true)}
      >
        <Feather name="user-plus" size={24} color="#FFFFFF" />
      </Pressable>
    </ThemedView>
  );
}

function CustomerItem({ 
  customer, 
  onCall, 
  onEmail,
  onDelete,
  index 
}: { 
  customer: Customer; 
  onCall?: () => void; 
  onEmail?: () => void;
  onDelete: () => void;
  index: number;
}) {
  const { theme } = useTheme();
  
  const { gesture: swipeGesture, translateX } = useSwipeGesture({
    onSwipeLeft: onDelete,
    onSwipeRight: onCall,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 50)}>
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={animatedStyle}>
          <Card style={styles.customerCard}>
            <View style={styles.customerInfo}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  {customer.name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <View style={styles.customerDetails}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {customer.name}
                </ThemedText>
                {customer.phone ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {customer.phone}
                  </ThemedText>
                ) : null}
                {customer.totalPurchases !== undefined ? (
                  <ThemedText type="caption" style={{ color: theme.accent }}>
                    Total: Rs {customer.totalPurchases.toLocaleString()}
                  </ThemedText>
                ) : null}
              </View>
            </View>
            <View style={styles.customerActions}>
              {onCall ? (
                <Pressable onPress={onCall} style={[styles.actionBtn, { backgroundColor: theme.accent + "20" }]}>
                  <Feather name="phone" size={18} color={theme.accent} />
                </Pressable>
              ) : null}
              {onEmail ? (
                <Pressable onPress={onEmail} style={[styles.actionBtn, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name="mail" size={18} color={theme.primary} />
                </Pressable>
              ) : null}
            </View>
          </Card>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  customerDetails: {
    flex: 1,
  },
  customerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  formButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
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
