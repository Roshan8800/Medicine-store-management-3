import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp, useAnimatedStyle, withSpring, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface BiometricAuthScreenProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function BiometricAuthScreen({ onSuccess, onCancel }: BiometricAuthScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isSupported, setIsSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("Biometric");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const pulseScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  useEffect(() => {
    checkBiometricSupport();
    pulseScale.value = withRepeat(
      withTiming(1.1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const checkBiometricSupport = async () => {
    if (Platform.OS === "web") {
      setIsSupported(false);
      return;
    }

    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsSupported(compatible);

    if (compatible) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("Face ID");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("Fingerprint");
      }

      authenticate();
    }
  };

  const authenticate = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Biometric authentication is only available in Expo Go");
      return;
    }

    setIsAuthenticating(true);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access Binayak Pharmacy",
        fallbackLabel: "Use PIN",
        disableDeviceFallback: false,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        iconRotation.value = withSpring(360);
        setTimeout(onSuccess, 300);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFailedAttempts(prev => prev + 1);
        
        if (result.error === "user_cancel") {
          onCancel?.();
        }
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  }, [onSuccess, onCancel]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const getIcon = (): keyof typeof Feather.glyphMap => {
    if (biometricType === "Face ID") return "smile";
    return "unlock";
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + Spacing["5xl"] }]}>
        <Animated.View entering={FadeInUp.delay(100)}>
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: theme.primary }]}>
              <Feather name="activity" size={48} color="#FFFFFF" />
            </View>
            <ThemedText type="h2" style={styles.title}>
              Binayak Pharmacy
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.authSection}>
          <Animated.View style={[styles.iconContainer, animatedIconStyle, { backgroundColor: theme.primary + "20" }]}>
            <Feather name={getIcon()} size={64} color={theme.primary} />
          </Animated.View>

          <ThemedText type="h4" style={styles.authTitle}>
            {isAuthenticating ? "Authenticating..." : `Use ${biometricType}`}
          </ThemedText>

          <ThemedText type="body" style={[styles.authSubtitle, { color: theme.textSecondary }]}>
            {isSupported
              ? "Authenticate to access the app"
              : Platform.OS === "web"
              ? "Run in Expo Go to use biometric authentication"
              : "Biometric authentication is not available on this device"}
          </ThemedText>

          {failedAttempts > 0 ? (
            <ThemedText type="small" style={{ color: theme.error, marginTop: Spacing.md }}>
              Authentication failed. {3 - failedAttempts} attempts remaining.
            </ThemedText>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)} style={styles.actions}>
          {isSupported ? (
            <Button onPress={authenticate} loading={isAuthenticating} disabled={failedAttempts >= 3}>
              {isAuthenticating ? "Verifying..." : `Authenticate with ${biometricType}`}
            </Button>
          ) : (
            <Button onPress={onSuccess}>
              Continue without Authentication
            </Button>
          )}

          {onCancel ? (
            <Button variant="secondary" onPress={onCancel} style={{ marginTop: Spacing.md }}>
              Cancel
            </Button>
          ) : null}
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: Spacing.xl,
  },
  authSection: {
    alignItems: "center",
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  authTitle: {
    marginTop: Spacing.md,
  },
  authSubtitle: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  actions: {
    paddingBottom: Spacing["5xl"],
  },
});
