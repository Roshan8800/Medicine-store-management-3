import { useCallback, useMemo, useState, useEffect } from "react";
import { AccessibilityInfo, useColorScheme, Platform, Dimensions } from "react-native";

export interface AccessibilityState {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isBoldTextEnabled: boolean;
  isGrayscaleEnabled: boolean;
  isInvertColorsEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  fontScale: number;
  prefersDarkMode: boolean;
  screenWidth: number;
  screenHeight: number;
}

export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 
    | "button"
    | "link"
    | "search"
    | "image"
    | "text"
    | "header"
    | "alert"
    | "checkbox"
    | "radio"
    | "menu"
    | "menuitem"
    | "progressbar"
    | "slider"
    | "switch"
    | "tab"
    | "tablist"
    | "timer"
    | "toolbar"
    | "none";
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | "mixed";
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityActions?: Array<{ name: string; label?: string }>;
  onAccessibilityAction?: (event: { nativeEvent: { actionName: string } }) => void;
  accessibilityLiveRegion?: "none" | "polite" | "assertive";
  importantForAccessibility?: "auto" | "yes" | "no" | "no-hide-descendants";
}

export function useAccessibility() {
  const colorScheme = useColorScheme();
  const [state, setState] = useState<AccessibilityState>({
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isBoldTextEnabled: false,
    isGrayscaleEnabled: false,
    isInvertColorsEnabled: false,
    isReduceTransparencyEnabled: false,
    fontScale: 1,
    prefersDarkMode: colorScheme === "dark",
    screenWidth: Dimensions.get("window").width,
    screenHeight: Dimensions.get("window").height,
  });

  useEffect(() => {
    const checkAccessibility = async () => {
      try {
        const [screenReader, reduceMotion] = await Promise.all([
          AccessibilityInfo.isScreenReaderEnabled(),
          AccessibilityInfo.isReduceMotionEnabled(),
        ]);

        setState((prev) => ({
          ...prev,
          isScreenReaderEnabled: screenReader,
          isReduceMotionEnabled: reduceMotion,
        }));
      } catch (error) {
        console.warn("Failed to check accessibility settings:", error);
      }
    };

    checkAccessibility();

    const screenReaderListener = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (isEnabled) => setState((prev) => ({ ...prev, isScreenReaderEnabled: isEnabled }))
    );

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (isEnabled) => setState((prev) => ({ ...prev, isReduceMotionEnabled: isEnabled }))
    );

    const dimensionListener = Dimensions.addEventListener("change", ({ window }) => {
      setState((prev) => ({
        ...prev,
        screenWidth: window.width,
        screenHeight: window.height,
      }));
    });

    return () => {
      screenReaderListener.remove();
      reduceMotionListener.remove();
      dimensionListener.remove();
    };
  }, []);

  useEffect(() => {
    setState((prev) => ({ ...prev, prefersDarkMode: colorScheme === "dark" }));
  }, [colorScheme]);

  const announce = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const announcePolite = useCallback((message: string) => {
    setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(message);
    }, 100);
  }, []);

  const setAccessibilityFocus = useCallback((ref: any) => {
    if (ref?.current) {
      AccessibilityInfo.setAccessibilityFocus(ref.current);
    }
  }, []);

  const getScaledFontSize = useCallback((baseSize: number): number => {
    const scale = state.fontScale;
    const maxScale = 1.5;
    const effectiveScale = Math.min(scale, maxScale);
    return Math.round(baseSize * effectiveScale);
  }, [state.fontScale]);

  const getAnimationDuration = useCallback((baseDuration: number): number => {
    return state.isReduceMotionEnabled ? 0 : baseDuration;
  }, [state.isReduceMotionEnabled]);

  const createAccessibleButton = useCallback((
    label: string,
    onPress: () => void,
    options: {
      hint?: string;
      disabled?: boolean;
      selected?: boolean;
    } = {}
  ): AccessibilityProps => {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: options.hint,
      accessibilityRole: "button",
      accessibilityState: {
        disabled: options.disabled,
        selected: options.selected,
      },
    };
  }, []);

  const createAccessibleLink = useCallback((
    label: string,
    hint?: string
  ): AccessibilityProps => {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint || "Double tap to open",
      accessibilityRole: "link",
    };
  }, []);

  const createAccessibleImage = useCallback((
    description: string
  ): AccessibilityProps => {
    return {
      accessible: true,
      accessibilityLabel: description,
      accessibilityRole: "image",
    };
  }, []);

  const createAccessibleInput = useCallback((
    label: string,
    options: {
      hint?: string;
      value?: string;
      error?: string;
    } = {}
  ): AccessibilityProps => {
    let fullLabel = label;
    if (options.value) {
      fullLabel += `, current value: ${options.value}`;
    }
    if (options.error) {
      fullLabel += `, error: ${options.error}`;
    }

    return {
      accessible: true,
      accessibilityLabel: fullLabel,
      accessibilityHint: options.hint || "Double tap to edit",
    };
  }, []);

  const createAccessibleCheckbox = useCallback((
    label: string,
    checked: boolean,
    hint?: string
  ): AccessibilityProps => {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: "checkbox",
      accessibilityState: { checked },
    };
  }, []);

  const createAccessibleSlider = useCallback((
    label: string,
    value: number,
    min: number,
    max: number
  ): AccessibilityProps => {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: "slider" as const,
      accessibilityValue: {
        min,
        max,
        now: value,
        text: `${value}`,
      },
    };
  }, []);

  const createAccessibleTab = useCallback((
    label: string,
    selected: boolean,
    index: number,
    total: number
  ): AccessibilityProps => {
    return {
      accessible: true,
      accessibilityLabel: `${label}, tab ${index + 1} of ${total}`,
      accessibilityRole: "tab",
      accessibilityState: { selected },
    };
  }, []);

  const createAccessibleHeader = useCallback((
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6 = 1
  ): AccessibilityProps => {
    return {
      accessible: true,
      accessibilityLabel: `Heading level ${level}: ${text}`,
      accessibilityRole: "header",
    };
  }, []);

  const createAccessibleProgress = useCallback((
    value: number,
    max: number = 100,
    label?: string
  ): AccessibilityProps => {
    const percentage = Math.round((value / max) * 100);
    return {
      accessible: true,
      accessibilityLabel: label || `Progress: ${percentage}%`,
      accessibilityRole: "progressbar",
      accessibilityValue: {
        min: 0,
        max,
        now: value,
        text: `${percentage}%`,
      },
    };
  }, []);

  return {
    ...state,
    announce,
    announcePolite,
    setAccessibilityFocus,
    getScaledFontSize,
    getAnimationDuration,
    createAccessibleButton,
    createAccessibleLink,
    createAccessibleImage,
    createAccessibleInput,
    createAccessibleCheckbox,
    createAccessibleSlider,
    createAccessibleTab,
    createAccessibleHeader,
    createAccessibleProgress,
  };
}

export function useReducedMotion() {
  const { isReduceMotionEnabled, getAnimationDuration } = useAccessibility();
  return { isReduceMotionEnabled, getAnimationDuration };
}

export function useScreenReader() {
  const { isScreenReaderEnabled, announce, announcePolite, setAccessibilityFocus } = useAccessibility();
  return { isScreenReaderEnabled, announce, announcePolite, setAccessibilityFocus };
}
