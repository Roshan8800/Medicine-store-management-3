import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export interface ActionSheetOption {
  id: string;
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  description?: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  showCancelButton?: boolean;
  cancelLabel?: string;
}

export function ActionSheet({
  visible,
  onClose,
  title,
  message,
  options,
  showCancelButton = true,
  cancelLabel = "Cancel",
}: ActionSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  const handleOptionPress = useCallback(
    (option: ActionSheetOption) => {
      if (option.disabled) return;
      if (Platform.OS !== "web") {
        Haptics.impactAsync(
          option.destructive
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Light
        );
      }
      onClose();
      setTimeout(() => option.onPress(), 150);
    },
    [onClose]
  );

  const handleCancel = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  const screenHeight = Dimensions.get("window").height;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: theme.backgroundElevated,
              paddingBottom: insets.bottom + Spacing.md,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenHeight, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {(title || message) && (
            <View style={[styles.header, { borderBottomColor: theme.divider }]}>
              {title && (
                <ThemedText type="h4" style={styles.title}>
                  {title}
                </ThemedText>
              )}
              {message && (
                <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
                  {message}
                </ThemedText>
              )}
            </View>
          )}

          <View style={styles.options}>
            {options.map((option, index) => (
              <Pressable
                key={option.id}
                style={[
                  styles.option,
                  { borderBottomColor: theme.divider },
                  index < options.length - 1 && styles.optionBorder,
                  option.disabled && styles.optionDisabled,
                ]}
                onPress={() => handleOptionPress(option)}
                disabled={option.disabled}
              >
                {option.icon && (
                  <Feather
                    name={option.icon}
                    size={20}
                    color={
                      option.disabled
                        ? theme.textDisabled
                        : option.destructive
                        ? theme.error
                        : theme.text
                    }
                  />
                )}
                <View style={styles.optionContent}>
                  <ThemedText
                    style={[
                      styles.optionLabel,
                      option.destructive && { color: theme.error },
                      option.disabled && { color: theme.textDisabled },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  {option.description && (
                    <ThemedText
                      style={[styles.optionDescription, { color: theme.textSecondary }]}
                    >
                      {option.description}
                    </ThemedText>
                  )}
                </View>
                <Feather name="chevron-right" size={18} color={theme.textDisabled} />
              </Pressable>
            ))}
          </View>

          {showCancelButton && (
            <Pressable
              style={[styles.cancelButton, { backgroundColor: theme.backgroundDefault }]}
              onPress={handleCancel}
            >
              <ThemedText style={[styles.cancelText, { color: theme.primary }]}>
                {cancelLabel}
              </ThemedText>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

export function useActionSheet() {
  const [visible, setVisible] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ActionSheetProps, "visible" | "onClose">>({
    options: [],
  });

  const show = useCallback((newConfig: Omit<ActionSheetProps, "visible" | "onClose">) => {
    setConfig(newConfig);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const ActionSheetComponent = useCallback(
    () => <ActionSheet {...config} visible={visible} onClose={hide} />,
    [config, visible, hide]
  );

  return {
    show,
    hide,
    visible,
    ActionSheet: ActionSheetComponent,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  message: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
  options: {
    paddingTop: Spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  optionBorder: {
    borderBottomWidth: 1,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
