import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  speed: "Fast" | "Balanced" | "Powerful";
  capabilities: string[];
  recommended?: boolean;
}

const AI_MODELS: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    description: "Fast responses, great for quick queries and real-time suggestions.",
    speed: "Fast",
    capabilities: ["Chat", "Search", "Basic Analysis"],
    recommended: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Advanced reasoning for complex pharmacy insights and predictions.",
    speed: "Balanced",
    capabilities: ["Chat", "Search", "Deep Analysis", "Predictions"],
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Versatile model with strong language understanding and generation.",
    speed: "Balanced",
    capabilities: ["Chat", "Search", "Analysis", "Drug Info"],
  },
  {
    id: "claude-3",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "Excellent at detailed explanations and nuanced responses.",
    speed: "Balanced",
    capabilities: ["Chat", "Analysis", "Documentation"],
  },
  {
    id: "llama-3",
    name: "Llama 3.1",
    provider: "Meta",
    description: "Open-source model for local processing and privacy.",
    speed: "Fast",
    capabilities: ["Chat", "Basic Analysis"],
  },
];

const SPEED_COLORS = {
  Fast: "#10B981",
  Balanced: "#F59E0B",
  Powerful: "#8B5CF6",
};

export default function AIModelSettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const toast = useToast();

  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [autoSwitch, setAutoSwitch] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem("ai_settings");
      if (settings) {
        const parsed = JSON.parse(settings);
        setSelectedModel(parsed.selectedModel || "gemini-2.5-flash");
        setAutoSwitch(parsed.autoSwitch ?? true);
      }
    } catch (error) {
      console.error("Failed to load AI settings:", error);
    }
  };

  const saveSettings = async (model: string) => {
    try {
      const settings = { selectedModel: model, autoSwitch };
      await AsyncStorage.setItem("ai_settings", JSON.stringify(settings));
      await AsyncStorage.setItem("app_settings", JSON.stringify({ ...settings, selectedAIModel: model }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to save AI settings:", error);
    }
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    saveSettings(modelId);
    const model = AI_MODELS.find(m => m.id === modelId);
    toast.success("Model Changed", `Now using ${model?.name}`);
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
        <View style={[styles.infoCard, { backgroundColor: theme.primary + "10" }]}>
          <Feather name="cpu" size={20} color={theme.primary} />
          <View style={styles.infoText}>
            <ThemedText style={styles.infoTitle}>AI Model Selection</ThemedText>
            <ThemedText style={[styles.infoDescription, { color: theme.textSecondary }]}>
              Choose the AI model that best fits your needs. Different models have different strengths.
            </ThemedText>
          </View>
        </View>

        <View style={styles.modelList}>
          {AI_MODELS.map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <Pressable
                key={model.id}
                style={[
                  styles.modelCard,
                  { backgroundColor: theme.backgroundDefault },
                  isSelected && { borderColor: theme.primary, borderWidth: 2 },
                ]}
                onPress={() => handleSelectModel(model.id)}
              >
                <View style={styles.modelHeader}>
                  <View style={styles.modelTitleRow}>
                    <ThemedText style={styles.modelName}>{model.name}</ThemedText>
                    {model.recommended && (
                      <View style={[styles.recommendedBadge, { backgroundColor: theme.success + "20" }]}>
                        <ThemedText style={[styles.recommendedText, { color: theme.success }]}>
                          Recommended
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <View style={styles.providerRow}>
                    <ThemedText style={[styles.provider, { color: theme.textSecondary }]}>
                      {model.provider}
                    </ThemedText>
                    <View style={[styles.speedBadge, { backgroundColor: SPEED_COLORS[model.speed] + "20" }]}>
                      <ThemedText style={[styles.speedText, { color: SPEED_COLORS[model.speed] }]}>
                        {model.speed}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <ThemedText style={[styles.modelDescription, { color: theme.textSecondary }]}>
                  {model.description}
                </ThemedText>

                <View style={styles.capabilities}>
                  {model.capabilities.map((cap, index) => (
                    <View key={index} style={[styles.capBadge, { backgroundColor: theme.divider }]}>
                      <ThemedText style={[styles.capText, { color: theme.textSecondary }]}>
                        {cap}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: theme.primary }]}>
                    <Feather name="check" size={16} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.noteCard, { backgroundColor: theme.warning + "10" }]}>
          <Feather name="info" size={16} color={theme.warning} />
          <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>
            API keys for non-Gemini models need to be configured in API Settings.
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
  infoCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  modelList: {
    gap: Spacing.md,
  },
  modelCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "transparent",
  },
  modelHeader: {
    marginBottom: Spacing.sm,
  },
  modelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  modelName: {
    fontSize: 16,
    fontWeight: "600",
  },
  recommendedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: "600",
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  provider: {
    fontSize: 12,
  },
  speedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  speedText: {
    fontSize: 10,
    fontWeight: "600",
  },
  modelDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  capabilities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  capBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  capText: {
    fontSize: 11,
  },
  selectedIndicator: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noteCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    alignItems: "center",
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
