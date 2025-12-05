import { Platform } from "react-native";

// Binayak Pharmacy Design System Colors
const primaryBlue = "#2196F3";
const primaryBlueDark = "#1976D2";
const accentGreen = "#4CAF50";
const accentGreenDark = "#388E3C";
const warningAmber = "#FFA726";
const warningAmberDark = "#F57C00";
const errorRed = "#F44336";
const errorRedDark = "#D32F2F";

export const Colors = {
  light: {
    text: "#212121",
    textDefault: "#212121",
    textSecondary: "#757575",
    textDisabled: "#BDBDBD",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: primaryBlue,
    link: primaryBlue,
    primary: primaryBlue,
    primaryDark: primaryBlueDark,
    accent: accentGreen,
    warning: warningAmber,
    error: errorRed,
    success: accentGreen,
    info: "#2196F3",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F5F5F5",
    backgroundElevated: "#FFFFFF",
    backgroundSecondary: "#EEEEEE",
    backgroundTertiary: "#E0E0E0",
    cardBackground: "#FFFFFF",
    border: "#E0E0E0",
    divider: "#EEEEEE",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  dark: {
    text: "#ECEDEE",
    textDefault: "#ECEDEE",
    textSecondary: "#9BA1A6",
    textDisabled: "#687076",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#64B5F6",
    link: "#64B5F6",
    primary: "#64B5F6",
    primaryDark: "#42A5F5",
    accent: "#81C784",
    warning: "#FFB74D",
    error: "#EF5350",
    success: "#81C784",
    info: "#64B5F6",
    backgroundRoot: "#121212",
    backgroundDefault: "#1E1E1E",
    backgroundElevated: "#2A2A2A",
    backgroundSecondary: "#2A2A2A",
    backgroundTertiary: "#353535",
    cardBackground: "#1E1E1E",
    border: "#404040",
    divider: "#353535",
    overlay: "rgba(0, 0, 0, 0.7)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  xxxl: 64,
  inputHeight: 48,
  buttonHeight: 52,
  fabSize: 56,
  iconSize: 24,
  iconSizeLg: 32,
  iconSizeSm: 20,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
};

export const Shadows = {
  level1: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  level2: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  level3: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
