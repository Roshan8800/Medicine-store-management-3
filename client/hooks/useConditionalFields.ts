import { useState, useCallback, useMemo } from "react";

export interface FieldCondition {
  field: string;
  operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan" | "isEmpty" | "isNotEmpty" | "matches";
  value?: any;
  pattern?: RegExp;
}

export interface ConditionalFieldConfig {
  targetField: string;
  conditions: FieldCondition[];
  logic: "and" | "or";
  action: "show" | "hide" | "enable" | "disable" | "require";
}

export interface FieldVisibility {
  visible: boolean;
  enabled: boolean;
  required: boolean;
}

export function useConditionalFields<T extends Record<string, any>>(
  initialValues: T,
  rules: ConditionalFieldConfig[]
) {
  const [values, setValues] = useState<T>(initialValues);

  const evaluateCondition = useCallback((condition: FieldCondition, formValues: T): boolean => {
    const fieldValue = formValues[condition.field];

    switch (condition.operator) {
      case "equals":
        return fieldValue === condition.value;
      case "notEquals":
        return fieldValue !== condition.value;
      case "contains":
        return typeof fieldValue === "string" && fieldValue.includes(condition.value);
      case "greaterThan":
        return typeof fieldValue === "number" && fieldValue > condition.value;
      case "lessThan":
        return typeof fieldValue === "number" && fieldValue < condition.value;
      case "isEmpty":
        return fieldValue === null || fieldValue === undefined || fieldValue === "" || 
               (Array.isArray(fieldValue) && fieldValue.length === 0);
      case "isNotEmpty":
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== "" &&
               !(Array.isArray(fieldValue) && fieldValue.length === 0);
      case "matches":
        return condition.pattern ? condition.pattern.test(String(fieldValue)) : false;
      default:
        return false;
    }
  }, []);

  const evaluateRule = useCallback((rule: ConditionalFieldConfig, formValues: T): boolean => {
    const results = rule.conditions.map((condition) => evaluateCondition(condition, formValues));
    return rule.logic === "and" 
      ? results.every(Boolean) 
      : results.some(Boolean);
  }, [evaluateCondition]);

  const fieldVisibility = useMemo((): Record<string, FieldVisibility> => {
    const visibility: Record<string, FieldVisibility> = {};

    Object.keys(values).forEach((field) => {
      visibility[field] = { visible: true, enabled: true, required: false };
    });

    rules.forEach((rule) => {
      const conditionMet = evaluateRule(rule, values);

      if (!visibility[rule.targetField]) {
        visibility[rule.targetField] = { visible: true, enabled: true, required: false };
      }

      switch (rule.action) {
        case "show":
          visibility[rule.targetField].visible = conditionMet;
          break;
        case "hide":
          visibility[rule.targetField].visible = !conditionMet;
          break;
        case "enable":
          visibility[rule.targetField].enabled = conditionMet;
          break;
        case "disable":
          visibility[rule.targetField].enabled = !conditionMet;
          break;
        case "require":
          visibility[rule.targetField].required = conditionMet;
          break;
      }
    });

    return visibility;
  }, [values, rules, evaluateRule]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setMultipleValues = useCallback((updates: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetValues = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  const isFieldVisible = useCallback((field: string): boolean => {
    return fieldVisibility[field]?.visible ?? true;
  }, [fieldVisibility]);

  const isFieldEnabled = useCallback((field: string): boolean => {
    return fieldVisibility[field]?.enabled ?? true;
  }, [fieldVisibility]);

  const isFieldRequired = useCallback((field: string): boolean => {
    return fieldVisibility[field]?.required ?? false;
  }, [fieldVisibility]);

  const getVisibleFields = useCallback((): string[] => {
    return Object.entries(fieldVisibility)
      .filter(([_, vis]) => vis.visible)
      .map(([field]) => field);
  }, [fieldVisibility]);

  const getEnabledFields = useCallback((): string[] => {
    return Object.entries(fieldVisibility)
      .filter(([_, vis]) => vis.enabled)
      .map(([field]) => field);
  }, [fieldVisibility]);

  const getRequiredFields = useCallback((): string[] => {
    return Object.entries(fieldVisibility)
      .filter(([_, vis]) => vis.required)
      .map(([field]) => field);
  }, [fieldVisibility]);

  return {
    values,
    setValue,
    setMultipleValues,
    resetValues,
    fieldVisibility,
    isFieldVisible,
    isFieldEnabled,
    isFieldRequired,
    getVisibleFields,
    getEnabledFields,
    getRequiredFields,
  };
}

export function createConditionalRule(
  targetField: string,
  action: ConditionalFieldConfig["action"],
  conditions: FieldCondition[],
  logic: "and" | "or" = "and"
): ConditionalFieldConfig {
  return { targetField, conditions, logic, action };
}

export function when(field: string) {
  return {
    equals: (value: any) => ({ field, operator: "equals" as const, value }),
    notEquals: (value: any) => ({ field, operator: "notEquals" as const, value }),
    contains: (value: any) => ({ field, operator: "contains" as const, value }),
    greaterThan: (value: number) => ({ field, operator: "greaterThan" as const, value }),
    lessThan: (value: number) => ({ field, operator: "lessThan" as const, value }),
    isEmpty: () => ({ field, operator: "isEmpty" as const }),
    isNotEmpty: () => ({ field, operator: "isNotEmpty" as const }),
    matches: (pattern: RegExp) => ({ field, operator: "matches" as const, pattern }),
  };
}
