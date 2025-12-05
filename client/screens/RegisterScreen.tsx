import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/Toast";
import { Spacing } from "@/constants/theme";
import { TextInput } from "@/components/TextInput";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { register } = useAuth();
  const toast = useToast();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      toast.warning("Missing Information", "Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password Mismatch", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.warning("Weak Password", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        username: username.trim(),
        email: email.trim() || undefined,
        password,
      });
      toast.success("Account Created", "Welcome to Binayak Pharmacy!");
    } catch (error: any) {
      toast.error("Registration Failed", error.message || "Could not create account");
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
        <View style={styles.form}>
          <TextInput
            label="Full Name *"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            label="Username *"
            placeholder="Choose a username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            label="Email (Optional)"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            label="Password *"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            label="Confirm Password *"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <Button onPress={handleRegister} disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
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
  form: {
    gap: Spacing.lg,
  },
});
