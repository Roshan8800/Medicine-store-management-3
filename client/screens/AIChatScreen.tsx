import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput as RNTextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "What medicines are expiring soon?",
  "Show low stock items",
  "Suggest alternatives for paracetamol",
  "Check drug interactions",
  "Today's sales summary",
];

export default function AIChatScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your pharmacy AI assistant. I can help you with:\n\n- Drug interactions\n- Medicine alternatives\n- Inventory insights\n- Sales analytics\n- Expiry alerts\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message: text.trim(),
        context: "Binayak Pharmacy Management System",
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.data?.response || "I apologize, but I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        {!isUser ? (
          <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
            <Feather name="cpu" size={16} color="#fff" />
          </View>
        ) : null}
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUser ? theme.primary : theme.backgroundDefault,
              maxWidth: "80%",
            },
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              { color: isUser ? "#fff" : theme.text },
            ]}
          >
            {item.content}
          </ThemedText>
          <ThemedText
            style={[
              styles.timestamp,
              { color: isUser ? "rgba(255,255,255,0.7)" : theme.textDisabled },
            ]}
          >
            {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: Spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        />

        {messages.length === 1 ? (
          <View style={styles.quickPrompts}>
            <ThemedText style={[styles.quickPromptsTitle, { color: theme.textSecondary }]}>
              Quick prompts:
            </ThemedText>
            <View style={styles.promptsGrid}>
              {QUICK_PROMPTS.map((prompt, index) => (
                <Pressable
                  key={index}
                  style={[styles.promptButton, { backgroundColor: theme.backgroundDefault }]}
                  onPress={() => sendMessage(prompt)}
                >
                  <ThemedText style={styles.promptText}>{prompt}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.backgroundDefault,
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          <RNTextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundRoot,
                color: theme.text,
                borderColor: theme.divider,
              },
            ]}
            placeholder="Ask me anything..."
            placeholderTextColor={theme.textDisabled}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: input.trim() && !isLoading ? theme.primary : theme.divider,
              },
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  assistantMessage: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    marginTop: Spacing.xs,
    textAlign: "right",
  },
  quickPrompts: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  quickPromptsTitle: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  promptsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  promptButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  promptText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  input: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
});
