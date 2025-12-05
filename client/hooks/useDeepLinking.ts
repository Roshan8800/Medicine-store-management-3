import { useEffect, useCallback, useRef, useState } from "react";
import * as Linking from "expo-linking";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type DeepLinkRoute = {
  screen: keyof RootStackParamList;
  params?: Record<string, string | number>;
};

type RouteConfig = {
  screen: keyof RootStackParamList;
  paramMapper?: (params: Record<string, string>) => Record<string, string | number>;
};

interface DeepLinkConfig {
  prefix: string;
  routes: Record<string, RouteConfig>;
}

interface UseDeepLinkingResult {
  initialUrl: string | null;
  currentUrl: string | null;
  navigateToPath: (path: string, params?: Record<string, string>) => void;
  createLink: (path: string, params?: Record<string, string>) => string;
  parseUrl: (url: string) => { path: string; params: Record<string, string> } | null;
}

const defaultConfig: DeepLinkConfig = {
  prefix: Linking.createURL("/"),
  routes: {
    "medicines": { screen: "Main" },
    "medicines/:id": { 
      screen: "MedicineDetail",
      paramMapper: (params) => ({ medicineId: params.id }),
    },
    "inventory": { screen: "Main" },
    "suppliers": { screen: "SupplierList" },
    "settings": { screen: "Main" },
    "profile": { screen: "Profile" },
    "reports": { screen: "Reports" },
    "scanner": { screen: "BarcodeScanner" },
    "ai-chat": { screen: "AIChat" },
    "categories": { screen: "Categories" },
    "customers": { screen: "Customers" },
    "analytics": { screen: "Analytics" },
    "search": { screen: "Search" },
    "quick-sale": { screen: "QuickSale" },
    "notifications": { screen: "Notifications" },
    "low-stock": { screen: "LowStock" },
    "expiry": { screen: "ExpiryManagement" },
  },
};

export function useDeepLinking(
  config: DeepLinkConfig = defaultConfig
): UseDeepLinkingResult {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const isNavigating = useRef(false);

  const parseUrl = useCallback(
    (url: string): { path: string; params: Record<string, string> } | null => {
      try {
        const { path, queryParams } = Linking.parse(url);
        if (!path) return null;

        const params: Record<string, string> = {};
        if (queryParams) {
          Object.entries(queryParams).forEach(([key, value]) => {
            if (typeof value === "string") {
              params[key] = value;
            }
          });
        }

        return { path, params };
      } catch {
        return null;
      }
    },
    []
  );

  const matchRoute = useCallback(
    (
      path: string,
      params: Record<string, string>
    ): DeepLinkRoute | null => {
      for (const [pattern, routeConfig] of Object.entries(config.routes)) {
        const patternParts = pattern.split("/");
        const pathParts = path.split("/");

        if (patternParts.length !== pathParts.length) continue;

        let isMatch = true;
        const extractedParams: Record<string, string> = { ...params };

        for (let i = 0; i < patternParts.length; i++) {
          const patternPart = patternParts[i];
          const pathPart = pathParts[i];

          if (patternPart.startsWith(":")) {
            const paramName = patternPart.slice(1);
            extractedParams[paramName] = pathPart;
          } else if (patternPart !== pathPart) {
            isMatch = false;
            break;
          }
        }

        if (isMatch) {
          const mappedParams = routeConfig.paramMapper 
            ? routeConfig.paramMapper(extractedParams)
            : extractedParams;
          return { screen: routeConfig.screen, params: mappedParams };
        }
      }

      return null;
    },
    [config.routes]
  );

  const handleDeepLink = useCallback(
    (url: string) => {
      if (isNavigating.current) return;

      setCurrentUrl(url);
      const parsed = parseUrl(url);
      if (!parsed) return;

      const route = matchRoute(parsed.path, parsed.params);
      if (!route) return;

      isNavigating.current = true;

      try {
        // @ts-ignore - dynamic navigation params
        navigation.navigate(route.screen, route.params);
      } finally {
        setTimeout(() => {
          isNavigating.current = false;
        }, 500);
      }
    },
    [navigation, parseUrl, matchRoute]
  );

  useEffect(() => {
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        setInitialUrl(url);
        handleDeepLink(url);
      }
    };

    getInitialURL();
  }, [handleDeepLink]);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [handleDeepLink]);

  const navigateToPath = useCallback(
    (path: string, params?: Record<string, string>) => {
      let url = `${config.prefix}${path}`;
      if (params && Object.keys(params).length > 0) {
        const queryString = Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join("&");
        url += `?${queryString}`;
      }
      Linking.openURL(url);
    },
    [config.prefix]
  );

  const createLink = useCallback(
    (path: string, params?: Record<string, string>): string => {
      let url = `${config.prefix}${path}`;
      if (params && Object.keys(params).length > 0) {
        const queryString = Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join("&");
        url += `?${queryString}`;
      }
      return url;
    },
    [config.prefix]
  );

  return {
    initialUrl,
    currentUrl,
    navigateToPath,
    createLink,
    parseUrl,
  };
}

export function createProductLink(productId: string): string {
  return Linking.createURL(`medicines/${productId}`);
}

export function createOrderLink(orderId: string): string {
  return Linking.createURL(`orders/${orderId}`);
}

export function createCustomerLink(customerId: string): string {
  return Linking.createURL(`customers/${customerId}`);
}

export function createSupplierLink(supplierId: string): string {
  return Linking.createURL(`suppliers/${supplierId}`);
}

export async function openExternalUrl(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function openEmail(
  email: string,
  subject?: string,
  body?: string
): Promise<boolean> {
  let url = `mailto:${email}`;
  const params: string[] = [];

  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);

  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }

  return openExternalUrl(url);
}

export async function openPhone(phoneNumber: string): Promise<boolean> {
  const url = `tel:${phoneNumber.replace(/\s/g, "")}`;
  return openExternalUrl(url);
}

export async function openSMS(
  phoneNumber: string,
  message?: string
): Promise<boolean> {
  let url = `sms:${phoneNumber.replace(/\s/g, "")}`;
  if (message) {
    url += `?body=${encodeURIComponent(message)}`;
  }
  return openExternalUrl(url);
}

export async function openMaps(
  address: string,
  coordinates?: { lat: number; lng: number }
): Promise<boolean> {
  let url: string;

  if (coordinates) {
    url = `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
  } else {
    url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
  }

  return openExternalUrl(url);
}
