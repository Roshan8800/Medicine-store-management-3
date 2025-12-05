import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import { Alert, BackHandler } from "react-native";

export interface NavigationGuardConfig {
  enabled?: boolean;
  message?: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  shouldBlock?: () => boolean;
}

export function useNavigationGuard(config: NavigationGuardConfig = {}) {
  const {
    enabled = true,
    message = "You have unsaved changes. Are you sure you want to leave?",
    title = "Discard Changes?",
    confirmText = "Leave",
    cancelText = "Stay",
    onConfirm,
    onCancel,
    shouldBlock,
  } = config;

  const navigation = useNavigation();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  const checkShouldBlock = useCallback((): boolean => {
    if (!enabled) return false;
    if (shouldBlock) return shouldBlock();
    return hasUnsavedChanges;
  }, [enabled, shouldBlock, hasUnsavedChanges]);

  const showConfirmation = useCallback((onLeave: () => void) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: "cancel",
          onPress: () => {
            setIsBlocking(false);
            pendingNavigationRef.current = null;
            onCancel?.();
          },
        },
        {
          text: confirmText,
          style: "destructive",
          onPress: () => {
            setIsBlocking(false);
            setHasUnsavedChanges(false);
            onConfirm?.();
            onLeave();
          },
        },
      ],
      { cancelable: true }
    );
  }, [title, message, confirmText, cancelText, onConfirm, onCancel]);

  useEffect(() => {
    const handleBackPress = () => {
      if (checkShouldBlock()) {
        setIsBlocking(true);
        showConfirmation(() => {
          navigation.goBack();
        });
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => subscription.remove();
  }, [checkShouldBlock, showConfirmation, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!checkShouldBlock()) {
        return;
      }

      e.preventDefault();
      setIsBlocking(true);

      pendingNavigationRef.current = () => {
        navigation.dispatch(e.data.action);
      };

      showConfirmation(() => {
        navigation.dispatch(e.data.action);
      });
    });

    return unsubscribe;
  }, [navigation, checkShouldBlock, showConfirmation]);

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const resetGuard = useCallback(() => {
    setHasUnsavedChanges(false);
    setIsBlocking(false);
    pendingNavigationRef.current = null;
  }, []);

  const allowNavigation = useCallback(() => {
    setHasUnsavedChanges(false);
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  }, []);

  const blockNavigation = useCallback(() => {
    setIsBlocking(false);
    pendingNavigationRef.current = null;
    onCancel?.();
  }, [onCancel]);

  const navigateWithConfirmation = useCallback((
    action: () => void,
    skipConfirmation = false
  ) => {
    if (skipConfirmation || !checkShouldBlock()) {
      setHasUnsavedChanges(false);
      action();
      return;
    }

    showConfirmation(action);
  }, [checkShouldBlock, showConfirmation]);

  return {
    hasUnsavedChanges,
    isBlocking,
    markAsChanged,
    markAsSaved,
    resetGuard,
    allowNavigation,
    blockNavigation,
    navigateWithConfirmation,
    setHasUnsavedChanges,
  };
}

export function useFormGuard<T extends Record<string, any>>(
  initialValues: T,
  currentValues: T,
  config?: Omit<NavigationGuardConfig, "shouldBlock">
) {
  const hasChanges = useCallback((): boolean => {
    return JSON.stringify(initialValues) !== JSON.stringify(currentValues);
  }, [initialValues, currentValues]);

  return useNavigationGuard({
    ...config,
    shouldBlock: hasChanges,
  });
}

export interface RouteGuardConfig {
  requiredParams?: string[];
  validator?: (params: any) => boolean;
  redirectTo?: string;
  onInvalid?: () => void;
}

export function useRouteGuard(config: RouteGuardConfig) {
  const route = useRoute();
  const navigation = useNavigation();
  const [isValid, setIsValid] = useState(true);
  const params = route.params as Record<string, any> | undefined;

  useEffect(() => {
    let valid = true;

    if (config.requiredParams) {
      valid = config.requiredParams.every((param) => {
        return params && params[param] !== undefined && params[param] !== null;
      });
    }

    if (valid && config.validator && params) {
      valid = config.validator(params);
    }

    setIsValid(valid);

    if (!valid) {
      config.onInvalid?.();
      if (config.redirectTo) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: config.redirectTo }],
          })
        );
      } else {
        navigation.goBack();
      }
    }
  }, [params, config, navigation]);

  return { isValid, params };
}

export function useAuthGuard(
  isAuthenticated: boolean,
  redirectTo = "Login"
) {
  const navigation = useNavigation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: redirectTo }],
        })
      );
    }
  }, [isAuthenticated, navigation, redirectTo]);

  return { isAuthenticated };
}
