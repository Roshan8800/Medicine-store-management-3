import React, { useState, useRef } from "react";
import { View, StyleSheet, Dimensions, Pressable, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PagerView from "react-native-pager-view";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width } = Dimensions.get("window");

const ONBOARDING_SLIDES = [
  {
    icon: "package" as const,
    title: "Inventory Management",
    description: "Track medicines, batches, and expiry dates. Get alerts when stock is low or medicines are about to expire.",
  },
  {
    icon: "shopping-cart" as const,
    title: "Easy Billing",
    description: "Create invoices quickly with barcode scanning. Apply discounts and manage customer accounts effortlessly.",
  },
  {
    icon: "trending-up" as const,
    title: "Smart Analytics",
    description: "AI-powered insights help you understand sales trends, predict demand, and optimize your inventory.",
  },
  {
    icon: "zap" as const,
    title: "AI Assistant",
    description: "Get intelligent suggestions, check drug interactions, and analyze prescriptions with our built-in AI features.",
  },
  {
    icon: "cloud" as const,
    title: "Cloud Backup",
    description: "Your data is automatically backed up to the cloud. Access it from anywhere, anytime, on any device.",
  },
];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentPage < ONBOARDING_SLIDES.length - 1) {
      pagerRef.current?.setPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("onboarding_completed", "true");
    navigation.goBack();
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem("onboarding_completed", "true");
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };

  const handlePageChange = (e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  };

  const isLastSlide = currentPage === ONBOARDING_SLIDES.length - 1;

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          {!isLastSlide && (
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <ThemedText style={{ color: theme.textSecondary }}>Skip</ThemedText>
            </Pressable>
          )}
        </View>

        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={handlePageChange}
        >
          {ONBOARDING_SLIDES.map((slide, index) => (
            <View key={index} style={styles.slide}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + "15" }]}>
                <Feather name={slide.icon} size={56} color={theme.primary} />
              </View>
              <ThemedText type="h2" style={styles.slideTitle}>{slide.title}</ThemedText>
              <ThemedText style={[styles.slideDescription, { color: theme.textSecondary }]}>
                {slide.description}
              </ThemedText>
            </View>
          ))}
        </PagerView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <View style={styles.pagination}>
            {ONBOARDING_SLIDES.map((_, index) => (
              <Pressable
                key={index}
                onPress={() => pagerRef.current?.setPage(index)}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentPage ? theme.primary : theme.divider,
                    width: index === currentPage ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <Button onPress={handleNext} style={styles.nextButton}>
            {isLastSlide ? "Get Started" : "Next"}
          </Button>
        </View>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
  },
  skipButton: {
    padding: Spacing.md,
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  slideTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  slideDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: "100%",
  },
});
