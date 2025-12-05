import { useState, useCallback, useMemo } from "react";

type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

type FieldConfig<T> = {
  initialValue: T;
  rules?: ValidationRule<T>[];
  required?: boolean;
  requiredMessage?: string;
};

type FormConfig<T extends Record<string, unknown>> = {
  [K in keyof T]: FieldConfig<T[K]>;
};

type FieldState<T> = {
  value: T;
  error: string | null;
  touched: boolean;
  isValid: boolean;
};

type FormState<T extends Record<string, unknown>> = {
  [K in keyof T]: FieldState<T[K]>;
};

interface UseFormValidationResult<T extends Record<string, unknown>> {
  values: { [K in keyof T]: T[K] };
  errors: { [K in keyof T]: string | null };
  touched: { [K in keyof T]: boolean };
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: <K extends keyof T>(field: K, error: string | null) => void;
  setTouched: <K extends keyof T>(field: K, isTouched?: boolean) => void;
  validateField: <K extends keyof T>(field: K) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
  resetField: <K extends keyof T>(field: K) => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => Promise<void>;
  getFieldProps: <K extends keyof T>(field: K) => {
    value: T[K];
    onChangeText: (text: string) => void;
    onBlur: () => void;
    error: string | null;
  };
}

export function useFormValidation<T extends Record<string, unknown>>(
  config: FormConfig<T>
): UseFormValidationResult<T> {
  const initialState = useMemo(() => {
    const state: Partial<FormState<T>> = {};
    for (const key in config) {
      state[key] = {
        value: config[key].initialValue,
        error: null,
        touched: false,
        isValid: true,
      };
    }
    return state as FormState<T>;
  }, []);

  const [formState, setFormState] = useState<FormState<T>>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]): string | null => {
      const fieldConfig = config[field];

      if (fieldConfig.required) {
        const isEmpty =
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
          return fieldConfig.requiredMessage || "This field is required";
        }
      }

      if (fieldConfig.rules) {
        for (const rule of fieldConfig.rules) {
          if (!rule.validate(value)) {
            return rule.message;
          }
        }
      }

      return null;
    },
    [config]
  );

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      const error = validateFieldValue(field, value);
      setFormState((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          value,
          error: prev[field].touched ? error : null,
          isValid: error === null,
        },
      }));
    },
    [validateFieldValue]
  );

  const setValues = useCallback(
    (values: Partial<T>) => {
      setFormState((prev) => {
        const newState = { ...prev };
        for (const key in values) {
          if (key in newState) {
            const value = values[key] as T[typeof key];
            const error = validateFieldValue(key, value);
            newState[key] = {
              ...newState[key],
              value,
              error: newState[key].touched ? error : null,
              isValid: error === null,
            };
          }
        }
        return newState;
      });
    },
    [validateFieldValue]
  );

  const setError = useCallback(<K extends keyof T>(field: K, error: string | null) => {
    setFormState((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
        isValid: error === null,
      },
    }));
  }, []);

  const setTouched = useCallback(
    <K extends keyof T>(field: K, isTouched = true) => {
      setFormState((prev) => {
        const error = isTouched ? validateFieldValue(field, prev[field].value) : null;
        return {
          ...prev,
          [field]: {
            ...prev[field],
            touched: isTouched,
            error,
            isValid: error === null,
          },
        };
      });
    },
    [validateFieldValue]
  );

  const validateField = useCallback(
    <K extends keyof T>(field: K): boolean => {
      const error = validateFieldValue(field, formState[field].value);
      setFormState((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          error,
          touched: true,
          isValid: error === null,
        },
      }));
      return error === null;
    },
    [formState, validateFieldValue]
  );

  const validateForm = useCallback((): boolean => {
    let isFormValid = true;
    const newState = { ...formState };

    for (const key in formState) {
      const error = validateFieldValue(key, formState[key].value);
      newState[key] = {
        ...newState[key],
        error,
        touched: true,
        isValid: error === null,
      };
      if (error !== null) {
        isFormValid = false;
      }
    }

    setFormState(newState);
    return isFormValid;
  }, [formState, validateFieldValue]);

  const resetForm = useCallback(() => {
    setFormState(initialState);
    setIsSubmitting(false);
  }, [initialState]);

  const resetField = useCallback(
    <K extends keyof T>(field: K) => {
      setFormState((prev) => ({
        ...prev,
        [field]: {
          value: config[field].initialValue,
          error: null,
          touched: false,
          isValid: true,
        },
      }));
    },
    [config]
  );

  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        const values: Partial<T> = {};
        for (const key in formState) {
          values[key] = formState[key].value;
        }
        await onSubmit(values as T);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, validateForm]
  );

  const getFieldProps = useCallback(
    <K extends keyof T>(field: K) => ({
      value: formState[field].value,
      onChangeText: (text: string) => setValue(field, text as T[K]),
      onBlur: () => setTouched(field, true),
      error: formState[field].error,
    }),
    [formState, setValue, setTouched]
  );

  const values = useMemo(() => {
    const result: Partial<{ [K in keyof T]: T[K] }> = {};
    for (const key in formState) {
      result[key] = formState[key].value;
    }
    return result as { [K in keyof T]: T[K] };
  }, [formState]);

  const errors = useMemo(() => {
    const result: Partial<{ [K in keyof T]: string | null }> = {};
    for (const key in formState) {
      result[key] = formState[key].error;
    }
    return result as { [K in keyof T]: string | null };
  }, [formState]);

  const touched = useMemo(() => {
    const result: Partial<{ [K in keyof T]: boolean }> = {};
    for (const key in formState) {
      result[key] = formState[key].touched;
    }
    return result as { [K in keyof T]: boolean };
  }, [formState]);

  const isValid = useMemo(() => {
    for (const key in formState) {
      if (!formState[key].isValid) {
        return false;
      }
    }
    return true;
  }, [formState]);

  const isDirty = useMemo(() => {
    for (const key in formState) {
      if (formState[key].value !== config[key].initialValue) {
        return true;
      }
    }
    return false;
  }, [formState, config]);

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    setValue,
    setValues,
    setError,
    setTouched,
    validateField,
    validateForm,
    resetForm,
    resetField,
    handleSubmit,
    getFieldProps,
  };
}

