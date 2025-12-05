import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  Keyboard,
  Animated,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useDebounce } from "@/hooks/useDebounce";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SearchSuggestion {
  id: string;
  text: string;
  type?: string;
  icon?: keyof typeof Feather.glyphMap;
}

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  recentSearches?: string[];
  onRecentSelect?: (search: string) => void;
  onRecentClear?: () => void;
  debounceMs?: number;
  autoFocus?: boolean;
  showCancelButton?: boolean;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function SearchBar({
  placeholder = "Search...",
  value,
  onChangeText,
  onSearch,
  onClear,
  suggestions = [],
  onSuggestionSelect,
  recentSearches = [],
  onRecentSelect,
  onRecentClear,
  debounceMs = 300,
  autoFocus = false,
  showCancelButton = false,
  onCancel,
  isLoading = false,
  disabled = false,
}: SearchBarProps) {
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const cancelButtonWidth = useRef(new Animated.Value(0)).current;

  const debouncedValue = useDebounce(localValue, debounceMs);
  const displayValue = value !== undefined ? value : localValue;

  useEffect(() => {
    if (debouncedValue && onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  useEffect(() => {
    Animated.timing(cancelButtonWidth, {
      toValue: showCancelButton && isFocused ? 70 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, showCancelButton]);

  const handleChangeText = useCallback(
    (text: string) => {
      setLocalValue(text);
      onChangeText?.(text);
    },
    [onChangeText]
  );

  const handleClear = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLocalValue("");
    onChangeText?.("");
    onClear?.();
    inputRef.current?.focus();
  }, [onChangeText, onClear]);

  const handleCancel = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLocalValue("");
    onChangeText?.("");
    onCancel?.();
    Keyboard.dismiss();
    setIsFocused(false);
  }, [onChangeText, onCancel]);

  const handleSuggestionPress = useCallback(
    (suggestion: SearchSuggestion) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setLocalValue(suggestion.text);
      onChangeText?.(suggestion.text);
      onSuggestionSelect?.(suggestion);
      Keyboard.dismiss();
    },
    [onChangeText, onSuggestionSelect]
  );

  const handleRecentPress = useCallback(
    (search: string) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setLocalValue(search);
      onChangeText?.(search);
      onRecentSelect?.(search);
    },
    [onChangeText, onRecentSelect]
  );

  const handleSubmit = useCallback(() => {
    if (displayValue.trim() && onSearch) {
      onSearch(displayValue.trim());
      Keyboard.dismiss();
    }
  }, [displayValue, onSearch]);

  const showSuggestions = isFocused && suggestions.length > 0 && displayValue.length > 0;
  const showRecent = isFocused && recentSearches.length > 0 && displayValue.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: isFocused ? theme.primary : theme.border,
            },
          ]}
        >
          <Feather
            name="search"
            size={18}
            color={isFocused ? theme.primary : theme.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.text }]}
            placeholder={placeholder}
            placeholderTextColor={theme.textDisabled}
            value={displayValue}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSubmit}
            autoFocus={autoFocus}
            editable={!disabled}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isLoading && (
            <View style={styles.loadingIndicator}>
              <Feather name="loader" size={16} color={theme.textSecondary} />
            </View>
          )}
          {displayValue.length > 0 && !isLoading && (
            <Pressable onPress={handleClear} style={styles.clearButton}>
              <Feather name="x-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {showCancelButton && (
          <Animated.View style={[styles.cancelContainer, { width: cancelButtonWidth }]}>
            <Pressable onPress={handleCancel}>
              <ThemedText style={[styles.cancelText, { color: theme.primary }]}>
                Cancel
              </ThemedText>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {showSuggestions && (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.backgroundElevated }]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[styles.suggestionItem, { borderBottomColor: theme.divider }]}
                onPress={() => handleSuggestionPress(item)}
              >
                <Feather
                  name={item.icon || "search"}
                  size={16}
                  color={theme.textSecondary}
                />
                <ThemedText style={styles.suggestionText}>{item.text}</ThemedText>
                {item.type && (
                  <ThemedText style={[styles.suggestionType, { color: theme.textDisabled }]}>
                    {item.type}
                  </ThemedText>
                )}
                <Feather name="arrow-up-left" size={14} color={theme.textDisabled} />
              </Pressable>
            )}
          />
        </View>
      )}

      {showRecent && (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.backgroundElevated }]}>
          <View style={[styles.recentHeader, { borderBottomColor: theme.divider }]}>
            <ThemedText style={[styles.recentTitle, { color: theme.textSecondary }]}>
              Recent Searches
            </ThemedText>
            {onRecentClear && (
              <Pressable onPress={onRecentClear}>
                <ThemedText style={[styles.clearAllText, { color: theme.primary }]}>
                  Clear All
                </ThemedText>
              </Pressable>
            )}
          </View>
          <FlatList
            data={recentSearches.slice(0, 5)}
            keyExtractor={(item, index) => `${item}-${index}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[styles.suggestionItem, { borderBottomColor: theme.divider }]}
                onPress={() => handleRecentPress(item)}
              >
                <Feather name="clock" size={16} color={theme.textSecondary} />
                <ThemedText style={styles.suggestionText}>{item}</ThemedText>
                <Feather name="arrow-up-left" size={14} color={theme.textDisabled} />
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 100,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  loadingIndicator: {
    marginLeft: Spacing.xs,
  },
  cancelContainer: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500",
    paddingLeft: Spacing.md,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    borderRadius: BorderRadius.md,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
  },
  suggestionType: {
    fontSize: 12,
    marginRight: Spacing.sm,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
