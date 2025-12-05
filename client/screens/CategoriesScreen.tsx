import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Platform, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, withSpring, FadeInRight, FadeOutLeft } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useSwipeGesture, useLongPressGesture } from "@/hooks/useGestures";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";

interface Category {
  id: string;
  name: string;
  description?: string;
  medicineCount?: number;
}

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: categories = [], isLoading, refetch } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      resetForm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string }) => {
      const response = await apiRequest("PATCH", `/api/categories/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      resetForm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setName("");
    setDescription("");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, name, description });
    } else {
      createMutation.mutate({ name, description });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setShowForm(true);
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(category.id) },
      ]
    );
  };

  const renderCategory = ({ item, index }: { item: Category; index: number }) => (
    <CategoryItem
      category={item}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item)}
      index={index}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        contentContainerStyle={[
          styles.list,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="folder" size={48} color={theme.textDisabled} />
            <ThemedText style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
              No categories yet
            </ThemedText>
          </View>
        }
      />

      {showForm ? (
        <Animated.View 
          entering={FadeInRight}
          exiting={FadeOutLeft}
          style={[styles.formOverlay, { backgroundColor: theme.overlay }]}
        >
          <KeyboardAwareScrollViewCompat>
            <Card style={[styles.form, { marginTop: headerHeight + Spacing.xl }]}>
              <ThemedText type="h4" style={styles.formTitle}>
                {editingCategory ? "Edit Category" : "Add Category"}
              </ThemedText>
              
              <TextInput
                label="Category Name"
                placeholder="e.g., Antibiotics"
                value={name}
                onChangeText={setName}
              />
              
              <TextInput
                label="Description"
                placeholder="Optional description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.formButtons}>
                <Button variant="secondary" onPress={resetForm} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button 
                  onPress={handleSubmit} 
                  loading={createMutation.isPending || updateMutation.isPending}
                  style={{ flex: 1 }}
                >
                  {editingCategory ? "Update" : "Add"}
                </Button>
              </View>
            </Card>
          </KeyboardAwareScrollViewCompat>
        </Animated.View>
      ) : null}

      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary, bottom: insets.bottom + Spacing.xl }]}
        onPress={() => setShowForm(true)}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </ThemedView>
  );
}

function CategoryItem({ 
  category, 
  onEdit, 
  onDelete,
  index 
}: { 
  category: Category; 
  onEdit: () => void; 
  onDelete: () => void;
  index: number;
}) {
  const { theme } = useTheme();
  
  const { gesture: swipeGesture, translateX } = useSwipeGesture({
    onSwipeLeft: onDelete,
    onSwipeRight: onEdit,
  });

  const { gesture: longPressGesture, scale } = useLongPressGesture({
    onLongPress: () => {
      Alert.alert(
        category.name,
        "What would you like to do?",
        [
          { text: "Edit", onPress: onEdit },
          { text: "Delete", style: "destructive", onPress: onDelete },
          { text: "Cancel", style: "cancel" },
        ]
      );
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 50)}>
      <GestureDetector gesture={longPressGesture}>
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={animatedStyle}>
            <Card style={styles.categoryCard}>
              <View style={styles.categoryInfo}>
                <View style={[styles.categoryIcon, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name="folder" size={20} color={theme.primary} />
                </View>
                <View style={styles.categoryText}>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    {category.name}
                  </ThemedText>
                  {category.description ? (
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {category.description}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
              <View style={styles.categoryActions}>
                {category.medicineCount !== undefined ? (
                  <View style={[styles.badge, { backgroundColor: theme.backgroundSecondary }]}>
                    <ThemedText type="caption">{category.medicineCount}</ThemedText>
                  </View>
                ) : null}
                <Pressable onPress={onEdit} style={styles.actionButton}>
                  <Feather name="edit-2" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        </GestureDetector>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing["5xl"],
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  categoryText: {
    flex: 1,
  },
  categoryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  formOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  form: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  formTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  formButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
});
