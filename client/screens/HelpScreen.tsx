import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "How do I add a new medicine?",
      answer: "Go to Inventory tab and tap the + button at the bottom. Fill in the medicine details and save. You can also scan a barcode to quickly add a new medicine.",
    },
    {
      question: "How do I create a bill?",
      answer: "Go to the Billing tab, scan barcodes or search for medicines to add them to the cart. Adjust quantities, add customer details if needed, and tap Create Invoice.",
    },
    {
      question: "How do I track expiring medicines?",
      answer: "Go to Settings > Expiry Management or tap on the 'Expiring Soon' card on the Dashboard. You can filter by 7, 30, 60, or 90 days.",
    },
    {
      question: "How do I add stock for an existing medicine?",
      answer: "Go to Inventory, find the medicine, tap on it to view details, then tap 'Add Batch' to add new stock with batch number, expiry date, and quantities.",
    },
    {
      question: "How do I view my sales reports?",
      answer: "Go to the Reports tab to see daily, weekly, and monthly sales summaries. You can also view recent transactions and export reports.",
    },
    {
      question: "How do I add a new supplier?",
      answer: "Go to Settings > Suppliers or from the Dashboard quick actions. Tap the + button to add a new supplier with their contact details.",
    },
    {
      question: "How do I adjust stock for damaged/expired items?",
      answer: "Go to the medicine's detail page, find the batch, and tap on it to access Stock Adjustment. Select the reason (damage, expired, etc.) and quantity.",
    },
    {
      question: "Can I add multiple users?",
      answer: "Yes! The owner can add users from Settings > User Management. Each user can have a role: Owner, Manager, or Cashier with different permissions.",
    },
    {
      question: "Is my data safe?",
      answer: "Yes, all data is stored securely in the cloud and backed up regularly. Your login credentials are encrypted for security.",
    },
  ];

  const handleContact = () => {
    Linking.openURL("mailto:roshan8800jp@gmail.com?subject=Binayak%20Pharmacy%20Help");
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={[styles.contactCard, { backgroundColor: theme.primary }]}>
          <Feather name="headphones" size={24} color="#FFFFFF" />
          <View style={styles.contactContent}>
            <ThemedText style={styles.contactTitle}>Need Help?</ThemedText>
            <ThemedText style={styles.contactSubtitle}>
              Contact our support team
            </ThemedText>
          </View>
          <Pressable style={styles.contactButton} onPress={handleContact}>
            <Feather name="mail" size={20} color={theme.primary} />
          </Pressable>
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>
          Frequently Asked Questions
        </ThemedText>

        {faqs.map((faq, index) => (
          <Pressable
            key={index}
            style={[styles.faqItem, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <View style={styles.faqHeader}>
              <ThemedText style={styles.faqQuestion}>{faq.question}</ThemedText>
              <Feather
                name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </View>
            {expandedIndex === index ? (
              <ThemedText style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                {faq.answer}
              </ThemedText>
            ) : null}
          </Pressable>
        ))}

        <View style={[styles.tipsCard, { backgroundColor: theme.accent + "10" }]}>
          <ThemedText type="h4" style={{ color: theme.accent }}>Quick Tips</ThemedText>
          <View style={styles.tipsList}>
            {[
              "Use barcode scanning for faster billing",
              "Set reorder levels to get low stock alerts",
              "Check expiry management weekly",
              "Create user accounts for staff members",
              "Review sales reports daily",
            ].map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Feather name="check" size={16} color={theme.accent} />
                <ThemedText style={styles.tipText}>{tip}</ThemedText>
              </View>
            ))}
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
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  contactSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
  },
  contactButton: {
    backgroundColor: "#FFFFFF",
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  faqItem: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontWeight: "600",
    fontSize: 14,
  },
  faqAnswer: {
    marginTop: Spacing.md,
    fontSize: 14,
    lineHeight: 20,
  },
  tipsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  tipsList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
  },
});
