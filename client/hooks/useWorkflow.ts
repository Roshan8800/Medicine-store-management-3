import { useState, useCallback, useMemo } from "react";

export interface WorkflowStep<T = any> {
  id: string;
  title: string;
  description?: string;
  validate?: (data: T) => boolean | string;
  onEnter?: (data: T) => Promise<void> | void;
  onExit?: (data: T) => Promise<void> | void;
  canSkip?: boolean;
  isOptional?: boolean;
}

export interface WorkflowConfig<T = any> {
  steps: WorkflowStep<T>[];
  initialData: T;
  onComplete?: (data: T) => Promise<void> | void;
  onCancel?: (data: T) => void;
  allowBackNavigation?: boolean;
  persistProgress?: boolean;
}

export interface WorkflowState<T> {
  currentStepIndex: number;
  currentStep: WorkflowStep<T>;
  data: T;
  errors: Record<string, string>;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  visitedSteps: Set<string>;
  completedSteps: Set<string>;
}

export function useWorkflow<T extends Record<string, any>>(config: WorkflowConfig<T>) {
  const { steps, initialData, onComplete, onCancel, allowBackNavigation = true } = config;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<Set<string>>(new Set([steps[0]?.id]));
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentStep = useMemo(() => steps[currentStepIndex], [steps, currentStepIndex]);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const validateCurrentStep = useCallback((): boolean => {
    if (!currentStep.validate) return true;

    const result = currentStep.validate(data);
    if (result === true) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[currentStep.id];
        return newErrors;
      });
      return true;
    }

    const errorMessage = typeof result === "string" ? result : "Validation failed";
    setErrors((prev) => ({ ...prev, [currentStep.id]: errorMessage }));
    return false;
  }, [currentStep, data]);

  const goToStep = useCallback(async (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return false;
    if (!allowBackNavigation && stepIndex < currentStepIndex) return false;

    const targetStep = steps[stepIndex];

    if (currentStep.onExit) {
      try {
        setIsProcessing(true);
        await currentStep.onExit(data);
      } catch (error) {
        console.error("Error in onExit:", error);
        return false;
      } finally {
        setIsProcessing(false);
      }
    }

    if (targetStep.onEnter) {
      try {
        setIsProcessing(true);
        await targetStep.onEnter(data);
      } catch (error) {
        console.error("Error in onEnter:", error);
        return false;
      } finally {
        setIsProcessing(false);
      }
    }

    setVisitedSteps((prev) => new Set([...prev, targetStep.id]));
    setCurrentStepIndex(stepIndex);
    return true;
  }, [steps, currentStepIndex, currentStep, data, allowBackNavigation]);

  const next = useCallback(async () => {
    if (isLastStep) {
      if (!validateCurrentStep()) return false;

      setCompletedSteps((prev) => new Set([...prev, currentStep.id]));

      if (onComplete) {
        try {
          setIsProcessing(true);
          await onComplete(data);
        } catch (error) {
          console.error("Error in onComplete:", error);
          return false;
        } finally {
          setIsProcessing(false);
        }
      }
      return true;
    }

    if (!validateCurrentStep()) return false;

    setCompletedSteps((prev) => new Set([...prev, currentStep.id]));
    return goToStep(currentStepIndex + 1);
  }, [isLastStep, validateCurrentStep, currentStep, data, onComplete, goToStep, currentStepIndex]);

  const back = useCallback(async () => {
    if (isFirstStep || !allowBackNavigation) return false;
    return goToStep(currentStepIndex - 1);
  }, [isFirstStep, allowBackNavigation, goToStep, currentStepIndex]);

  const skip = useCallback(async () => {
    if (!currentStep.canSkip && !currentStep.isOptional) return false;
    return goToStep(currentStepIndex + 1);
  }, [currentStep, goToStep, currentStepIndex]);

  const cancel = useCallback(() => {
    if (onCancel) {
      onCancel(data);
    }
  }, [onCancel, data]);

  const updateData = useCallback((updates: Partial<T>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const setStepData = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetWorkflow = useCallback(() => {
    setCurrentStepIndex(0);
    setData(initialData);
    setErrors({});
    setVisitedSteps(new Set([steps[0]?.id]));
    setCompletedSteps(new Set());
  }, [initialData, steps]);

  const getStepStatus = useCallback((stepId: string): "pending" | "current" | "completed" | "visited" => {
    if (currentStep.id === stepId) return "current";
    if (completedSteps.has(stepId)) return "completed";
    if (visitedSteps.has(stepId)) return "visited";
    return "pending";
  }, [currentStep, completedSteps, visitedSteps]);

  const canNavigateToStep = useCallback((stepIndex: number): boolean => {
    if (stepIndex === currentStepIndex) return true;
    if (stepIndex < currentStepIndex && allowBackNavigation) return true;
    if (stepIndex > currentStepIndex) {
      for (let i = currentStepIndex; i < stepIndex; i++) {
        if (!completedSteps.has(steps[i].id) && !steps[i].isOptional) {
          return false;
        }
      }
      return true;
    }
    return false;
  }, [currentStepIndex, allowBackNavigation, completedSteps, steps]);

  return {
    currentStep,
    currentStepIndex,
    data,
    errors,
    isFirstStep,
    isLastStep,
    progress,
    isProcessing,
    visitedSteps,
    completedSteps,
    steps,
    next,
    back,
    skip,
    cancel,
    goToStep,
    updateData,
    setStepData,
    resetWorkflow,
    validateCurrentStep,
    getStepStatus,
    canNavigateToStep,
  };
}

export function createWorkflowStep<T>(step: WorkflowStep<T>): WorkflowStep<T> {
  return step;
}
