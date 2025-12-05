import { useState, useCallback, createContext, useContext, ReactNode, useMemo } from "react";
import React from "react";
import { NativeModules, Platform } from "react-native";

export type Locale = "en" | "hi" | "bn" | "ne" | "mr" | "gu" | "ta" | "te";

export interface TranslationStrings {
  [key: string]: string | TranslationStrings;
}

export interface I18nConfig {
  defaultLocale: Locale;
  fallbackLocale: Locale;
  translations: Record<Locale, TranslationStrings>;
}

const DEFAULT_TRANSLATIONS: Record<Locale, TranslationStrings> = {
  en: {
    common: {
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry",
      cancel: "Cancel",
      confirm: "Confirm",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      search: "Search",
      noResults: "No results found",
      success: "Success",
      failed: "Failed",
    },
    auth: {
      login: "Login",
      logout: "Logout",
      register: "Register",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot Password?",
    },
    inventory: {
      title: "Inventory",
      addItem: "Add Item",
      editItem: "Edit Item",
      quantity: "Quantity",
      price: "Price",
      expiryDate: "Expiry Date",
      lowStock: "Low Stock",
      outOfStock: "Out of Stock",
    },
    sales: {
      title: "Sales",
      newSale: "New Sale",
      total: "Total",
      subtotal: "Subtotal",
      tax: "Tax",
      discount: "Discount",
      payment: "Payment",
      cash: "Cash",
      card: "Card",
      upi: "UPI",
    },
    reports: {
      title: "Reports",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
      export: "Export",
    },
    settings: {
      title: "Settings",
      language: "Language",
      theme: "Theme",
      notifications: "Notifications",
      profile: "Profile",
      about: "About",
    },
    time: {
      today: "Today",
      yesterday: "Yesterday",
      tomorrow: "Tomorrow",
      now: "Now",
      ago: "ago",
      minutes: "minutes",
      hours: "hours",
      days: "days",
      weeks: "weeks",
      months: "months",
      years: "years",
    },
  },
  hi: {
    common: {
      loading: "लोड हो रहा है...",
      error: "एक त्रुटि हुई",
      retry: "पुनः प्रयास करें",
      cancel: "रद्द करें",
      confirm: "पुष्टि करें",
      save: "सहेजें",
      delete: "हटाएं",
      edit: "संपादित करें",
      search: "खोजें",
      noResults: "कोई परिणाम नहीं मिला",
      success: "सफल",
      failed: "असफल",
    },
    auth: {
      login: "लॉगिन",
      logout: "लॉगआउट",
      register: "पंजीकरण",
      email: "ईमेल",
      password: "पासवर्ड",
      forgotPassword: "पासवर्ड भूल गए?",
    },
    inventory: {
      title: "इन्वेंट्री",
      addItem: "आइटम जोड़ें",
      editItem: "आइटम संपादित करें",
      quantity: "मात्रा",
      price: "कीमत",
      expiryDate: "समाप्ति तिथि",
      lowStock: "कम स्टॉक",
      outOfStock: "स्टॉक में नहीं",
    },
    sales: {
      title: "बिक्री",
      newSale: "नई बिक्री",
      total: "कुल",
      subtotal: "उप-योग",
      tax: "कर",
      discount: "छूट",
      payment: "भुगतान",
      cash: "नकद",
      card: "कार्ड",
      upi: "यूपीआई",
    },
    reports: {
      title: "रिपोर्ट",
      daily: "दैनिक",
      weekly: "साप्ताहिक",
      monthly: "मासिक",
      yearly: "वार्षिक",
      export: "निर्यात",
    },
    settings: {
      title: "सेटिंग्स",
      language: "भाषा",
      theme: "थीम",
      notifications: "सूचनाएं",
      profile: "प्रोफ़ाइल",
      about: "के बारे में",
    },
    time: {
      today: "आज",
      yesterday: "कल",
      tomorrow: "कल",
      now: "अभी",
      ago: "पहले",
      minutes: "मिनट",
      hours: "घंटे",
      days: "दिन",
      weeks: "सप्ताह",
      months: "महीने",
      years: "वर्ष",
    },
  },
  bn: {
    common: {
      loading: "লোড হচ্ছে...",
      error: "একটি ত্রুটি ঘটেছে",
      retry: "পুনরায় চেষ্টা করুন",
      cancel: "বাতিল",
      confirm: "নিশ্চিত করুন",
      save: "সংরক্ষণ করুন",
      delete: "মুছুন",
      edit: "সম্পাদনা করুন",
      search: "খুঁজুন",
      noResults: "কোন ফলাফল পাওয়া যায়নি",
      success: "সফল",
      failed: "ব্যর্থ",
    },
    auth: {
      login: "লগইন",
      logout: "লগআউট",
      register: "নিবন্ধন",
      email: "ইমেল",
      password: "পাসওয়ার্ড",
      forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    },
  },
  ne: { common: { loading: "लोड हुँदैछ..." } },
  mr: { common: { loading: "लोड होत आहे..." } },
  gu: { common: { loading: "લોડ થઈ રહ્યું છે..." } },
  ta: { common: { loading: "ஏற்றுகிறது..." } },
  te: { common: { loading: "లోడ్ అవుతోంది..." } },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date) => string;
  isRTL: boolean;
  availableLocales: Locale[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getDeviceLocale(): Locale {
  try {
    let deviceLocale = "en";
    
    if (Platform.OS === "ios") {
      deviceLocale = NativeModules.SettingsManager?.settings?.AppleLocale ||
                     NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
                     "en";
    } else if (Platform.OS === "android") {
      deviceLocale = NativeModules.I18nManager?.localeIdentifier || "en";
    }

    const lang = deviceLocale.split(/[-_]/)[0].toLowerCase() as Locale;
    return DEFAULT_TRANSLATIONS[lang] ? lang : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({
  children,
  config,
}: {
  children: ReactNode;
  config?: Partial<I18nConfig>;
}) {
  const [locale, setLocale] = useState<Locale>(config?.defaultLocale || getDeviceLocale());

  const translations = useMemo(() => ({
    ...DEFAULT_TRANSLATIONS,
    ...config?.translations,
  }), [config?.translations]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = translations[locale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        value = translations[config?.fallbackLocale || "en"];
        for (const k2 of keys) {
          if (value && typeof value === "object" && k2 in value) {
            value = value[k2];
          } else {
            return key;
          }
        }
        break;
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{${paramKey}}`);
      });
    }

    return value;
  }, [locale, translations, config?.fallbackLocale]);

  const formatNumber = useCallback((num: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(locale, options).format(num);
  }, [locale]);

  const formatCurrency = useCallback((amount: number, currency = "INR"): string => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  }, [locale]);

  const formatDate = useCallback((date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return new Intl.DateTimeFormat(locale, options).format(date);
  }, [locale]);

  const formatRelativeTime = useCallback((date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return t("time.now");
    if (minutes < 60) return `${minutes} ${t("time.minutes")} ${t("time.ago")}`;
    if (hours < 24) return `${hours} ${t("time.hours")} ${t("time.ago")}`;
    if (days === 1) return t("time.yesterday");
    if (days < 7) return `${days} ${t("time.days")} ${t("time.ago")}`;
    if (weeks < 4) return `${weeks} ${t("time.weeks")} ${t("time.ago")}`;
    if (months < 12) return `${months} ${t("time.months")} ${t("time.ago")}`;
    return `${years} ${t("time.years")} ${t("time.ago")}`;
  }, [t]);

  const isRTL = false;
  const availableLocales: Locale[] = Object.keys(translations) as Locale[];

  const value: I18nContextValue = {
    locale,
    setLocale,
    t,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    isRTL,
    availableLocales,
  };

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      t: (key: string) => key,
      formatNumber: (num: number) => String(num),
      formatCurrency: (amount: number) => `₹${amount}`,
      formatDate: (date: Date) => date.toLocaleDateString(),
      formatRelativeTime: (date: Date) => date.toLocaleDateString(),
      isRTL: false,
      availableLocales: ["en"] as Locale[],
    };
  }

  return context;
}

export function useTranslation(namespace?: string) {
  const { t: translate, ...rest } = useI18n();

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return translate(fullKey, params);
  }, [translate, namespace]);

  return { t, ...rest };
}

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  bn: "বাংলা",
  ne: "नेपाली",
  mr: "मराठी",
  gu: "ગુજરાતી",
  ta: "தமிழ்",
  te: "తెలుగు",
};
