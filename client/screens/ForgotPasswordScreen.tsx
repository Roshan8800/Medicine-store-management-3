import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast.warning("Email Required", "Please enter your email address");
      return;
    }

    if (!validateEmail(email.trim())) {
      toast.error("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email: email.trim() });
      setEmailSent(true);
      toast.success("Email Sent", "Check your inbox for reset instructions");
    } catch (error: any) {
      toast.error("Failed", error.message || "Could not send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.successContent, { paddingTop: insets.top + Spacing["4xl"] }]}>
          <View style={[styles.successIcon, { backgroundColor: theme.success + "20" }]}>
            <Feather name="mail" size={48} color={theme.success} />
          </View>
          <ThemedText type="h3" style={styles.successTitle}>Check Your Email</ThemedText>
          <ThemedText style={[styles.successText, { color: theme.textSecondary }]}>
            We've sent password reset instructions to:
          </ThemedText>
          <ThemedText style={[styles.emailText, { color: theme.primary }]}>{email}</ThemedText>
          <ThemedText style={[styles.instructionText, { color: theme.textSecondary }]}>
            Didn't receive the email? Check your spam folder or try again.
          </ThemedText>
          <View style={styles.successActions}>
            <Button onPress={() => setEmailSent(false)} variant="outline">
              Try Different Email
            </Button>
            <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
              <ThemedText type="link">Back to Login</ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "15" }]}>
            <Feather name="lock" size={32} color={theme.primary} />
          </View>
          <ThemedText type="h3" style={styles.title}>Forgot Password?</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter your email address and we'll send you instructions to reset your password.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button onPress={handleResetPassword} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </View>

        <View style={styles.footer}>
          <ThemedText style={{ color: theme.textSecondary }}>Remember your password? </ThemedText>
          <Pressable onPress={() => navigation.goBack()}>
            <ThemedText type="link">Back to Login</ThemedText>
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
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  form: {
    gap: Spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing["2xl"],
  },
  successContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  successTitle: {
    marginBottom: Spacing.md,
  },
  successText: {
    fontSize: 14,
    textAlign: "center",
  },
  emailText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  instructionText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  successActions: {
    marginTop: Spacing["2xl"],
    gap: Spacing.lg,
    alignItems: "center",
  },
  backLink: {
    padding: Spacing.md,
  },
});
