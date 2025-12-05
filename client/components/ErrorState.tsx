import React from "react";
import { View, StyleSheet, ViewStyle, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type ErrorType = "network" | "server" | "auth" | "notFound" | "permission" | "validation" | "generic";

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: () => void;
  style?: ViewStyle;
  compact?: boolean;
  showDetails?: boolean;
}

const ERROR_CONFIG: Record<ErrorType, { icon: keyof typeof Feather.glyphMap; title: string; message: string }> = {
  network: {
    icon: "wifi-off",
    title: "Connection Error",
    message: "Unable to connect to the server. Please check your internet connection and try again.",
  },
  server: {
    icon: "server",
    title: "Server Error",
    message: "Something went wrong on our end. Our team has been notified and is working on a fix.",
  },
  auth: {
    icon: "lock",
    title: "Authentication Error",
    message: "Your session has expired or you don't have permission to access this resource.",
  },
  notFound: {
    icon: "file-minus",
    title: "Not Found",
    message: "The resource you're looking for doesn't exist or has been moved.",
  },
  permission: {
    icon: "shield-off",
    title: "Permission Denied",
    message: "You don't have permission to perform this action. Contact your administrator for access.",
  },
  validation: {
    icon: "alert-triangle",
    title: "Invalid Data",
    message: "Please check your input and try again. Some fields may contain invalid values.",
  },
  generic: {
    icon: "alert-circle",
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again or contact support if the problem persists.",
  },
};

export function ErrorState({
  type = "generic",
  title,
  message,
  error,
  onRetry,
  onGoBack,
  onContactSupport,
  style,
  compact = false,
  showDetails = false,
}: ErrorStateProps) {
  const { theme } = useTheme();
  const config = ERROR_CONFIG[type];
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.error + "15",
            width: compact ? 60 : 80,
            height: compact ? 60 : 80,
            borderRadius: compact ? 30 : 40,
          },
        ]}
      >
        <Feather
          name={config.icon}
          size={compact ? 28 : 36}
          color={theme.error}
        />
      </View>

      <ThemedText
        type={compact ? "body" : "h4"}
        style={[styles.title, { color: theme.textDefault }, compact && { fontWeight: "600" }]}
      >
        {title || config.title}
      </ThemedText>

      <ThemedText
        style={[
          styles.description,
          { color: theme.textSecondary },
          compact && styles.compactDescription,
        ]}
      >
        {message || config.message}
      </ThemedText>

      {showDetails && errorMessage && (
        <Pressable
          onPress={() => setDetailsExpanded(!detailsExpanded)}
          style={[styles.detailsContainer, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.detailsHeader}>
            <ThemedText style={[styles.detailsLabel, { color: theme.textSecondary }]}>
              Error Details
            </ThemedText>
            <Feather
              name={detailsExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.textSecondary}
            />
          </View>
          {detailsExpanded && (
            <ThemedText style={[styles.errorDetails, { color: theme.error }]}>
              {errorMessage}
            </ThemedText>
          )}
        </Pressable>
      )}

      <View style={styles.actions}>
        {onRetry && (
          <Button onPress={onRetry} size={compact ? "small" : "medium"}>
            Try Again
          </Button>
        )}
        {onGoBack && (
          <Button
            onPress={onGoBack}
            variant="outline"
            size={compact ? "small" : "medium"}
          >
            Go Back
          </Button>
        )}
        {onContactSupport && (
          <Pressable onPress={onContactSupport} style={styles.supportLink}>
            <ThemedText style={[styles.supportText, { color: theme.primary }]}>
              Contact Support
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return <ErrorState type="network" onRetry={onRetry} />;
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return <ErrorState type="server" onRetry={onRetry} />;
}

export function AuthError({ onRetry, onGoBack }: { onRetry?: () => void; onGoBack?: () => void }) {
  return <ErrorState type="auth" onRetry={onRetry} onGoBack={onGoBack} />;
}

export function NotFoundError({ onGoBack }: { onGoBack?: () => void }) {
  return <ErrorState type="notFound" onGoBack={onGoBack} />;
}

export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.inlineContainer, { backgroundColor: theme.error + "10" }]}>
      <Feather name="alert-circle" size={16} color={theme.error} />
      <ThemedText style={[styles.inlineMessage, { color: theme.error }]}>
        {message}
      </ThemedText>
      {onRetry && (
        <Pressable onPress={onRetry}>
          <ThemedText style={[styles.inlineRetry, { color: theme.primary }]}>
            Retry
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
  },
  compact: {
    padding: Spacing.xl,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 300,
  },
  compactDescription: {
    fontSize: 13,
    maxWidth: 260,
  },
  detailsContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    width: "100%",
    maxWidth: 320,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  errorDetails: {
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: Spacing.sm,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.xl,
    justifyContent: "center",
  },
  supportLink: {
    paddingVertical: Spacing.sm,
  },
  supportText: {
    fontSize: 14,
    fontWeight: "500",
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  inlineMessage: {
    flex: 1,
    fontSize: 13,
  },
  inlineRetry: {
    fontSize: 13,
    fontWeight: "600",
  },
});
