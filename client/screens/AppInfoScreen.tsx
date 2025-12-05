import React from "react";
import { View, StyleSheet, ScrollView, Image, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const APP_VERSION = "2.0.0";
const BUILD_NUMBER = "2024120501";

const FEATURES = [
  { icon: "package", label: "Inventory Management" },
  { icon: "shopping-cart", label: "Quick Billing" },
  { icon: "bar-chart-2", label: "Sales Analytics" },
  { icon: "cpu", label: "AI-Powered Insights" },
  { icon: "cloud", label: "Cloud Backup" },
  { icon: "bell", label: "Smart Alerts" },
];

const TECH_STACK = [
  { name: "React Native", version: "0.76" },
  { name: "Expo SDK", version: "54" },
  { name: "TypeScript", version: "5.3" },
  { name: "PostgreSQL", version: "16" },
  { name: "Gemini AI", version: "2.5" },
];

export default function AppInfoScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const handleEmailPress = () => {
    Linking.openURL("mailto:roshan8800jp@gmail.com");
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
        <View style={styles.logoSection}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="h3">Binayak Pharmacy</ThemedText>
          <ThemedText style={[styles.tagline, { color: theme.textSecondary }]}>
            Smart Pharmacy Management
          </ThemedText>
          <View style={[styles.versionBadge, { backgroundColor: theme.primary + "15" }]}>
            <ThemedText style={[styles.versionText, { color: theme.primary }]}>
              Version {APP_VERSION}
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            FEATURES
          </ThemedText>
          <View style={[styles.featuresGrid, { backgroundColor: theme.backgroundDefault }]}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.primary + "15" }]}>
                  <Feather name={feature.icon as any} size={20} color={theme.primary} />
                </View>
                <ThemedText style={styles.featureLabel}>{feature.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            TECHNOLOGY
          </ThemedText>
          <View style={[styles.techList, { backgroundColor: theme.backgroundDefault }]}>
            {TECH_STACK.map((tech, index) => (
              <View
                key={index}
                style={[
                  styles.techItem,
                  index < TECH_STACK.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider },
                ]}
              >
                <ThemedText style={styles.techName}>{tech.name}</ThemedText>
                <ThemedText style={[styles.techVersion, { color: theme.textSecondary }]}>
                  v{tech.version}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            CREDITS
          </ThemedText>
          <View style={[styles.creditsCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.creditRow}>
              <ThemedText style={styles.creditLabel}>Store Owner</ThemedText>
              <ThemedText style={styles.creditValue}>Suman Sahu</ThemedText>
            </View>
            <View style={[styles.creditRow, { borderTopWidth: 1, borderTopColor: theme.divider }]}>
              <ThemedText style={styles.creditLabel}>Developer</ThemedText>
              <ThemedText style={styles.creditValue}>Roshan</ThemedText>
            </View>
            <Pressable
              style={[styles.creditRow, { borderTopWidth: 1, borderTopColor: theme.divider }]}
              onPress={handleEmailPress}
            >
              <ThemedText style={styles.creditLabel}>Contact</ThemedText>
              <ThemedText style={[styles.creditValue, { color: theme.primary }]}>
                roshan8800jp@gmail.com
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            BUILD INFO
          </ThemedText>
          <View style={[styles.buildInfo, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.buildRow}>
              <ThemedText style={[styles.buildLabel, { color: theme.textSecondary }]}>Build</ThemedText>
              <ThemedText style={styles.buildValue}>{BUILD_NUMBER}</ThemedText>
            </View>
            <View style={styles.buildRow}>
              <ThemedText style={[styles.buildLabel, { color: theme.textSecondary }]}>Environment</ThemedText>
              <ThemedText style={styles.buildValue}>Production</ThemedText>
            </View>
            <View style={styles.buildRow}>
              <ThemedText style={[styles.buildLabel, { color: theme.textSecondary }]}>Last Updated</ThemedText>
              <ThemedText style={styles.buildValue}>December 2024</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText style={[styles.copyright, { color: theme.textDisabled }]}>
            © 2024 Binayak Pharmacy. All rights reserved.
          </ThemedText>
          <ThemedText style={[styles.madeWith, { color: theme.textDisabled }]}>
            Made with ❤️ in India
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
  logoSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  tagline: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  versionBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  featureItem: {
    width: "30%",
    alignItems: "center",
    gap: Spacing.xs,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  featureLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  techList: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  techItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  techName: {
    fontSize: 14,
  },
  techVersion: {
    fontSize: 14,
  },
  creditsCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  creditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  creditLabel: {
    fontSize: 14,
  },
  creditValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  buildInfo: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  buildRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buildLabel: {
    fontSize: 13,
  },
  buildValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    paddingTop: Spacing.xl,
    gap: Spacing.xs,
  },
  copyright: {
    fontSize: 11,
  },
  madeWith: {
    fontSize: 11,
  },
});
