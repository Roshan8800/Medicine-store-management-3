import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Linking, Switch, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingsItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description?: string;
  onPress?: () => void;
  danger?: boolean;
  ownerOnly?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  badge?: string;
}

const AI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", speed: "Fast" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", speed: "Balanced" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", speed: "Balanced" },
  { id: "claude-3", name: "Claude 3", provider: "Anthropic", speed: "Balanced" },
];

export default function SettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [selectedAIModel, setSelectedAIModel] = useState("gemini-2.5-flash");
  const [aiEnabled, setAIEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem("app_settings");
      if (settings) {
        const parsed = JSON.parse(settings);
        setDarkMode(parsed.darkMode ?? false);
        setNotifications(parsed.notifications ?? true);
        setHapticFeedback(parsed.hapticFeedback ?? true);
        setAutoBackup(parsed.autoBackup ?? false);
        setOfflineMode(parsed.offlineMode ?? false);
        setSelectedAIModel(parsed.selectedAIModel ?? "gemini-2.5-flash");
        setAIEnabled(parsed.aiEnabled ?? true);
        setBiometricEnabled(parsed.biometricEnabled ?? false);
        setLowStockAlerts(parsed.lowStockAlerts ?? true);
        setExpiryAlerts(parsed.expiryAlerts ?? true);
        setSoundEnabled(parsed.soundEnabled ?? true);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const saveSetting = async (key: string, value: unknown) => {
    try {
      const settings = await AsyncStorage.getItem("app_settings");
      const parsed = settings ? JSON.parse(settings) : {};
      parsed[key] = value;
      await AsyncStorage.setItem("app_settings", JSON.stringify(parsed));
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Failed to save setting:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout },
      ]
    );
  };

  const handleSupport = () => {
    Linking.openURL("mailto:roshan8800jp@gmail.com?subject=Binayak%20Pharmacy%20Support");
  };

  const handleAIModelSelect = () => {
    Alert.alert(
      "Select AI Model",
      "Choose your preferred AI model for smart features",
      AI_MODELS.map(model => ({
        text: `${model.name} (${model.speed})`,
        onPress: () => {
          setSelectedAIModel(model.id);
          saveSetting("selectedAIModel", model.id);
        },
      })).concat([{ text: "Cancel", style: "cancel" } as any])
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data. Your saved data will not be affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("search_history");
            await AsyncStorage.removeItem("recent_medicines");
            Alert.alert("Success", "Cache cleared successfully");
          },
        },
      ]
    );
  };

  const currentAIModel = AI_MODELS.find(m => m.id === selectedAIModel);

  const settingsSections: { title: string; items: SettingsItem[] }[] = [
    {
      title: "AI Configuration",
      items: [
        {
          icon: "cpu",
          label: "AI Features",
          description: "Enable smart predictions and insights",
          toggle: true,
          toggleValue: aiEnabled,
          onToggle: (value) => {
            setAIEnabled(value);
            saveSetting("aiEnabled", value);
          },
        },
        {
          icon: "zap",
          label: "AI Model",
          description: currentAIModel ? `${currentAIModel.name} - ${currentAIModel.provider}` : "Select model",
          onPress: handleAIModelSelect,
          badge: currentAIModel?.speed,
        },
        {
          icon: "key",
          label: "API Keys",
          description: "Configure AI provider API keys",
          onPress: () => navigation.navigate("APISettings" as any),
        },
      ],
    },
    {
      title: "Appearance",
      items: [
        {
          icon: "moon",
          label: "Dark Mode",
          description: "Use dark theme throughout the app",
          toggle: true,
          toggleValue: darkMode,
          onToggle: (value) => {
            setDarkMode(value);
            saveSetting("darkMode", value);
          },
        },
        {
          icon: "smartphone",
          label: "Haptic Feedback",
          description: "Vibration feedback on actions",
          toggle: true,
          toggleValue: hapticFeedback,
          onToggle: (value) => {
            setHapticFeedback(value);
            saveSetting("hapticFeedback", value);
          },
        },
        {
          icon: "volume-2",
          label: "Sound Effects",
          description: "Play sounds for notifications",
          toggle: true,
          toggleValue: soundEnabled,
          onToggle: (value) => {
            setSoundEnabled(value);
            saveSetting("soundEnabled", value);
          },
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: "bell",
          label: "Push Notifications",
          description: "Receive alerts and updates",
          toggle: true,
          toggleValue: notifications,
          onToggle: (value) => {
            setNotifications(value);
            saveSetting("notifications", value);
          },
        },
        {
          icon: "alert-triangle",
          label: "Low Stock Alerts",
          description: "Alert when stock is low",
          toggle: true,
          toggleValue: lowStockAlerts,
          onToggle: (value) => {
            setLowStockAlerts(value);
            saveSetting("lowStockAlerts", value);
          },
        },
        {
          icon: "clock",
          label: "Expiry Alerts",
          description: "Alert for expiring medicines",
          toggle: true,
          toggleValue: expiryAlerts,
          onToggle: (value) => {
            setExpiryAlerts(value);
            saveSetting("expiryAlerts", value);
          },
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          icon: "lock",
          label: "Biometric Login",
          description: "Use fingerprint or Face ID",
          toggle: true,
          toggleValue: biometricEnabled,
          onToggle: (value) => {
            setBiometricEnabled(value);
            saveSetting("biometricEnabled", value);
          },
        },
        {
          icon: "shield",
          label: "Change Password",
          description: "Update your account password",
          onPress: () => navigation.navigate("ChangePassword" as any),
        },
        {
          icon: "smartphone",
          label: "Active Sessions",
          description: "Manage logged in devices",
          onPress: () => Alert.alert("Sessions", "You are logged in on 1 device"),
        },
      ],
    },
    {
      title: "Data Management",
      items: [
        {
          icon: "cloud",
          label: "Auto Backup",
          description: "Automatically backup data to cloud",
          toggle: true,
          toggleValue: autoBackup,
          onToggle: (value) => {
            setAutoBackup(value);
            saveSetting("autoBackup", value);
          },
        },
        {
          icon: "wifi-off",
          label: "Offline Mode",
          description: "Work without internet connection",
          toggle: true,
          toggleValue: offlineMode,
          onToggle: (value) => {
            setOfflineMode(value);
            saveSetting("offlineMode", value);
          },
        },
        {
          icon: "hard-drive",
          label: "Backup & Restore",
          description: "Export or import your data",
          onPress: () => navigation.navigate("BackupRestore"),
        },
        {
          icon: "trash-2",
          label: "Clear Cache",
          description: "Free up storage space",
          onPress: handleClearCache,
        },
      ],
    },
    {
      title: "Store Management",
      items: [
        {
          icon: "users",
          label: "User Management",
          description: "Manage staff accounts and permissions",
          onPress: () => navigation.navigate("UserManagement"),
          ownerOnly: true,
        },
        {
          icon: "truck",
          label: "Suppliers",
          description: "Manage your suppliers",
          onPress: () => navigation.navigate("SupplierList"),
        },
        {
          icon: "grid",
          label: "Categories",
          description: "Organize medicine categories",
          onPress: () => navigation.navigate("Categories"),
        },
        {
          icon: "users",
          label: "Customers",
          description: "View customer information",
          onPress: () => navigation.navigate("Customers"),
        },
        {
          icon: "file-text",
          label: "Audit Log",
          description: "View activity history",
          onPress: () => navigation.navigate("AuditLog"),
        },
      ],
    },
    {
      title: "Inventory Alerts",
      items: [
        {
          icon: "alert-triangle",
          label: "Low Stock Alerts",
          description: "Items below reorder level",
          onPress: () => navigation.navigate("LowStock"),
        },
        {
          icon: "clock",
          label: "Expiry Management",
          description: "Track expiring medicines",
          onPress: () => navigation.navigate("ExpiryManagement"),
        },
        {
          icon: "bar-chart-2",
          label: "Analytics",
          description: "View sales and inventory insights",
          onPress: () => navigation.navigate("Analytics"),
        },
        {
          icon: "file-plus",
          label: "Reports",
          description: "Generate detailed reports",
          onPress: () => navigation.navigate("Reports" as any),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "help-circle",
          label: "Help & FAQ",
          description: "Get help and answers",
          onPress: () => navigation.navigate("Help"),
        },
        {
          icon: "mail",
          label: "Contact Support",
          description: "roshan8800jp@gmail.com",
          onPress: handleSupport,
        },
        {
          icon: "star",
          label: "Rate the App",
          description: "Share your feedback",
          onPress: () => Alert.alert("Thank you!", "We appreciate your support."),
        },
        {
          icon: "share-2",
          label: "Share App",
          description: "Recommend to others",
          onPress: () => Alert.alert("Share", "Share functionality coming soon!"),
        },
        {
          icon: "info",
          label: "About",
          description: "App info and credits",
          onPress: () => navigation.navigate("About"),
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: "user",
          label: "Edit Profile",
          description: "Update your profile information",
          onPress: () => navigation.navigate("Profile" as any),
        },
        {
          icon: "log-out",
          label: "Logout",
          description: `Logged in as ${user?.name}`,
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <ThemedText type="h3">Settings</ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable 
          style={[styles.profileCard, { backgroundColor: theme.backgroundDefault }]}
          onPress={() => navigation.navigate("Profile" as any)}
        >
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type="h4">{user?.name || "User"}</ThemedText>
            <ThemedText style={[styles.profileRole, { color: theme.textSecondary }]}>
              {user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) || "")} Account
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </ThemedText>
            <View style={[styles.sectionContent, { backgroundColor: theme.backgroundDefault }]}>
              {section.items.map((item, itemIndex) => {
                if (item.ownerOnly && user?.role !== "owner") return null;
                return (
                  <Pressable
                    key={itemIndex}
                    style={[
                      styles.settingsItem,
                      itemIndex < section.items.filter(i => !i.ownerOnly || user?.role === "owner").length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.divider,
                      },
                    ]}
                    onPress={item.toggle ? undefined : item.onPress}
                    disabled={item.toggle}
                  >
                    <View style={[
                      styles.iconContainer,
                      { backgroundColor: item.danger ? theme.error + "20" : theme.primary + "20" }
                    ]}>
                      <Feather
                        name={item.icon}
                        size={20}
                        color={item.danger ? theme.error : theme.primary}
                      />
                    </View>
                    <View style={styles.itemContent}>
                      <View style={styles.labelRow}>
                        <ThemedText style={[
                          styles.itemLabel,
                          item.danger && { color: theme.error }
                        ]}>
                          {item.label}
                        </ThemedText>
                        {item.badge ? (
                          <View style={[styles.badge, { backgroundColor: theme.primary + "20" }]}>
                            <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
                              {item.badge}
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                      {item.description ? (
                        <ThemedText style={[styles.itemDescription, { color: theme.textSecondary }]}>
                          {item.description}
                        </ThemedText>
                      ) : null}
                    </View>
                    {item.toggle ? (
                      <Switch
                        value={item.toggleValue}
                        onValueChange={item.onToggle}
                        trackColor={{ false: theme.divider, true: theme.primary + "80" }}
                        thumbColor={item.toggleValue ? theme.primary : "#f4f3f4"}
                      />
                    ) : (
                      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <ThemedText style={[styles.version, { color: theme.textDisabled }]}>
          Binayak Pharmacy v2.0.0{"\n"}
          Powered by AI
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  profileInfo: {
    flex: 1,
  },
  profileRole: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: "uppercase",
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  itemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
