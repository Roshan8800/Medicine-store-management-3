import { useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface MultiSelectConfig<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  maxSelections?: number;
  hapticFeedback?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
}

interface MultiSelectResult<T> {
  selectedIds: Set<string>;
  selectedItems: T[];
  selectedCount: number;
  isSelecting: boolean;
  isAllSelected: boolean;
  isMaxReached: boolean;
  toggleSelection: (id: string) => void;
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelectAll: () => void;
  isSelected: (id: string) => boolean;
  startSelection: (id?: string) => void;
  endSelection: () => void;
  getSelectionProps: (id: string) => {
    isSelected: boolean;
    onPress: () => void;
    onLongPress: () => void;
  };
}

export function useMultiSelect<T>({
  items,
  keyExtractor,
  maxSelections,
  hapticFeedback = true,
  onSelectionChange,
}: MultiSelectConfig<T>): MultiSelectResult<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticFeedback]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(keyExtractor(item)));
  }, [items, selectedIds, keyExtractor]);

  const selectedCount = selectedIds.size;
  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isMaxReached = maxSelections !== undefined && selectedIds.size >= maxSelections;

  const notifyChange = useCallback(
    (newSelectedIds: Set<string>) => {
      if (onSelectionChange) {
        const newSelectedItems = items.filter((item) =>
          newSelectedIds.has(keyExtractor(item))
        );
        onSelectionChange(newSelectedItems);
      }
    },
    [items, keyExtractor, onSelectionChange]
  );

  const toggleSelection = useCallback(
    (id: string) => {
      triggerHaptic();
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          if (maxSelections !== undefined && newSet.size >= maxSelections) {
            return prev;
          }
          newSet.add(id);
        }
        notifyChange(newSet);
        return newSet;
      });
    },
    [maxSelections, triggerHaptic, notifyChange]
  );

  const selectItem = useCallback(
    (id: string) => {
      if (maxSelections !== undefined && selectedIds.size >= maxSelections) {
        return;
      }
      triggerHaptic();
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(id);
        notifyChange(newSet);
        return newSet;
      });
    },
    [maxSelections, selectedIds.size, triggerHaptic, notifyChange]
  );

  const deselectItem = useCallback(
    (id: string) => {
      triggerHaptic();
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        notifyChange(newSet);
        return newSet;
      });
    },
    [triggerHaptic, notifyChange]
  );

  const selectAll = useCallback(() => {
    triggerHaptic();
    const allIds = items.map(keyExtractor);
    const idsToSelect = maxSelections !== undefined
      ? allIds.slice(0, maxSelections)
      : allIds;
    const newSet = new Set(idsToSelect);
    setSelectedIds(newSet);
    notifyChange(newSet);
  }, [items, keyExtractor, maxSelections, triggerHaptic, notifyChange]);

  const deselectAll = useCallback(() => {
    triggerHaptic();
    const newSet = new Set<string>();
    setSelectedIds(newSet);
    notifyChange(newSet);
    setIsSelecting(false);
  }, [triggerHaptic, notifyChange]);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, selectAll, deselectAll]);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const startSelection = useCallback(
    (id?: string) => {
      triggerHaptic();
      setIsSelecting(true);
      if (id) {
        setSelectedIds(new Set([id]));
        notifyChange(new Set([id]));
      }
    },
    [triggerHaptic, notifyChange]
  );

  const endSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
    notifyChange(new Set());
  }, [notifyChange]);

  const getSelectionProps = useCallback(
    (id: string) => ({
      isSelected: selectedIds.has(id),
      onPress: () => {
        if (isSelecting) {
          toggleSelection(id);
        }
      },
      onLongPress: () => {
        if (!isSelecting) {
          startSelection(id);
        }
      },
    }),
    [selectedIds, isSelecting, toggleSelection, startSelection]
  );

  return {
    selectedIds,
    selectedItems,
    selectedCount,
    isSelecting,
    isAllSelected,
    isMaxReached,
    toggleSelection,
    selectItem,
    deselectItem,
    selectAll,
    deselectAll,
    toggleSelectAll,
    isSelected,
    startSelection,
    endSelection,
    getSelectionProps,
  };
}

interface BatchActionsConfig<T> {
  selectedItems: T[];
  onDelete?: (items: T[]) => Promise<void>;
  onArchive?: (items: T[]) => Promise<void>;
  onExport?: (items: T[]) => Promise<void>;
  onMove?: (items: T[], destination: string) => Promise<void>;
  onShare?: (items: T[]) => Promise<void>;
  onMark?: (items: T[], status: string) => Promise<void>;
}

interface BatchActionsResult<T> {
  isProcessing: boolean;
  error: Error | null;
  deleteSelected: () => Promise<void>;
  archiveSelected: () => Promise<void>;
  exportSelected: () => Promise<void>;
  moveSelected: (destination: string) => Promise<void>;
  shareSelected: () => Promise<void>;
  markSelected: (status: string) => Promise<void>;
}

export function useBatchActions<T>({
  selectedItems,
  onDelete,
  onArchive,
  onExport,
  onMove,
  onShare,
  onMark,
}: BatchActionsConfig<T>): BatchActionsResult<T> {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeAction = useCallback(
    async (action: () => Promise<void>) => {
      if (selectedItems.length === 0) return;

      setIsProcessing(true);
      setError(null);

      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Action failed"));
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedItems]
  );

  const deleteSelected = useCallback(async () => {
    if (onDelete) {
      await executeAction(() => onDelete(selectedItems));
    }
  }, [selectedItems, onDelete, executeAction]);

  const archiveSelected = useCallback(async () => {
    if (onArchive) {
      await executeAction(() => onArchive(selectedItems));
    }
  }, [selectedItems, onArchive, executeAction]);

  const exportSelected = useCallback(async () => {
    if (onExport) {
      await executeAction(() => onExport(selectedItems));
    }
  }, [selectedItems, onExport, executeAction]);

  const moveSelected = useCallback(
    async (destination: string) => {
      if (onMove) {
        await executeAction(() => onMove(selectedItems, destination));
      }
    },
    [selectedItems, onMove, executeAction]
  );

  const shareSelected = useCallback(async () => {
    if (onShare) {
      await executeAction(() => onShare(selectedItems));
    }
  }, [selectedItems, onShare, executeAction]);

  const markSelected = useCallback(
    async (status: string) => {
      if (onMark) {
        await executeAction(() => onMark(selectedItems, status));
      }
    },
    [selectedItems, onMark, executeAction]
  );

  return {
    isProcessing,
    error,
    deleteSelected,
    archiveSelected,
    exportSelected,
    moveSelected,
    shareSelected,
    markSelected,
  };
}
