import { useState, useEffect, useCallback } from "react";
import { Keyboard, KeyboardEvent, Platform, Dimensions } from "react-native";

interface KeyboardState {
  isVisible: boolean;
  height: number;
  animationDuration: number;
}

interface UseKeyboardResult extends KeyboardState {
  dismiss: () => void;
}

export function useKeyboard(): UseKeyboardResult {
  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    animationDuration: 250,
  });

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleShow = (event: KeyboardEvent) => {
      setState({
        isVisible: true,
        height: event.endCoordinates.height,
        animationDuration: event.duration || 250,
      });
    };

    const handleHide = (event: KeyboardEvent) => {
      setState({
        isVisible: false,
        height: 0,
        animationDuration: event.duration || 250,
      });
    };

    const showSubscription = Keyboard.addListener(showEvent, handleShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    ...state,
    dismiss,
  };
}

export function useKeyboardAwareHeight(baseHeight: number): number {
  const { isVisible, height } = useKeyboard();
  const screenHeight = Dimensions.get("window").height;

  if (!isVisible) return baseHeight;

  const availableHeight = screenHeight - height;
  return Math.min(baseHeight, availableHeight * 0.9);
}

interface UseKeyboardAvoidingConfig {
  enabled?: boolean;
  offset?: number;
}

export function useKeyboardAvoiding({
  enabled = true,
  offset = 0,
}: UseKeyboardAvoidingConfig = {}) {
  const { isVisible, height, animationDuration } = useKeyboard();

  const bottomPadding = enabled && isVisible ? height + offset : 0;

  return {
    bottomPadding,
    isKeyboardVisible: isVisible,
    keyboardHeight: height,
    animationDuration,
  };
}
