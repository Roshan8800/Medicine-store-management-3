import React, { useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, FadeInRight, FadeOutLeft } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/contexts/NotificationContext";
import { useSwipeGesture } from "@/hooks/useGestures";
import { Spacing, BorderRadius } from "@/constants/theme";

const notificationIcons: Record<string, keyof typeof Feather.glyphMap> = {
  expiry: "alert-triangle",
  lowStock: "package",
  order: "shopping-cart",
  system: "info",
  sale: "dollar-sign",
};

const notificationColors: Record<string, string> = {
  expiry: "#F44336",
  lowStock: "#FF9800",
  order: "#4CAF50",
  system: "#2196F3",
  sale: "#9C27B0",
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderNotification = ({ item, index }: { item: (typeof notifications)[0]; index: number }) => (
    <NotificationItem
      notification={item}
      onPress={() => markAsRead(item.id)}
      formatTime={formatTime}
      index={index}
    />
  );

  return (
    <ThemedView style={styles.container}>
      {notifications.length > 0 ? (
        <View style={[styles.header, { paddingTop: headerHeight + Spacing.lg }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </ThemedText>
          <View style={styles.headerActions}>
            <Pressable onPress={markAllAsRead} style={styles.headerButton}>
              <Feather name="check-circle" size={18} color={theme.primary} />
              <ThemedText type="small" style={{ color: theme.primary, marginLeft: 4 }}>
                Mark all read
              </ThemedText>
            </Pressable>
            <Pressable onPress={clearNotifications} style={styles.headerButton}>
              <Feather name="trash-2" size={18} color={theme.error} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={[
          styles.list,
          { 
            paddingTop: notifications.length > 0 ? Spacing.md : headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl 
          },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell-off" size={64} color={theme.textDisabled} />
            <ThemedText type="h4" style={{ marginTop: Spacing.xl }}>
              No Notifications
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
              You're all caught up! New alerts will appear here.
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

function NotificationItem({ 
  notification, 
  onPress,
  formatTime,
  index 
}: { 
  notification: {
    id: string;
    title: string;
    body: string;
    type: string;
    read: boolean;
    createdAt: Date;
  }; 
  onPress: () => void;
  formatTime: (date: Date) => string;
  index: number;
}) {
  const { theme } = useTheme();
  
  const { gesture, translateX } = useSwipeGesture({
    onSwipeLeft: onPress,
    onSwipeRight: onPress,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: notification.read ? 0.7 : 1,
  }));

  const iconName = notificationIcons[notification.type] || "bell";
  const iconColor = notificationColors[notification.type] || theme.primary;

  return (
    <Animated.View entering={FadeInRight.delay(index * 50)} exiting={FadeOutLeft}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={animatedStyle}>
          <Pressable onPress={onPress}>
            <Card style={[
              styles.notificationCard,
              !notification.read && { borderLeftWidth: 4, borderLeftColor: iconColor }
            ]}>
              <View style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}>
                <Feather name={iconName} size={20} color={iconColor} />
              </View>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <ThemedText type="body" style={{ fontWeight: notification.read ? "400" : "600", flex: 1 }}>
                    {notification.title}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {formatTime(notification.createdAt)}
                  </ThemedText>
                </View>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                  {notification.body}
                </ThemedText>
              </View>
            </Card>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.xs,
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
    paddingHorizontal: Spacing.xl,
  },
  notificationCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
});
