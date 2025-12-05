import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput as RNTextInput, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInDown, FadeInUp, FadeOut, useAnimatedStyle, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SearchResult {
  id: string;
  type: "medicine" | "customer" | "invoice" | "supplier";
  title: string;
  subtitle?: string;
  metadata?: string;
}

const recentSearches = [
  "Paracetamol",
  "Amoxicillin",
  "Blood pressure",
  "Vitamin D",
];

const searchCategories = [
  { key: "all", label: "All", icon: "search" },
  { key: "medicine", label: "Medicines", icon: "package" },
  { key: "customer", label: "Customers", icon: "users" },
  { key: "invoice", label: "Invoices", icon: "file-text" },
  { key: "supplier", label: "Suppliers", icon: "truck" },
] as const;

export default function SearchScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const inputRef = useRef<RNTextInput>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [showRecent, setShowRecent] = useState(true);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", query, category],
    enabled: query.length >= 2,
  });

  const mockResults: SearchResult[] = query.length >= 2 ? [
    { id: "1", type: "medicine", title: "Paracetamol 500mg", subtitle: "Tablet", metadata: "In Stock: 450" },
    { id: "2", type: "medicine", title: "Paracetamol 650mg", subtitle: "Tablet", metadata: "In Stock: 230" },
    { id: "3", type: "customer", title: "Param Shah", subtitle: "+91 98765 43210", metadata: "Last visit: 2 days ago" },
    { id: "4", type: "invoice", title: "INV-2024-0125", subtitle: "Rs 1,250", metadata: "Today" },
  ].filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase()) &&
    (category === "all" || r.type === category)
  ) : [];

  const displayResults = results.length > 0 ? results : mockResults;

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setShowRecent(text.length === 0);
  }, []);

  const handleResultPress = (result: SearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (result.type) {
      case "medicine":
        navigation.navigate("MedicineDetail", { medicineId: result.id });
        break;
      case "invoice":
        navigation.navigate("InvoiceDetail", { invoiceId: result.id });
        break;
    }
  };

  const handleRecentSearch = (search: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery(search);
    setShowRecent(false);
  };

  const getIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "medicine": return "package";
      case "customer": return "user";
      case "invoice": return "file-text";
      case "supplier": return "truck";
      default: return "search";
    }
  };

  const getColor = (type: string): string => {
    switch (type) {
      case "medicine": return "#4CAF50";
      case "customer": return "#2196F3";
      case "invoice": return "#FF9800";
      case "supplier": return "#9C27B0";
      default: return theme.primary;
    }
  };

  const renderResult = ({ item, index }: { item: SearchResult; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <Pressable onPress={() => handleResultPress(item)}>
        <Card style={styles.resultCard}>
          <View style={[styles.resultIcon, { backgroundColor: getColor(item.type) + "20" }]}>
            <Feather name={getIcon(item.type)} size={20} color={getColor(item.type)} />
          </View>
          <View style={styles.resultInfo}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {item.title}
            </ThemedText>
            {item.subtitle ? (
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.subtitle}
              </ThemedText>
            ) : null}
          </View>
          {item.metadata ? (
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {item.metadata}
            </ThemedText>
          ) : null}
        </Card>
      </Pressable>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchHeader, { paddingTop: insets.top + Spacing.md }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <RNTextInput
            ref={inputRef}
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search medicines, customers, invoices..."
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => handleSearch("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <ThemedText type="link">Cancel</ThemedText>
        </Pressable>
      </View>

      <View style={styles.categories}>
        {searchCategories.map((cat) => (
          <Pressable
            key={cat.key}
            onPress={() => setCategory(cat.key)}
            style={[
              styles.categoryChip,
              { 
                backgroundColor: category === cat.key ? theme.primary : theme.backgroundSecondary,
              },
            ]}
          >
            <Feather 
              name={cat.icon as any} 
              size={14} 
              color={category === cat.key ? "#FFFFFF" : theme.textSecondary} 
            />
            <ThemedText
              type="caption"
              style={{ 
                color: category === cat.key ? "#FFFFFF" : theme.textSecondary,
                marginLeft: 4,
              }}
            >
              {cat.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {showRecent && query.length === 0 ? (
        <Animated.View entering={FadeInUp} style={styles.recentContainer}>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
            Recent Searches
          </ThemedText>
          {recentSearches.map((search, index) => (
            <Animated.View key={search} entering={FadeInDown.delay(index * 50)}>
              <Pressable 
                onPress={() => handleRecentSearch(search)}
                style={styles.recentItem}
              >
                <Feather name="clock" size={16} color={theme.textSecondary} />
                <ThemedText style={{ marginLeft: Spacing.md, flex: 1 }}>{search}</ThemedText>
                <Feather name="arrow-up-left" size={16} color={theme.textSecondary} />
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>
      ) : (
        <FlatList
          data={displayResults}
          keyExtractor={(item) => item.id}
          renderItem={renderResult}
          contentContainerStyle={[
            styles.resultsList,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          ListEmptyComponent={
            query.length >= 2 ? (
              <Animated.View entering={FadeInUp} style={styles.empty}>
                <Feather name="search" size={48} color={theme.textDisabled} />
                <ThemedText style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
                  No results found for "{query}"
                </ThemedText>
              </Animated.View>
            ) : null
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
  },
  categories: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  recentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  resultsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: {
    flex: 1,
  },
  empty: {
    alignItems: "center",
    paddingTop: Spacing["5xl"],
  },
});
