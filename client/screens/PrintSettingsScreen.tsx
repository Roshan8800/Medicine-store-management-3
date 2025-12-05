import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Switch, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface PrintSettings {
  paperSize: "A4" | "A5" | "thermal";
  showLogo: boolean;
  showFooter: boolean;
  footerText: string;
  fontSize: "small" | "medium" | "large";
  copies: number;
  autoPrint: boolean;
  thermalWidth: number;
}

const PAPER_SIZES = [
  { id: "A4", label: "A4 (210 x 297mm)", icon: "file" },
  { id: "A5", label: "A5 (148 x 210mm)", icon: "file-text" },
  { id: "thermal", label: "Thermal (80mm)", icon: "printer" },
];

const FONT_SIZES = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
];

export default function PrintSettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const toast = useToast();

  const [settings, setSettings] = useState<PrintSettings>({
    paperSize: "A4",
    showLogo: true,
    showFooter: true,
    footerText: "Thank you for choosing Binayak Pharmacy!",
    fontSize: "medium",
    copies: 1,
    autoPrint: false,
    thermalWidth: 80,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem("print_settings");
      if (saved) {
        setSettings({ ...settings, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error("Failed to load print settings:", error);
    }
  };

  const saveSettings = async (newSettings: Partial<PrintSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem("print_settings", JSON.stringify(updated));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Failed to save print settings:", error);
    }
  };

  const handleTestPrint = () => {
    toast.info("Test Print", "Sending test page to printer...");
    setTimeout(() => {
      toast.success("Success", "Test page sent successfully");
    }, 2000);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            PAPER SIZE
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: theme.backgroundDefault }]}>
            {PAPER_SIZES.map((size) => (
              <Pressable
                key={size.id}
                style={[
                  styles.optionItem,
                  { borderBottomColor: theme.divider },
                ]}
                onPress={() => saveSettings({ paperSize: size.id as any })}
              >
                <Feather name={size.icon as any} size={20} color={theme.textSecondary} />
                <ThemedText style={styles.optionLabel}>{size.label}</ThemedText>
                {settings.paperSize === size.id && (
                  <Feather name="check" size={20} color={theme.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            FONT SIZE
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: theme.backgroundDefault }]}>
            {FONT_SIZES.map((size) => (
              <Pressable
                key={size.id}
                style={[
                  styles.optionItem,
                  { borderBottomColor: theme.divider },
                ]}
                onPress={() => saveSettings({ fontSize: size.id as any })}
              >
                <ThemedText style={styles.optionLabel}>{size.label}</ThemedText>
                {settings.fontSize === size.id && (
                  <Feather name="check" size={20} color={theme.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            RECEIPT OPTIONS
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.toggleItem, { borderBottomColor: theme.divider }]}>
              <View>
                <ThemedText style={styles.toggleLabel}>Show Store Logo</ThemedText>
                <ThemedText style={[styles.toggleDescription, { color: theme.textSecondary }]}>
                  Display your pharmacy logo on receipts
                </ThemedText>
              </View>
              <Switch
                value={settings.showLogo}
                onValueChange={(value) => saveSettings({ showLogo: value })}
                trackColor={{ false: theme.divider, true: theme.primary + "80" }}
                thumbColor={settings.showLogo ? theme.primary : "#f4f3f4"}
              />
            </View>
            <View style={[styles.toggleItem, { borderBottomColor: theme.divider }]}>
              <View>
                <ThemedText style={styles.toggleLabel}>Show Footer</ThemedText>
                <ThemedText style={[styles.toggleDescription, { color: theme.textSecondary }]}>
                  Add a custom message at the bottom
                </ThemedText>
              </View>
              <Switch
                value={settings.showFooter}
                onValueChange={(value) => saveSettings({ showFooter: value })}
                trackColor={{ false: theme.divider, true: theme.primary + "80" }}
                thumbColor={settings.showFooter ? theme.primary : "#f4f3f4"}
              />
            </View>
            <View style={[styles.toggleItem, { borderBottomColor: theme.divider }]}>
              <View>
                <ThemedText style={styles.toggleLabel}>Auto Print</ThemedText>
                <ThemedText style={[styles.toggleDescription, { color: theme.textSecondary }]}>
                  Automatically print after creating invoice
                </ThemedText>
              </View>
              <Switch
                value={settings.autoPrint}
                onValueChange={(value) => saveSettings({ autoPrint: value })}
                trackColor={{ false: theme.divider, true: theme.primary + "80" }}
                thumbColor={settings.autoPrint ? theme.primary : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        {settings.showFooter && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              FOOTER TEXT
            </ThemedText>
            <View style={{ marginTop: Spacing.sm }}>
              <TextInput
                placeholder="Enter footer message"
                value={settings.footerText}
                onChangeText={(text) => saveSettings({ footerText: text })}
                multiline
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            COPIES
          </ThemedText>
          <View style={[styles.copiesRow, { backgroundColor: theme.backgroundDefault }]}>
            <Pressable
              style={[styles.copyButton, { backgroundColor: theme.divider }]}
              onPress={() => settings.copies > 1 && saveSettings({ copies: settings.copies - 1 })}
            >
              <Feather name="minus" size={20} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.copiesValue}>{settings.copies}</ThemedText>
            <Pressable
              style={[styles.copyButton, { backgroundColor: theme.divider }]}
              onPress={() => settings.copies < 10 && saveSettings({ copies: settings.copies + 1 })}
            >
              <Feather name="plus" size={20} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <Button onPress={handleTestPrint} variant="outline" style={styles.testButton}>
          Print Test Page
        </Button>
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: "uppercase",
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
  },
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  toggleDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  copiesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xl,
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  copiesValue: {
    fontSize: 24,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "center",
  },
  testButton: {
    marginTop: Spacing.md,
  },
});
