import React from "react";
import { View, StyleSheet, ViewStyle, ImageStyle, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  onPress?: () => void;
  showBorder?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  icon?: keyof typeof Feather.glyphMap;
}

const SIZES: Record<AvatarSize, { container: number; text: number; icon: number }> = {
  xs: { container: 24, text: 10, icon: 12 },
  sm: { container: 32, text: 12, icon: 14 },
  md: { container: 40, text: 14, icon: 18 },
  lg: { container: 56, text: 20, icon: 24 },
  xl: { container: 72, text: 26, icon: 32 },
  "2xl": { container: 96, text: 36, icon: 42 },
};

export function Avatar({
  source,
  name,
  size = "md",
  style,
  onPress,
  showBorder = false,
  borderColor,
  backgroundColor,
  textColor,
  icon,
}: AvatarProps) {
  const { theme } = useTheme();
  const sizeConfig = SIZES[size];

  const getInitials = (name?: string): string => {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getBackgroundColor = (): string => {
    if (backgroundColor) return backgroundColor;
    if (!name) return theme.divider;
    const colors = [
      "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
      "#EC4899", "#06B6D4", "#F97316", "#84CC16", "#6366F1",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const containerStyle: ViewStyle = {
    width: sizeConfig.container,
    height: sizeConfig.container,
    borderRadius: sizeConfig.container / 2,
    backgroundColor: source ? "transparent" : getBackgroundColor(),
    borderWidth: showBorder ? 2 : 0,
    borderColor: borderColor || theme.backgroundElevated,
  };

  const imageStyle: ImageStyle = {
    width: sizeConfig.container,
    height: sizeConfig.container,
    borderRadius: sizeConfig.container / 2,
  };

  const content = source ? (
    <Image
      source={{ uri: source }}
      style={imageStyle}
      contentFit="cover"
      transition={200}
    />
  ) : icon ? (
    <Feather name={icon} size={sizeConfig.icon} color={textColor || "#FFFFFF"} />
  ) : (
    <ThemedText
      style={[
        styles.initials,
        { fontSize: sizeConfig.text, color: textColor || "#FFFFFF" },
      ]}
    >
      {getInitials(name)}
    </ThemedText>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.container, containerStyle, style]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, containerStyle, style]}>
      {content}
    </View>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ source?: string; name?: string }>;
  max?: number;
  size?: AvatarSize;
  style?: ViewStyle;
  onPress?: () => void;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = "md",
  style,
  onPress,
}: AvatarGroupProps) {
  const { theme } = useTheme();
  const sizeConfig = SIZES[size];
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;
  const overlap = sizeConfig.container * 0.3;

  return (
    <Pressable
      style={[styles.groupContainer, style]}
      onPress={onPress}
      disabled={!onPress}
    >
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.groupItem,
            { marginLeft: index === 0 ? 0 : -overlap, zIndex: displayAvatars.length - index },
          ]}
        >
          <Avatar
            source={avatar.source}
            name={avatar.name}
            size={size}
            showBorder
            borderColor={theme.backgroundElevated}
          />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            styles.groupItem,
            styles.remainingBadge,
            {
              marginLeft: -overlap,
              width: sizeConfig.container,
              height: sizeConfig.container,
              borderRadius: sizeConfig.container / 2,
              backgroundColor: theme.textSecondary,
              borderWidth: 2,
              borderColor: theme.backgroundElevated,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.remainingText,
              { fontSize: sizeConfig.text * 0.7 },
            ]}
          >
            +{remaining}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

interface AvatarBadgeProps extends AvatarProps {
  badgeContent?: React.ReactNode;
  badgeColor?: string;
  badgePosition?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

export function AvatarWithBadge({
  badgeContent,
  badgeColor,
  badgePosition = "bottom-right",
  showOnlineStatus = false,
  isOnline = false,
  ...avatarProps
}: AvatarBadgeProps) {
  const { theme } = useTheme();
  const sizeConfig = SIZES[avatarProps.size || "md"];
  const badgeSize = Math.max(sizeConfig.container * 0.3, 12);

  const getBadgePosition = (): ViewStyle => {
    const offset = badgeSize * 0.1;
    switch (badgePosition) {
      case "top-right":
        return { top: offset, right: offset };
      case "top-left":
        return { top: offset, left: offset };
      case "bottom-left":
        return { bottom: offset, left: offset };
      default:
        return { bottom: offset, right: offset };
    }
  };

  return (
    <View style={styles.badgeContainer}>
      <Avatar {...avatarProps} />
      {(badgeContent || showOnlineStatus) && (
        <View
          style={[
            styles.badge,
            getBadgePosition(),
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor:
                showOnlineStatus
                  ? isOnline
                    ? theme.success
                    : theme.textDisabled
                  : badgeColor || theme.error,
              borderWidth: 2,
              borderColor: theme.backgroundElevated,
            },
          ]}
        >
          {badgeContent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  initials: {
    fontWeight: "600",
  },
  groupContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupItem: {},
  remainingBadge: {
    justifyContent: "center",
    alignItems: "center",
  },
  remainingText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  badgeContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
});
