import React from "react";
import { View, StyleSheet, ScrollView, Image, Linking, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function AboutScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const handleContact = () => {
    Linking.openURL("mailto:roshan8800jp@gmail.com?subject=Binayak%20Pharmacy%20Support");
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="h2">Binayak Pharmacy</ThemedText>
          <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
            Version 1.0.0
          </ThemedText>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.infoRow}>
            <Feather name="user" size={20} color={theme.primary} />
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Owner</ThemedText>
              <ThemedText style={styles.infoValue}>Suman Sahu</ThemedText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.infoRow}>
            <Feather name="code" size={20} color={theme.primary} />
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Created By</ThemedText>
              <ThemedText style={styles.infoValue}>Roshan</ThemedText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <Pressable style={styles.infoRow} onPress={handleContact}>
            <Feather name="mail" size={20} color={theme.primary} />
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Support</ThemedText>
              <ThemedText style={[styles.infoValue, { color: theme.primary }]}>
                roshan8800jp@gmail.com
              </ThemedText>
            </View>
            <Feather name="external-link" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Features</ThemedText>
        <View style={[styles.featuresList, { backgroundColor: theme.backgroundDefault }]}>
          {[
            { icon: "shopping-cart", title: "POS Billing", desc: "Fast and accurate billing system" },
            { icon: "package", title: "Inventory Management", desc: "Track stock and batches" },
            { icon: "camera", title: "Barcode Scanning", desc: "Quick product lookup" },
            { icon: "clock", title: "Expiry Tracking", desc: "Never miss expiring items" },
            { icon: "truck", title: "Supplier Management", desc: "Manage your suppliers" },
            { icon: "bar-chart-2", title: "Reports", desc: "Sales and inventory reports" },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name={feature.icon as any} size={20} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
                <ThemedText style={[styles.featureDesc, { color: theme.textSecondary }]}>
                  {feature.desc}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.footer, { backgroundColor: theme.primary + "10" }]}>
          <Feather name="heart" size={16} color={theme.primary} />
          <ThemedText style={[styles.footerText, { color: theme.primary }]}>
            Made with care for pharmacy management
          </ThemedText>
        </View>

        <ThemedText style={[styles.copyright, { color: theme.textDisabled }]}>
          2024 Binayak Pharmacy. All rights reserved.
        </ThemedText>
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
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  version: {
    marginTop: Spacing.xs,
    fontSize: 14,
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  featuresList: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: "600",
  },
  featureDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  footerText: {
    fontWeight: "500",
  },
  copyright: {
    textAlign: "center",
    fontSize: 12,
  },
});
