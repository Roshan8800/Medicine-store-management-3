import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, TextInput as RNTextInput, Platform, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

export default function ProfileScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditing(false);
    Alert.alert("Success", "Profile updated successfully");
  };

  const handlePickImage = async () => {
    if (!mediaPermission?.granted) {
      if (mediaPermission?.status === "denied" && !mediaPermission?.canAskAgain) {
        Alert.alert(
          "Permission Required",
          "Please enable media library access in your device settings to change your profile picture.",
          [
            { text: "Cancel", style: "cancel" },
            ...(Platform.OS !== "web" ? [{
              text: "Open Settings",
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error("Cannot open settings:", error);
                }
              }
            }] : [])
          ]
        );
        return;
      }
      
      const { granted } = await requestMediaPermission();
      if (!granted) {
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Profile picture updated");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickImage}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </ThemedText>
            </View>
            <View style={[styles.editBadge, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="camera" size={14} color={theme.primary} />
            </View>
          </Pressable>
          <ThemedText type="h3" style={styles.userName}>{user?.name}</ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: theme.primary + "20" }]}>
            <ThemedText style={[styles.roleText, { color: theme.primary }]}>
              {user?.role?.toUpperCase()}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.cardHeader}>
            <ThemedText type="h4">Personal Information</ThemedText>
            <Pressable onPress={() => setIsEditing(!isEditing)}>
              <Feather 
                name={isEditing ? "x" : "edit-2"} 
                size={20} 
                color={theme.primary} 
              />
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Full Name
            </ThemedText>
            {isEditing ? (
              <RNTextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.divider }
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={theme.textDisabled}
              />
            ) : (
              <ThemedText style={styles.value}>{name || "Not set"}</ThemedText>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Email Address
            </ThemedText>
            {isEditing ? (
              <RNTextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.divider }
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={theme.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <ThemedText style={styles.value}>{email || "Not set"}</ThemedText>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Phone Number
            </ThemedText>
            {isEditing ? (
              <RNTextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.divider }
                ]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                placeholderTextColor={theme.textDisabled}
                keyboardType="phone-pad"
              />
            ) : (
              <ThemedText style={styles.value}>{phone || "Not set"}</ThemedText>
            )}
          </View>

          {isEditing ? (
            <Pressable
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
            >
              <Feather name="check" size={20} color="#fff" />
              <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.cardTitle}>Account Statistics</ThemedText>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="shopping-cart" size={20} color={theme.primary} />
              </View>
              <ThemedText style={styles.statValue}>156</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total Sales
              </ThemedText>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: theme.success + "20" }]}>
                <Feather name="trending-up" size={20} color={theme.success} />
              </View>
              <ThemedText style={styles.statValue}>Rs 45,230</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Revenue
              </ThemedText>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: theme.warning + "20" }]}>
                <Feather name="calendar" size={20} color={theme.warning} />
              </View>
              <ThemedText style={styles.statValue}>30</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Days Active
              </ThemedText>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: theme.info + "20" }]}>
                <Feather name="users" size={20} color={theme.info} />
              </View>
              <ThemedText style={styles.statValue}>89</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Customers
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.cardTitle}>Security</ThemedText>
          
          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="lock" size={18} color={theme.primary} />
            </View>
            <View style={styles.menuContent}>
              <ThemedText style={styles.menuLabel}>Change Password</ThemedText>
              <ThemedText style={[styles.menuDescription, { color: theme.textSecondary }]}>
                Update your account password
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: theme.success + "20" }]}>
              <Feather name="smartphone" size={18} color={theme.success} />
            </View>
            <View style={styles.menuContent}>
              <ThemedText style={styles.menuLabel}>Two-Factor Auth</ThemedText>
              <ThemedText style={[styles.menuDescription, { color: theme.textSecondary }]}>
                Add extra security to your account
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: theme.warning + "20" }]}>
              <Feather name="activity" size={18} color={theme.warning} />
            </View>
            <View style={styles.menuContent}>
              <ThemedText style={styles.menuLabel}>Login Activity</ThemedText>
              <ThemedText style={[styles.menuDescription, { color: theme.textSecondary }]}>
                View recent login sessions
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "600",
  },
  editBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    marginTop: Spacing.md,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.lg,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: 16,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statItem: {
    width: "47%",
    alignItems: "center",
    padding: Spacing.md,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  menuDescription: {
    fontSize: 12,
    marginTop: 2,
  },
});
