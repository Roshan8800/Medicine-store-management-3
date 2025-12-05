import React from "react";
import { View, StyleSheet, Pressable, Modal, ScrollView, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const menuItems = [
    { icon: "truck" as const, label: "Suppliers", screen: "SupplierList" as const },
    { icon: "alert-triangle" as const, label: "Low Stock", screen: "LowStock" as const },
    { icon: "clock" as const, label: "Expiry Management", screen: "ExpiryManagement" as const },
    { icon: "users" as const, label: "User Management", screen: "UserManagement" as const, ownerOnly: true },
    { icon: "file-text" as const, label: "Audit Log", screen: "AuditLog" as const },
    { icon: "help-circle" as const, label: "Help & FAQ", screen: "Help" as const },
    { icon: "info" as const, label: "About", screen: "About" as const },
  ];

  const handleNavigate = (screen: keyof RootStackParamList) => {
    onClose();
    navigation.navigate(screen as any);
  };

  const handleSupport = () => {
    Linking.openURL("mailto:roshan8800jp@gmail.com?subject=Binayak%20Pharmacy%20Support");
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={isDark ? "dark" : "light"} />
      </Pressable>
      
      <View style={[styles.drawer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </ThemedText>
            </View>
            <View>
              <ThemedText type="h4">{user?.name || "User"}</ThemedText>
              <ThemedText style={[styles.role, { color: theme.textSecondary }]}>
                {user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) || "")}
              </ThemedText>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.menuList} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}>
          {menuItems.map((item, index) => {
            if (item.ownerOnly && user?.role !== "owner") return null;
            return (
              <Pressable
                key={index}
                style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
                onPress={() => handleNavigate(item.screen)}
              >
                <Feather name={item.icon} size={20} color={theme.primary} />
                <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
            );
          })}

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <Pressable
            style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
            onPress={handleSupport}
          >
            <Feather name="mail" size={20} color={theme.primary} />
            <ThemedText style={styles.menuLabel}>Contact Support</ThemedText>
            <Feather name="external-link" size={20} color={theme.textSecondary} />
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  drawer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "80%",
    maxWidth: 320,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
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
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  role: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  menuList: {
    flex: 1,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
});
