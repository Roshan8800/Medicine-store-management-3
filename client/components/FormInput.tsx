import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface FormInputProps extends RNTextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  showCharCount?: boolean;
  maxLength?: number;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  size?: "small" | "medium" | "large";
}

export function FormInput({
  label,
  error,
  hint,
  required,
  leftIcon,
  rightIcon,
  onRightIconPress,
  showCharCount,
  maxLength,
  prefix,
  suffix,
  disabled = false,
  loading = false,
  success = false,
  size = "medium",
  value,
  onChangeText,
  onFocus,
  onBlur,
  secureTextEntry,
  style,
  ...props
}: FormInputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeAnim]);

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<RNTextInputProps["onFocus"]>>[0]) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<RNTextInputProps["onBlur"]>>[0]) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const getBorderColor = () => {
    if (disabled) return theme.divider;
    if (error) return theme.error;
    if (success) return theme.success;
    if (isFocused) return theme.primary;
    return theme.border;
  };

  const getInputHeight = () => {
    switch (size) {
      case "small":
        return 36;
      case "large":
        return 52;
      default:
        return 44;
    }
  };

  const charCount = typeof value === "string" ? value.length : 0;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}
    >
      {label && (
        <View style={styles.labelRow}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            {label}
          </ThemedText>
          {required && (
            <ThemedText style={[styles.required, { color: theme.error }]}>*</ThemedText>
          )}
        </View>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: disabled ? theme.backgroundRoot : theme.backgroundDefault,
            borderColor: getBorderColor(),
            height: getInputHeight(),
          },
        ]}
      >
        {leftIcon && (
          <Feather
            name={leftIcon}
            size={18}
            color={isFocused ? theme.primary : theme.textSecondary}
            style={styles.leftIcon}
          />
        )}

        {prefix && (
          <ThemedText style={[styles.affix, { color: theme.textSecondary }]}>
            {prefix}
          </ThemedText>
        )}

        <RNTextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: disabled ? theme.textDisabled : theme.text,
              fontSize: size === "small" ? 14 : size === "large" ? 17 : 15,
            },
            style,
          ]}
          placeholderTextColor={theme.textDisabled}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled && !loading}
          secureTextEntry={secureTextEntry && !showPassword}
          maxLength={maxLength}
          {...props}
        />

        {suffix && (
          <ThemedText style={[styles.affix, { color: theme.textSecondary }]}>
            {suffix}
          </ThemedText>
        )}

        {loading && (
          <View style={styles.rightIcon}>
            <Feather name="loader" size={18} color={theme.textSecondary} />
          </View>
        )}

        {success && !loading && (
          <View style={styles.rightIcon}>
            <Feather name="check-circle" size={18} color={theme.success} />
          </View>
        )}

        {secureTextEntry && !loading && (
          <Pressable onPress={togglePasswordVisibility} style={styles.rightIcon}>
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={18}
              color={theme.textSecondary}
            />
          </Pressable>
        )}

        {rightIcon && !loading && !secureTextEntry && (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            <Feather name={rightIcon} size={18} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={styles.bottomRow}>
        {error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={12} color={theme.error} />
            <ThemedText style={[styles.errorText, { color: theme.error }]}>
              {error}
            </ThemedText>
          </View>
        ) : hint ? (
          <ThemedText style={[styles.hint, { color: theme.textDisabled }]}>
            {hint}
          </ThemedText>
        ) : (
          <View />
        )}

        {showCharCount && maxLength && (
          <ThemedText
            style={[
              styles.charCount,
              { color: charCount >= maxLength ? theme.error : theme.textDisabled },
            ]}
          >
            {charCount}/{maxLength}
          </ThemedText>
        )}
      </View>
    </Animated.View>
  );
}

export function PasswordInput(props: Omit<FormInputProps, "secureTextEntry">) {
  return <FormInput {...props} secureTextEntry leftIcon="lock" />;
}

export function EmailInput(props: Omit<FormInputProps, "keyboardType" | "autoCapitalize" | "autoComplete">) {
  return (
    <FormInput
      {...props}
      keyboardType="email-address"
      autoCapitalize="none"
      autoComplete="email"
      leftIcon="mail"
    />
  );
}

export function PhoneInput(props: Omit<FormInputProps, "keyboardType">) {
  return <FormInput {...props} keyboardType="phone-pad" leftIcon="phone" />;
}

export function NumberInput(props: Omit<FormInputProps, "keyboardType">) {
  return <FormInput {...props} keyboardType="decimal-pad" />;
}

export function TextAreaInput({
  numberOfLines = 4,
  ...props
}: FormInputProps & { numberOfLines?: number }) {
  return (
    <FormInput
      {...props}
      multiline
      numberOfLines={numberOfLines}
      style={[
        { height: numberOfLines * 24, textAlignVertical: "top", paddingTop: Spacing.md },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  required: {
    marginLeft: 2,
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  affix: {
    fontSize: 14,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
    minHeight: 18,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  errorText: {
    fontSize: 12,
  },
  hint: {
    fontSize: 12,
  },
  charCount: {
    fontSize: 11,
  },
});
