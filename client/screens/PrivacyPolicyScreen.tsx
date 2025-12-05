import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const PRIVACY_SECTIONS = [
  {
    icon: "database" as const,
    title: "Information We Collect",
    items: [
      "User account information (name, email, username)",
      "Medicine inventory and batch data",
      "Sales and transaction records",
      "Customer information for invoicing",
      "Device information for analytics"
    ]
  },
  {
    icon: "shield" as const,
    title: "How We Protect Your Data",
    items: [
      "End-to-end encryption for sensitive data",
      "Secure cloud storage with Firebase",
      "Regular security audits and updates",
      "Role-based access control",
      "Automatic session expiration"
    ]
  },
  {
    icon: "share-2" as const,
    title: "Data Sharing",
    items: [
      "We do not sell your data to third parties",
      "Data may be shared with cloud providers for storage",
      "Anonymized analytics for app improvement",
      "Legal compliance when required by law"
    ]
  },
  {
    icon: "user" as const,
    title: "Your Rights",
    items: [
      "Access your stored personal data",
      "Request data correction or deletion",
      "Export your data in standard formats",
      "Opt-out of non-essential data collection",
      "Withdraw consent at any time"
    ]
  },
  {
    icon: "clock" as const,
    title: "Data Retention",
    items: [
      "Active account data retained while in use",
      "Transaction records kept for legal compliance",
      "Deleted data removed within 30 days",
      "Backup data retained for 90 days"
    ]
  }
];

export default function PrivacyPolicyScreen() {
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
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="lock" size={24} color={theme.primary} />
          </View>
          <ThemedText type="h4">Privacy Policy</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your privacy is important to us. This policy explains how we handle your data.
          </ThemedText>
          <ThemedText style={[styles.lastUpdated, { color: theme.textDisabled }]}>
            Last updated: December 2024
          </ThemedText>
        </View>

        {PRIVACY_SECTIONS.map((section, index) => (
          <View key={index} style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: theme.primary + "15" }]}>
                <Feather name={section.icon} size={18} color={theme.primary} />
              </View>
              <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            </View>
            <View style={styles.itemsList}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.itemRow}>
                  <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
                  <ThemedText style={[styles.itemText, { color: theme.textSecondary }]}>
                    {item}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={[styles.contactCard, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="mail" size={20} color={theme.primary} />
          <View style={styles.contactText}>
            <ThemedText style={styles.contactTitle}>Questions about privacy?</ThemedText>
            <ThemedText style={[styles.contactEmail, { color: theme.primary }]}>
              roshan8800jp@gmail.com
            </ThemedText>
          </View>
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
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  lastUpdated: {
    fontSize: 11,
    marginTop: Spacing.md,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  itemsList: {
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  contactEmail: {
    fontSize: 13,
    marginTop: 2,
  },
});
