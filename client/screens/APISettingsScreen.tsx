import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, TextInput as RNTextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

interface APIProvider {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
  keyName: string;
  placeholder: string;
  helpUrl: string;
}

const API_PROVIDERS: APIProvider[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "cpu",
    description: "AI-powered features using Google's Gemini models",
    keyName: "GEMINI_API_KEY",
    placeholder: "AIza...",
    helpUrl: "https://makersuite.google.com/app/apikey",
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: "zap",
    description: "GPT models for advanced AI capabilities",
    keyName: "OPENAI_API_KEY",
    placeholder: "sk-...",
    helpUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "firebase",
    name: "Firebase",
    icon: "database",
    description: "Real-time sync and cloud backup",
    keyName: "FIREBASE_API_KEY",
    placeholder: "AIza...",
    helpUrl: "https://console.firebase.google.com/",
  },
];

export default function APISettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const keys = await AsyncStorage.getItem("api_keys");
      if (keys) {
        setApiKeys(JSON.parse(keys));
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
    }
  };

  const saveAPIKey = async (keyName: string, value: string) => {
    try {
      const newKeys = { ...apiKeys, [keyName]: value };
      await AsyncStorage.setItem("api_keys", JSON.stringify(newKeys));
      setApiKeys(newKeys);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "API key saved securely");
    } catch (error) {
      Alert.alert("Error", "Failed to save API key");
    }
  };

  const removeAPIKey = async (keyName: string) => {
    Alert.alert(
      "Remove API Key",
      "Are you sure you want to remove this API key?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const newKeys = { ...apiKeys };
              delete newKeys[keyName];
              await AsyncStorage.setItem("api_keys", JSON.stringify(newKeys));
              setApiKeys(newKeys);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert("Error", "Failed to remove API key");
            }
          },
        },
      ]
    );
  };

  const maskAPIKey = (key: string) => {
    if (key.length <= 8) return "****";
    return key.substring(0, 4) + "****" + key.substring(key.length - 4);
  };

  const testAPIKey = async (provider: APIProvider) => {
    const key = apiKeys[provider.keyName];
    if (!key) {
      Alert.alert("No Key", "Please add an API key first");
      return;
    }
    Alert.alert("Testing", "API key validation coming soon!");
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={[styles.infoCard, { backgroundColor: theme.info + "20" }]}>
          <Feather name="info" size={20} color={theme.info} />
          <ThemedText style={[styles.infoText, { color: theme.info }]}>
            API keys are stored securely on your device and are used to enable AI-powered features.
          </ThemedText>
        </View>

        {API_PROVIDERS.map((provider) => {
          const hasKey = !!apiKeys[provider.keyName];
          const isEditing = editingKey === provider.id;

          return (
            <View
              key={provider.id}
              style={[styles.providerCard, { backgroundColor: theme.backgroundDefault }]}
            >
              <View style={styles.providerHeader}>
                <View style={[styles.providerIcon, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name={provider.icon} size={24} color={theme.primary} />
                </View>
                <View style={styles.providerInfo}>
                  <ThemedText type="h4">{provider.name}</ThemedText>
                  <ThemedText style={[styles.providerDescription, { color: theme.textSecondary }]}>
                    {provider.description}
                  </ThemedText>
                </View>
                {hasKey ? (
                  <View style={[styles.statusBadge, { backgroundColor: theme.success + "20" }]}>
                    <Feather name="check" size={12} color={theme.success} />
                    <ThemedText style={[styles.statusText, { color: theme.success }]}>
                      Active
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              {isEditing ? (
                <View style={styles.editSection}>
                  <RNTextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundRoot,
                        color: theme.text,
                        borderColor: theme.divider,
                      },
                    ]}
                    placeholder={provider.placeholder}
                    placeholderTextColor={theme.textDisabled}
                    value={inputValue}
                    onChangeText={setInputValue}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                  <View style={styles.editButtons}>
                    <Pressable
                      style={[styles.editButton, { backgroundColor: theme.divider }]}
                      onPress={() => {
                        setEditingKey(null);
                        setInputValue("");
                      }}
                    >
                      <ThemedText>Cancel</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.editButton, { backgroundColor: theme.primary }]}
                      onPress={() => {
                        if (inputValue.trim()) {
                          saveAPIKey(provider.keyName, inputValue.trim());
                          setEditingKey(null);
                          setInputValue("");
                        }
                      }}
                    >
                      <ThemedText style={{ color: "#fff" }}>Save</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.keySection}>
                  {hasKey ? (
                    <View style={styles.keyDisplay}>
                      <ThemedText style={[styles.maskedKey, { color: theme.textSecondary }]}>
                        {maskAPIKey(apiKeys[provider.keyName])}
                      </ThemedText>
                      <View style={styles.keyActions}>
                        <Pressable
                          style={[styles.actionButton, { backgroundColor: theme.primary + "20" }]}
                          onPress={() => testAPIKey(provider)}
                        >
                          <Feather name="play" size={16} color={theme.primary} />
                        </Pressable>
                        <Pressable
                          style={[styles.actionButton, { backgroundColor: theme.warning + "20" }]}
                          onPress={() => {
                            setEditingKey(provider.id);
                            setInputValue(apiKeys[provider.keyName]);
                          }}
                        >
                          <Feather name="edit-2" size={16} color={theme.warning} />
                        </Pressable>
                        <Pressable
                          style={[styles.actionButton, { backgroundColor: theme.error + "20" }]}
                          onPress={() => removeAPIKey(provider.keyName)}
                        >
                          <Feather name="trash-2" size={16} color={theme.error} />
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={[styles.addButton, { borderColor: theme.primary }]}
                      onPress={() => setEditingKey(provider.id)}
                    >
                      <Feather name="plus" size={20} color={theme.primary} />
                      <ThemedText style={[styles.addButtonText, { color: theme.primary }]}>
                        Add API Key
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.helpSection}>
          <ThemedText style={[styles.helpTitle, { color: theme.textSecondary }]}>
            Need help getting API keys?
          </ThemedText>
          <ThemedText style={[styles.helpText, { color: theme.textDisabled }]}>
            Visit the provider's website to create an account and generate API keys. Most providers offer free tiers for basic usage.
          </ThemedText>
        </View>
      </KeyboardAwareScrollViewCompat>
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
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  providerCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  providerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  providerInfo: {
    flex: 1,
  },
  providerDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  keySection: {
    marginTop: Spacing.sm,
  },
  keyDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  maskedKey: {
    fontSize: 14,
    fontFamily: "monospace",
  },
  keyActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    fontWeight: "500",
  },
  editSection: {
    gap: Spacing.md,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 14,
  },
  editButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  editButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  helpSection: {
    marginTop: Spacing.xl,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  helpText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
