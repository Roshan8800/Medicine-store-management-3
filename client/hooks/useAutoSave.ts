import { useEffect, useRef, useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AutoSaveConfig<T> {
  key: string;
  data: T;
  debounceMs?: number;
  onSave?: () => void;
  onLoad?: (data: T) => void;
}

interface AutoSaveResult<T> {
  isSaving: boolean;
  lastSaved: Date | null;
  save: () => Promise<void>;
  load: () => Promise<T | null>;
  clear: () => Promise<void>;
}

export function useAutoSave<T>({
  key,
  data,
  debounceMs = 2000,
  onSave,
  onLoad,
}: AutoSaveConfig<T>): AutoSaveResult<T> {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef(data);

  dataRef.current = data;

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(key, JSON.stringify(dataRef.current));
      setLastSaved(new Date());
      onSave?.();
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [key, onSave]);

  const load = useCallback(async (): Promise<T | null> => {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as T;
        onLoad?.(parsed);
        return parsed;
      }
    } catch (error) {
      console.error("Auto-load failed:", error);
    }
    return null;
  }, [key, onLoad]);

  const clear = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setLastSaved(null);
    } catch (error) {
      console.error("Clear failed:", error);
    }
  }, [key]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, save]);

  useEffect(() => {
    load();
  }, []);

  return {
    isSaving,
    lastSaved,
    save,
    load,
    clear,
  };
}
