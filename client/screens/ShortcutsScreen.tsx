import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ShortcutCategory {
  title: string;
  shortcuts: {
    icon: keyof typeof Feather.glyphMap;
    action: string;
    gesture: string;
    description: string;
  }[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: "Navigation",
    shortcuts: [
      { icon: "search", action: "Quick Search", gesture: "Swipe down on home", description: "Instantly search medicines" },
      { icon: "shopping-cart", action: "Quick Sale", gesture: "Double tap home", description: "Start a new sale quickly" },
      { icon: "camera", action: "Scan Barcode", gesture: "Long press FAB", description: "Open barcode scanner" },
    ],
  },
  {
    title: "List Actions",
    shortcuts: [
      { icon: "edit-2", action: "Edit Item", gesture: "Swipe right", description: "Edit the selected item" },
      { icon: "trash-2", action: "Delete Item", gesture: "Swipe left", description: "Delete with confirmation" },
      { icon: "copy", action: "Duplicate", gesture: "Long press", description: "Create a copy of the item" },
      { icon: "refresh-cw", action: "Refresh List", gesture: "Pull down", description: "Reload the current list" },
    ],
  },
  {
    title: "Invoice Actions",
    shortcuts: [
      { icon: "plus", action: "Add Item", gesture: "Tap + button", description: "Add item to invoice" },
      { icon: "percent", action: "Apply Discount", gesture: "Swipe up on total", description: "Open discount dialog" },
      { icon: "printer", action: "Print Receipt", gesture: "Long press total", description: "Print the invoice" },
      { icon: "share-2", action: "Share Invoice", gesture: "Swipe right on receipt", description: "Share via apps" },
    ],
  },
  {
    title: "Quick Actions",
    shortcuts: [
      { icon: "refresh-cw", action: "Shake to Refresh", gesture: "Shake device", description: "Refresh current screen" },
      { icon: "zoom-in", action: "Zoom Charts", gesture: "Pinch to zoom", description: "Zoom analytics charts" },
      { icon: "move", action: "Reorder Items", gesture: "Drag and drop", description: "Reorder list items" },
      { icon: "mic", action: "Voice Search", gesture: "Tap mic icon", description: "Search by voice" },
    ],
  },
  {
    title: "Gestures",
    shortcuts: [
      { icon: "chevrons-left", action: "Go Back", gesture: "Swipe from edge", description: "Navigate to previous screen" },
      { icon: "x", action: "Close Modal", gesture: "Swipe down", description: "Dismiss the current modal" },
      { icon: "maximize-2", action: "Full Screen", gesture: "Double tap image", description: "View image full screen" },
      { icon: "bell", action: "Quick Actions", gesture: "3D Touch/Long press", description: "Access quick actions" },
    ],
  },
];

export default function ShortcutsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: theme.primary + "10" }]}>
          <Feather name="zap" size={24} color={theme.primary} />
          <ThemedText type="h4">Gestures & Shortcuts</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Use these gestures to navigate faster
          </ThemedText>
        </View>

        {SHORTCUT_CATEGORIES.map((category, categoryIndex) => (
          <View key={categoryIndex} style={styles.category}>
            <ThemedText style={[styles.categoryTitle, { color: theme.textSecondary }]}>
              {category.title.toUpperCase()}
            </ThemedText>
            <View style={[styles.categoryContent, { backgroundColor: theme.backgroundDefault }]}>
              {category.shortcuts.map((shortcut, index) => (
                <View
                  key={index}
                  style={[
                    styles.shortcutItem,
                    index < category.shortcuts.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.divider,
                    },
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.primary + "15" }]}>
                    <Feather name={shortcut.icon} size={18} color={theme.primary} />
                  </View>
                  <View style={styles.shortcutInfo}>
                    <ThemedText style={styles.shortcutAction}>{shortcut.action}</ThemedText>
                    <ThemedText style={[styles.shortcutDescription, { color: theme.textSecondary }]}>
                      {shortcut.description}
                    </ThemedText>
                  </View>
                  <View style={[styles.gestureBadge, { backgroundColor: theme.divider }]}>
                    <ThemedText style={[styles.gestureText, { color: theme.textSecondary }]}>
                      {shortcut.gesture}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={[styles.tipCard, { backgroundColor: theme.success + "10" }]}>
          <Feather name="info" size={18} color={theme.success} />
          <ThemedText style={[styles.tipText, { color: theme.textSecondary }]}>
            Practice these gestures to become a power user and save time on daily tasks.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  category: {
    marginBottom: Spacing.xl,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  categoryContent: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  shortcutItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  shortcutInfo: {
    flex: 1,
  },
  shortcutAction: {
    fontSize: 14,
    fontWeight: "500",
  },
  shortcutDescription: {
    fontSize: 11,
    marginTop: 2,
  },
  gestureBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  gestureText: {
    fontSize: 10,
    fontWeight: "500",
  },
  tipCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    alignItems: "center",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
