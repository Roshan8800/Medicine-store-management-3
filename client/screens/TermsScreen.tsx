import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const TERMS_SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing and using the Binayak Pharmacy application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application."
  },
  {
    title: "2. Use License",
    content: "Permission is granted to use this application for personal and commercial pharmacy management purposes. This license does not include the right to modify, distribute, or create derivative works of the application."
  },
  {
    title: "3. User Accounts",
    content: "You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access to your account. Each user must have their own account."
  },
  {
    title: "4. Data Privacy",
    content: "We collect and process data necessary for pharmacy operations. Patient and medicine data is stored securely and in compliance with applicable healthcare regulations. See our Privacy Policy for more details."
  },
  {
    title: "5. Acceptable Use",
    content: "You agree to use the application only for lawful pharmacy management activities. Misuse of the application, including unauthorized access attempts or data manipulation, is strictly prohibited."
  },
  {
    title: "6. Data Accuracy",
    content: "You are responsible for the accuracy of all data entered into the system, including medicine information, pricing, and patient records. Regular verification of data is recommended."
  },
  {
    title: "7. Service Availability",
    content: "We strive to maintain high availability but do not guarantee uninterrupted access. Scheduled maintenance and updates may temporarily affect service availability."
  },
  {
    title: "8. Liability Limitations",
    content: "The application is provided 'as is' without warranties. We are not liable for any damages arising from the use of this application, including but not limited to data loss or business interruption."
  },
  {
    title: "9. Updates and Changes",
    content: "We reserve the right to update these terms at any time. Continued use of the application after changes constitutes acceptance of the new terms."
  },
  {
    title: "10. Contact Information",
    content: "For questions about these Terms of Service, please contact us at roshan8800jp@gmail.com."
  }
];

export default function TermsScreen() {
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
          <ThemedText type="h4">Terms of Service</ThemedText>
          <ThemedText style={[styles.lastUpdated, { color: theme.textSecondary }]}>
            Last updated: December 2024
          </ThemedText>
        </View>

        {TERMS_SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            <ThemedText style={[styles.sectionContent, { color: theme.textSecondary }]}>
              {section.content}
            </ThemedText>
          </View>
        ))}

        <View style={[styles.footer, { borderTopColor: theme.divider }]}>
          <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
            Binayak Pharmacy Management System
          </ThemedText>
          <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
            Version 2.0.0
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
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  lastUpdated: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: Spacing.xl,
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
});
