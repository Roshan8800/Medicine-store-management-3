import { useState, useCallback, useRef, useEffect } from "react";
import { Platform, Alert } from "react-native";
import * as Haptics from "expo-haptics";

interface VoiceSearchResult {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceSearch(): VoiceSearchResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(async () => {
    if (Platform.OS === "web") {
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        try {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
          const recognition = new SpeechRecognition();
          
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          };

          recognition.onresult = (event: any) => {
            const results = Array.from(event.results);
            const transcript = results
              .map((result: any) => result[0].transcript)
              .join("");
            setTranscript(transcript);
          };

          recognition.onerror = (event: any) => {
            setError(event.error);
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
        } catch (err) {
          setError("Speech recognition not available");
          Alert.alert("Not Available", "Voice search is not available on this device");
        }
      } else {
        setError("Speech recognition not supported");
        Alert.alert("Not Supported", "Voice search is not supported on this browser");
      }
    } else {
      Alert.alert(
        "Voice Search",
        "Voice search requires native speech recognition. This feature works best in Expo Go with the expo-speech package."
      );
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