export const validators = {
  required: (message = "This field is required"): ValidationRule<unknown> => ({
    validate: (value) =>
      value !== undefined &&
      value !== null &&
      value !== "" &&
      (!Array.isArray(value) || value.length > 0),
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message: message || `Minimum ${min} characters required`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message: message || `Maximum ${max} characters allowed`,
  }),

  email: (message = "Invalid email address"): ValidationRule<string> => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  phone: (message = "Invalid phone number"): ValidationRule<string> => ({
    validate: (value) => /^[+]?[\d\s()-]{10,}$/.test(value),
    message,
  }),

  numeric: (message = "Must be a number"): ValidationRule<string> => ({
    validate: (value) => !isNaN(Number(value)) && value.trim() !== "",
    message,
  }),

  positiveNumber: (message = "Must be a positive number"): ValidationRule<string> => ({
    validate: (value) => {
      const num = Number(value);
      return !isNaN(num) && num > 0;
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule<string | number> => ({
    validate: (value) => Number(value) >= min,
    message: message || `Minimum value is ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<string | number> => ({
    validate: (value) => Number(value) <= max,
    message: message || `Maximum value is ${max}`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value) => regex.test(value),
    message,
  }),

  match: (
    getValue: () => string,
    message = "Values do not match"
  ): ValidationRule<string> => ({
    validate: (value) => value === getValue(),
    message,
  }),

  url: (message = "Invalid URL"): ValidationRule<string> => ({
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  date: (message = "Invalid date"): ValidationRule<string> => ({
    validate: (value) => !isNaN(Date.parse(value)),
    message,
  }),

  futureDate: (message = "Date must be in the future"): ValidationRule<string> => ({
    validate: (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    },
    message,
  }),

  pastDate: (message = "Date must be in the past"): ValidationRule<string> => ({
    validate: (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date < new Date();
    },
    message,
  }),

  gst: (message = "Invalid GST number"): ValidationRule<string> => ({
    validate: (value) =>
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value),
    message,
  }),

  barcode: (message = "Invalid barcode"): ValidationRule<string> => ({
    validate: (value) => /^[0-9]{8,14}$/.test(value),
    message,
  }),
};
