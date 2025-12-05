import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast.warning("Required", "Please enter your current password");
      return;
    }

    if (!newPassword.trim()) {
      toast.warning("Required", "Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.warning("Weak Password", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mismatch", "New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      toast.warning("Same Password", "New password must be different from current");
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password Changed", "Your password has been updated successfully");
      navigation.goBack();
    } catch (error: any) {
      toast.error("Failed", error.message || "Could not change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={[styles.infoCard, { backgroundColor: theme.primary + "10" }]}>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Create a strong password with at least 6 characters. Use a mix of letters, numbers, and symbols for best security.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Current Password"
            placeholder="Enter your current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <TextInput
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TextInput
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <Button onPress={handleChangePassword} disabled={isLoading}>
            {isLoading ? "Updating..." : "Change Password"}
          </Button>
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
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: Spacing.lg,
  },
});
