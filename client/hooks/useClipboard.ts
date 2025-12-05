import { useState, useCallback } from "react";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface UseClipboardResult {
  copied: boolean;
  copy: (text: string) => Promise<void>;
  paste: () => Promise<string>;
  clear: () => void;
}

export function useClipboard(resetTimeout = 2000): UseClipboardResult {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await Clipboard.setStringAsync(text);
        setCopied(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setTimeout(() => setCopied(false), resetTimeout);
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        throw error;
      }
    },
    [resetTimeout]
  );

  const paste = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      return text;
    } catch (error) {
      console.error("Failed to paste from clipboard:", error);
      throw error;
    }
  }, []);

  const clear = useCallback(() => {
    setCopied(false);
  }, []);

  return {
    copied,
    copy,
    paste,
    clear,
  };
}
