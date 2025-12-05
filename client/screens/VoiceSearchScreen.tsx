import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Animated, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type ListeningState = "idle" | "listening" | "processing" | "result";

export default function VoiceSearchScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const toast = useToast();

  const [state, setState] = useState<ListeningState>("idle");
  const [transcript, setTranscript] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === "listening") {
      startPulseAnimation();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startListening = async () => {
    if (Platform.OS === "web") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error("Not Supported", "Voice search is not supported in this browser");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setState("listening");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      };

      recognition.onresult = (event: any) => {
        const results = event.results;
        const transcript = results[results.length - 1][0].transcript;
        setTranscript(transcript);
      };

      recognition.onend = () => {
        setState("processing");
        setTimeout(() => {
          processSearch();
        }, 1000);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setState("idle");
        toast.error("Error", "Could not recognize speech");
      };

      recognition.start();
    } else {
      toast.info("Coming Soon", "Voice search on mobile devices coming soon!");
      simulateVoiceSearch();
    }
  };

  const simulateVoiceSearch = () => {
    setState("listening");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setTimeout(() => {
      setTranscript("paracetamol tablets");
      setState("processing");
      
      setTimeout(() => {
        processSearch();
      }, 1000);
    }, 2000);
  };

  const processSearch = () => {
    setSearchResults([
      "Paracetamol 500mg Tablets",
      "Paracetamol 650mg Extended Release",
      "Paracetamol Syrup 120mg/5ml",
      "Paracetamol + Caffeine Tablets",
    ]);
    setState("result");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const resetSearch = () => {
    setState("idle");
    setTranscript("");
    setSearchResults([]);
  };

  const handleSelectResult = (result: string) => {
    toast.info("Selected", result);
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h4">Voice Search</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {state === "idle" && (
          <View style={styles.idleContent}>
            <ThemedText style={[styles.instruction, { color: theme.textSecondary }]}>
              Tap the microphone to search by voice
            </ThemedText>
            <Pressable
              onPress={startListening}
              style={[styles.micButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="mic" size={48} color="#FFFFFF" />
            </Pressable>
            <ThemedText style={[styles.hint, { color: theme.textDisabled }]}>
              Say a medicine name, category, or barcode number
            </ThemedText>
          </View>
        )}

        {state === "listening" && (
          <View style={styles.listeningContent}>
            <ThemedText style={[styles.listeningText, { color: theme.primary }]}>
              Listening...
            </ThemedText>
            <Animated.View
              style={[
                styles.micButtonLarge,
                { backgroundColor: theme.primary, transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Feather name="mic" size={64} color="#FFFFFF" />
            </Animated.View>
            <ThemedText style={[styles.transcript, { color: theme.textSecondary }]}>
              {transcript || "Say something..."}
            </ThemedText>
            <Button variant="outline" onPress={resetSearch}>Cancel</Button>
          </View>
        )}

        {state === "processing" && (
          <View style={styles.processingContent}>
            <Feather name="loader" size={48} color={theme.primary} />
            <ThemedText style={styles.processingText}>Processing "{transcript}"</ThemedText>
          </View>
        )}

        {state === "result" && (
          <View style={styles.resultContent}>
            <ThemedText style={styles.resultLabel}>Results for "{transcript}"</ThemedText>
            <View style={styles.resultList}>
              {searchResults.map((result, index) => (
                <Pressable
                  key={index}
                  style={[styles.resultItem, { backgroundColor: theme.backgroundDefault }]}
                  onPress={() => handleSelectResult(result)}
                >
                  <Feather name="package" size={20} color={theme.primary} />
                  <ThemedText style={styles.resultText}>{result}</ThemedText>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>
              ))}
            </View>
            <Button variant="outline" onPress={resetSearch}>Search Again</Button>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  idleContent: {
    alignItems: "center",
    gap: Spacing.xl,
  },
  instruction: {
    fontSize: 16,
    textAlign: "center",
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  hint: {
    fontSize: 13,
    textAlign: "center",
    maxWidth: 280,
  },
  listeningContent: {
    alignItems: "center",
    gap: Spacing.xl,
  },
  listeningText: {
    fontSize: 18,
    fontWeight: "600",
  },
  micButtonLarge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  transcript: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  processingContent: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  processingText: {
    fontSize: 16,
  },
  resultContent: {
    gap: Spacing.lg,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  resultList: {
    gap: Spacing.sm,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  resultText: {
    flex: 1,
    fontSize: 15,
  },
});
