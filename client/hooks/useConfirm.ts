import { useState, useCallback } from "react";
import { Alert, AlertButton, Platform } from "react-native";

interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface UseConfirmResult {
  confirm: (config: ConfirmConfig) => Promise<boolean>;
  confirmDelete: (itemName: string) => Promise<boolean>;
  confirmAction: (action: string) => Promise<boolean>;
  confirmDiscard: () => Promise<boolean>;
  confirmLogout: () => Promise<boolean>;
}

export function useConfirm(): UseConfirmResult {
  const confirm = useCallback((config: ConfirmConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      const buttons: AlertButton[] = [
        {
          text: config.cancelText || "Cancel",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: config.confirmText || "Confirm",
          style: config.destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ];

      Alert.alert(config.title, config.message, buttons, {
        cancelable: true,
        onDismiss: () => resolve(false),
      });
    });
  }, []);

  const confirmDelete = useCallback(
    (itemName: string): Promise<boolean> => {
      return confirm({
        title: "Delete Item",
        message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        confirmText: "Delete",
        destructive: true,
      });
    },
    [confirm]
  );

  const confirmAction = useCallback(
    (action: string): Promise<boolean> => {
      return confirm({
        title: "Confirm Action",
        message: `Are you sure you want to ${action}?`,
        confirmText: "Yes",
      });
    },
    [confirm]
  );

  const confirmDiscard = useCallback((): Promise<boolean> => {
    return confirm({
      title: "Discard Changes",
      message: "You have unsaved changes. Are you sure you want to discard them?",
      confirmText: "Discard",
      destructive: true,
    });
  }, [confirm]);

  const confirmLogout = useCallback((): Promise<boolean> => {
    return confirm({
      title: "Logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      destructive: true,
    });
  }, [confirm]);

  return {
    confirm,
    confirmDelete,
    confirmAction,
    confirmDiscard,
    confirmLogout,
  };
}

interface UsePromptConfig {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

export function usePrompt() {
  const prompt = useCallback(
    (config: UsePromptConfig): Promise<string | null> => {
      return new Promise((resolve) => {
        if (Platform.OS === "web") {
          const result = window.prompt(config.message || config.title, config.defaultValue);
          resolve(result);
        } else {
          Alert.prompt(
            config.title,
            config.message,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
              { text: "OK", onPress: (value?: string) => resolve(value || null) },
            ],
            "plain-text",
            config.defaultValue,
            config.keyboardType
          );
        }
      });
    },
    []
  );

  return { prompt };
}

interface DialogState<T> {
  isOpen: boolean;
  data: T | null;
}

export function useDialogState<T = unknown>() {
  const [state, setState] = useState<DialogState<T>>({
    isOpen: false,
    data: null,
  });

  const open = useCallback((data?: T) => {
    setState({ isOpen: true, data: data ?? null });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, data: null });
  }, []);

  const toggle = useCallback((data?: T) => {
    setState((prev) => ({
      isOpen: !prev.isOpen,
      data: prev.isOpen ? null : data ?? null,
    }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
  };
}
