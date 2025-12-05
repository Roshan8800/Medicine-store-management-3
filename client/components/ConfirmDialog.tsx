import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Modal, Pressable, Animated, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type DialogType = "confirm" | "warning" | "danger" | "info" | "success";

interface ConfirmDialogProps {
  visible: boolean;
  type?: DialogType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
}

const DIALOG_CONFIG: Record<DialogType, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  confirm: { icon: "help-circle", color: "#3B82F6" },
  warning: { icon: "alert-triangle", color: "#F59E0B" },
  danger: { icon: "trash-2", color: "#EF4444" },
  info: { icon: "info", color: "#3B82F6" },
  success: { icon: "check-circle", color: "#10B981" },
};

export function ConfirmDialog({
  visible,
  type = "confirm",
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  icon,
}: ConfirmDialogProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const config = DIALOG_CONFIG[type];

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== "web") {
        if (type === "danger") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const displayIcon = icon || config.icon;
  const confirmButtonVariant = type === "danger" ? "destructive" : "primary";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: opacityAnim },
        ]}
      >
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <Animated.View
          style={[
            styles.dialog,
            {
              backgroundColor: theme.backgroundElevated,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: config.color + "15" }]}>
            <Feather name={displayIcon} size={28} color={config.color} />
          </View>

          <ThemedText type="h4" style={styles.title}>
            {title}
          </ThemedText>

          <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </ThemedText>

          <View style={styles.actions}>
            <Button
              onPress={onCancel}
              variant="outline"
              style={styles.button}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              onPress={onConfirm}
              variant={confirmButtonVariant}
              style={styles.button}
              disabled={loading}
            >
              {loading ? "Processing..." : confirmLabel}
            </Button>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export function DeleteConfirmDialog({
  visible,
  itemName,
  onConfirm,
  onCancel,
  loading,
}: {
  visible: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      visible={visible}
      type="danger"
      title="Delete Item"
      message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
    />
  );
}

export function LogoutConfirmDialog({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      visible={visible}
      type="warning"
      title="Logout"
      message="Are you sure you want to logout? You'll need to sign in again to access your account."
      confirmLabel="Logout"
      onConfirm={onConfirm}
      onCancel={onCancel}
      icon="log-out"
    />
  );
}

export function DiscardChangesDialog({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      visible={visible}
      type="warning"
      title="Discard Changes"
      message="You have unsaved changes. Are you sure you want to discard them?"
      confirmLabel="Discard"
      cancelLabel="Keep Editing"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    width: "85%",
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  button: {
    flex: 1,
  },
});
