import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean;
  icon?: keyof typeof Feather.glyphMap;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: "single" | "multi" | "range";
  options: FilterOption[];
}

export interface SortOption {
  id: string;
  label: string;
  field: string;
  direction: "asc" | "desc";
  icon?: keyof typeof Feather.glyphMap;
}

interface FilterSortProps {
  filters: FilterGroup[];
  sortOptions: SortOption[];
  activeFilters: Record<string, string | string[]>;
  activeSort: string | null;
  onFilterChange: (groupId: string, value: string | string[]) => void;
  onSortChange: (sortId: string | null) => void;
  onClearFilters?: () => void;
  onApply?: () => void;
}

export function FilterSort({
  filters,
  sortOptions,
  activeFilters,
  activeSort,
  onFilterChange,
  onSortChange,
  onClearFilters,
  onApply,
}: FilterSortProps) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"filter" | "sort">("filter");
  const slideAnim = useRef(new Animated.Value(0)).current;

  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).reduce((count, value) => {
      if (Array.isArray(value)) {
        return count + value.length;
      }
      return value ? count + 1 : count;
    }, 0);
  }, [activeFilters]);

  const openModal = useCallback(() => {
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [slideAnim]);

  const closeModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  }, [slideAnim]);

  const handleFilterToggle = useCallback(
    (groupId: string, optionValue: string, isMulti: boolean) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (isMulti) {
        const currentValues = (activeFilters[groupId] as string[]) || [];
        const newValues = currentValues.includes(optionValue)
          ? currentValues.filter((v) => v !== optionValue)
          : [...currentValues, optionValue];
        onFilterChange(groupId, newValues);
      } else {
        const currentValue = activeFilters[groupId] as string;
        onFilterChange(groupId, currentValue === optionValue ? "" : optionValue);
      }
    },
    [activeFilters, onFilterChange]
  );

  const handleSortSelect = useCallback(
    (sortId: string) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onSortChange(activeSort === sortId ? null : sortId);
    },
    [activeSort, onSortChange]
  );

  const handleClear = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onClearFilters?.();
    onSortChange(null);
  }, [onClearFilters, onSortChange]);

  const handleApply = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onApply?.();
    closeModal();
  }, [onApply, closeModal]);

  const activeSortOption = sortOptions.find((s) => s.id === activeSort);

  return (
    <>
      <View style={styles.container}>
        <Pressable
          style={[
            styles.button,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            activeFilterCount > 0 && { borderColor: theme.primary },
          ]}
          onPress={openModal}
        >
          <Feather name="filter" size={16} color={activeFilterCount > 0 ? theme.primary : theme.text} />
          <ThemedText style={styles.buttonText}>Filter</ThemedText>
          {activeFilterCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.badgeText}>{activeFilterCount}</ThemedText>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.button,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            activeSort && { borderColor: theme.primary },
          ]}
          onPress={openModal}
        >
          <Feather name="arrow-down" size={16} color={activeSort ? theme.primary : theme.text} />
          <ThemedText style={styles.buttonText}>
            {activeSortOption?.label || "Sort"}
          </ThemedText>
        </Pressable>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.backgroundElevated,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [400, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Filter & Sort</ThemedText>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.tabs}>
              <Pressable
                style={[
                  styles.tab,
                  activeTab === "filter" && { borderBottomColor: theme.primary },
                ]}
                onPress={() => setActiveTab("filter")}
              >
                <ThemedText
                  style={[
                    styles.tabText,
                    { color: activeTab === "filter" ? theme.primary : theme.textSecondary },
                  ]}
                >
                  Filters
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.tab,
                  activeTab === "sort" && { borderBottomColor: theme.primary },
                ]}
                onPress={() => setActiveTab("sort")}
              >
                <ThemedText
                  style={[
                    styles.tabText,
                    { color: activeTab === "sort" ? theme.primary : theme.textSecondary },
                  ]}
                >
                  Sort
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {activeTab === "filter" ? (
                filters.map((group) => (
                  <View key={group.id} style={styles.filterGroup}>
                    <ThemedText style={[styles.groupLabel, { color: theme.textSecondary }]}>
                      {group.label}
                    </ThemedText>
                    <View style={styles.optionsContainer}>
                      {group.options.map((option) => {
                        const isActive = group.type === "multi"
                          ? (activeFilters[group.id] as string[] || []).includes(String(option.value))
                          : activeFilters[group.id] === String(option.value);

                        return (
                          <Pressable
                            key={option.id}
                            style={[
                              styles.optionChip,
                              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                              isActive && { backgroundColor: theme.primary + "20", borderColor: theme.primary },
                            ]}
                            onPress={() =>
                              handleFilterToggle(group.id, String(option.value), group.type === "multi")
                            }
                          >
                            {option.icon && (
                              <Feather
                                name={option.icon}
                                size={14}
                                color={isActive ? theme.primary : theme.text}
                              />
                            )}
                            <ThemedText
                              style={[
                                styles.optionText,
                                isActive && { color: theme.primary },
                              ]}
                            >
                              {option.label}
                            </ThemedText>
                            {option.count !== undefined && (
                              <ThemedText style={[styles.optionCount, { color: theme.textDisabled }]}>
                                ({option.count})
                              </ThemedText>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.sortOptions}>
                  {sortOptions.map((option) => (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.sortOption,
                        { borderBottomColor: theme.divider },
                        activeSort === option.id && { backgroundColor: theme.primary + "10" },
                      ]}
                      onPress={() => handleSortSelect(option.id)}
                    >
                      <View style={styles.sortOptionContent}>
                        {option.icon && (
                          <Feather
                            name={option.icon}
                            size={18}
                            color={activeSort === option.id ? theme.primary : theme.textSecondary}
                          />
                        )}
                        <ThemedText
                          style={[
                            styles.sortOptionText,
                            activeSort === option.id && { color: theme.primary, fontWeight: "600" },
                          ]}
                        >
                          {option.label}
                        </ThemedText>
                      </View>
                      {activeSort === option.id && (
                        <Feather name="check" size={20} color={theme.primary} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.divider }]}>
              <Button variant="outline" onPress={handleClear} style={styles.footerButton}>
                Clear All
              </Button>
              <Button onPress={handleApply} style={styles.footerButton}>
                Apply
              </Button>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

export function QuickFilters({
  options,
  activeValue,
  onChange,
}: {
  options: FilterOption[];
  activeValue: string;
  onChange: (value: string) => void;
}) {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickFiltersContainer}
    >
      {options.map((option) => {
        const isActive = activeValue === String(option.value);
        return (
          <Pressable
            key={option.id}
            style={[
              styles.quickFilterChip,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onChange(isActive ? "" : String(option.value));
            }}
          >
            {option.icon && (
              <Feather
                name={option.icon}
                size={14}
                color={isActive ? "#FFFFFF" : theme.text}
              />
            )}
            <ThemedText
              style={[
                styles.quickFilterText,
                isActive && { color: "#FFFFFF" },
              ]}
            >
              {option.label}
            </ThemedText>
            {option.count !== undefined && (
              <View
                style={[
                  styles.quickFilterCount,
                  { backgroundColor: isActive ? "rgba(255,255,255,0.2)" : theme.backgroundRoot },
                ]}
              >
                <ThemedText
                  style={[
                    styles.quickFilterCountText,
                    { color: isActive ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  {option.count}
                </ThemedText>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  tab: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  filterGroup: {
    marginBottom: Spacing.xl,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  optionCount: {
    fontSize: 11,
  },
  sortOptions: {},
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  sortOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sortOptionText: {
    fontSize: 15,
  },
  modalFooter: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
  quickFiltersContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  quickFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
    marginRight: Spacing.sm,
  },
  quickFilterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  quickFilterCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  quickFilterCountText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
