import { useState, useCallback, useRef, useMemo } from "react";

interface UndoRedoConfig<T> {
  initialState: T;
  maxHistoryLength?: number;
  onChange?: (state: T, action: "undo" | "redo" | "set") => void;
}

interface UndoRedoResult<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
  historyLength: number;
  futureLength: number;
  jumpTo: (index: number) => void;
  history: T[];
}

export function useUndoRedo<T>({
  initialState,
  maxHistoryLength = 50,
  onChange,
}: UndoRedoConfig<T>): UndoRedoResult<T> {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const historyLength = currentIndex;
  const futureLength = history.length - currentIndex - 1;

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      setHistory((prev) => {
        const current = prev[currentIndex];
        const nextState =
          typeof newState === "function"
            ? (newState as (prev: T) => T)(current)
            : newState;

        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(nextState);

        if (newHistory.length > maxHistoryLength) {
          newHistory.shift();
          setCurrentIndex((idx) => idx);
        } else {
          setCurrentIndex((idx) => idx + 1);
        }

        onChange?.(nextState, "set");
        return newHistory;
      });
    },
    [currentIndex, maxHistoryLength, onChange]
  );

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex((idx) => {
        const newIdx = idx - 1;
        onChange?.(history[newIdx], "undo");
        return newIdx;
      });
    }
  }, [canUndo, history, onChange]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex((idx) => {
        const newIdx = idx + 1;
        onChange?.(history[newIdx], "redo");
        return newIdx;
      });
    }
  }, [canRedo, history, onChange]);

  const clear = useCallback(() => {
    setHistory([history[currentIndex]]);
    setCurrentIndex(0);
  }, [history, currentIndex]);

  const jumpTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < history.length) {
        setCurrentIndex(index);
        onChange?.(history[index], index < currentIndex ? "undo" : "redo");
      }
    },
    [history, currentIndex, onChange]
  );

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
    historyLength,
    futureLength,
    jumpTo,
    history,
  };
}

interface BatchUndoRedoConfig<T> extends UndoRedoConfig<T> {
  batchDelay?: number;
}

export function useBatchUndoRedo<T>({
  initialState,
  maxHistoryLength = 50,
  batchDelay = 500,
  onChange,
}: BatchUndoRedoConfig<T>): UndoRedoResult<T> & { commitBatch: () => void } {
  const undoRedo = useUndoRedo<T>({ initialState, maxHistoryLength, onChange });
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStateRef = useRef<T | null>(null);

  const setBatchedState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      const nextState =
        typeof newState === "function"
          ? (newState as (prev: T) => T)(pendingStateRef.current ?? undoRedo.state)
          : newState;

      pendingStateRef.current = nextState;

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      batchTimeoutRef.current = setTimeout(() => {
        if (pendingStateRef.current !== null) {
          undoRedo.setState(pendingStateRef.current);
          pendingStateRef.current = null;
        }
        batchTimeoutRef.current = null;
      }, batchDelay);
    },
    [undoRedo, batchDelay]
  );

  const commitBatch = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    if (pendingStateRef.current !== null) {
      undoRedo.setState(pendingStateRef.current);
      pendingStateRef.current = null;
    }
  }, [undoRedo]);

  return {
    ...undoRedo,
    state: pendingStateRef.current ?? undoRedo.state,
    setState: setBatchedState,
    commitBatch,
  };
}

interface SelectiveUndoRedoConfig<T> {
  initialState: T;
  trackedKeys?: (keyof T)[];
  maxHistoryLength?: number;
}

export function useSelectiveUndoRedo<T extends Record<string, unknown>>({
  initialState,
  trackedKeys,
  maxHistoryLength = 50,
}: SelectiveUndoRedoConfig<T>) {
  const getTrackedState = useCallback(
    (state: T): Partial<T> => {
      if (!trackedKeys) return state;
      const tracked: Partial<T> = {};
      for (const key of trackedKeys) {
        tracked[key] = state[key];
      }
      return tracked;
    },
    [trackedKeys]
  );

  const [history, setHistory] = useState<Partial<T>[]>([getTrackedState(initialState)]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentState, setCurrentState] = useState<T>(initialState);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      const nextState =
        typeof newState === "function"
          ? (newState as (prev: T) => T)(currentState)
          : newState;

      setCurrentState(nextState);

      const trackedState = getTrackedState(nextState);
      const prevTrackedState = history[currentIndex];

      const hasTrackedChanges = trackedKeys
        ? trackedKeys.some((key) => trackedState[key] !== prevTrackedState[key])
        : JSON.stringify(trackedState) !== JSON.stringify(prevTrackedState);

      if (hasTrackedChanges) {
        setHistory((prev) => {
          const newHistory = prev.slice(0, currentIndex + 1);
          newHistory.push(trackedState);

          if (newHistory.length > maxHistoryLength) {
            newHistory.shift();
          } else {
            setCurrentIndex((idx) => idx + 1);
          }

          return newHistory;
        });
      }
    },
    [currentState, history, currentIndex, getTrackedState, trackedKeys, maxHistoryLength]
  );

  const undo = useCallback(() => {
    if (canUndo) {
      const prevState = history[currentIndex - 1];
      setCurrentState((state) => ({ ...state, ...prevState }));
      setCurrentIndex((idx) => idx - 1);
    }
  }, [canUndo, history, currentIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      const nextState = history[currentIndex + 1];
      setCurrentState((state) => ({ ...state, ...nextState }));
      setCurrentIndex((idx) => idx + 1);
    }
  }, [canRedo, history, currentIndex]);

  const clear = useCallback(() => {
    setHistory([getTrackedState(currentState)]);
    setCurrentIndex(0);
  }, [currentState, getTrackedState]);

  return {
    state: currentState,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
    historyLength: currentIndex,
    futureLength: history.length - currentIndex - 1,
  };
}
