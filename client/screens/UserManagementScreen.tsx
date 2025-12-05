import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";

interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UserManagementScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const [refreshing, setRefreshing] = useState(false);

  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/users/${userId}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update user");
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleToggleUser = (user: User) => {
    if (user.id === currentUser?.id) {
      Alert.alert("Error", "You cannot deactivate your own account");
      return;
    }
    Alert.alert(
      user.isActive ? "Deactivate User" : "Activate User",
      `Are you sure you want to ${user.isActive ? "deactivate" : "activate"} ${user.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: user.isActive ? "Deactivate" : "Activate",
          style: user.isActive ? "destructive" : "default",
          onPress: () => toggleUserMutation.mutate({ userId: user.id, isActive: !user.isActive }),
        },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return theme.primary;
      case "manager":
        return theme.accent;
      case "cashier":
        return theme.textSecondary;
      default:
        return theme.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={[styles.userCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.avatar, { backgroundColor: getRoleColor(item.role) + "20" }]}>
        <ThemedText style={[styles.avatarText, { color: getRoleColor(item.role) }]}>
          {item.name.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.userName}>{item.name}</ThemedText>
          {item.id === currentUser?.id ? (
            <View style={[styles.youBadge, { backgroundColor: theme.primary + "20" }]}>
              <ThemedText style={[styles.youText, { color: theme.primary }]}>You</ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
          @{item.username}
        </ThemedText>
        <View style={styles.metaRow}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + "20" }]}>
            <ThemedText style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </ThemedText>
          </View>
          <ThemedText style={[styles.joinDate, { color: theme.textDisabled }]}>
            Joined {formatDate(item.createdAt)}
          </ThemedText>
        </View>
      </View>
      {item.id !== currentUser?.id ? (
        <Pressable
          style={[
            styles.statusToggle,
            { backgroundColor: item.isActive ? theme.accent + "20" : theme.error + "20" },
          ]}
          onPress={() => handleToggleUser(item)}
        >
          <Feather
            name={item.isActive ? "check-circle" : "x-circle"}
            size={20}
            color={item.isActive ? theme.accent : theme.error}
          />
        </Pressable>
      ) : null}
    </View>
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
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.summaryStat}>
              <ThemedText type="h3" style={{ color: theme.primary }}>
                {users.length}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary }}>Total Users</ThemedText>
            </View>
            <View style={styles.summaryStat}>
              <ThemedText type="h3" style={{ color: theme.accent }}>
                {users.filter((u) => u.isActive).length}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary }}>Active</ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color={theme.textDisabled} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No users found
            </ThemedText>
          </View>
        }
      />
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
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  summaryStat: {
    alignItems: "center",
  },
  userCard: {
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
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  userName: {
    fontWeight: "600",
    fontSize: 15,
  },
  youBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  youText: {
    fontSize: 10,
    fontWeight: "600",
  },
  username: {
    fontSize: 12,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "600",
  },
  joinDate: {
    fontSize: 11,
  },
  statusToggle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
  },
});
