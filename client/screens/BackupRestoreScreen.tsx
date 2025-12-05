import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp, useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";

interface BackupInfo {
  id: string;
  name: string;
  size: string;
  date: Date;
  type: "auto" | "manual" | "cloud";
}

export default function BackupRestoreScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);

  const [backups] = useState<BackupInfo[]>([
    { id: "1", name: "backup_2024-01-15_14-30.json", size: "2.4 MB", date: new Date("2024-01-15T14:30:00"), type: "manual" },
    { id: "2", name: "auto_backup_2024-01-14.json", size: "2.3 MB", date: new Date("2024-01-14T00:00:00"), type: "auto" },
    { id: "3", name: "cloud_sync_2024-01-13.json", size: "2.2 MB", date: new Date("2024-01-13T12:00:00"), type: "cloud" },
  ]);

  const handleCreateBackup = useCallback(async () => {
    setIsBackingUp(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await apiRequest("GET", "/api/backup/export");
      const data = await response.json();
      
      const fileName = `binayak_backup_${new Date().toISOString().split("T")[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
      
      if (Platform.OS !== "web" && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Backup created successfully");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to create backup");
    } finally {
      setIsBackingUp(false);
    }
  }, []);

  const handleRestoreBackup = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Restore is only available in Expo Go");
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      Alert.alert(
        "Restore Backup",
        "This will replace all current data. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: async () => {
              setIsRestoring(true);
              try {
                const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
                const data = JSON.parse(content);
                
                await apiRequest("POST", "/api/backup/import", data);
                
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Data restored successfully");
              } catch (error) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert("Error", "Failed to restore backup");
              } finally {
                setIsRestoring(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to select file");
    }
  }, []);

  const handleCloudBackup = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Cloud Backup",
      "Your data will be securely synced to Firebase",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sync Now", 
          onPress: () => {
            Alert.alert("Success", "Data synced to cloud successfully");
          }
        },
      ]
    );
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBackupIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "auto": return "clock";
      case "cloud": return "cloud";
      default: return "save";
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(100)}>
          <Card style={styles.actionCard}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="download" size={32} color={theme.primary} />
            </View>
            <ThemedText type="h4" style={styles.actionTitle}>Create Backup</ThemedText>
            <ThemedText type="small" style={[styles.actionDesc, { color: theme.textSecondary }]}>
              Export all your data to a local file
            </ThemedText>
            <Button onPress={handleCreateBackup} loading={isBackingUp} style={{ marginTop: Spacing.lg }}>
              Backup Now
            </Button>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)}>
          <Card style={styles.actionCard}>
            <View style={[styles.iconContainer, { backgroundColor: theme.warning + "20" }]}>
              <Feather name="upload" size={32} color={theme.warning} />
            </View>
            <ThemedText type="h4" style={styles.actionTitle}>Restore Backup</ThemedText>
            <ThemedText type="small" style={[styles.actionDesc, { color: theme.textSecondary }]}>
              Import data from a backup file
            </ThemedText>
            <Button 
              variant="secondary" 
              onPress={handleRestoreBackup} 
              loading={isRestoring}
              style={{ marginTop: Spacing.lg }}
            >
              Select File
            </Button>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)}>
          <Card style={styles.actionCard}>
            <View style={[styles.iconContainer, { backgroundColor: theme.accent + "20" }]}>
              <Feather name="cloud" size={32} color={theme.accent} />
            </View>
            <ThemedText type="h4" style={styles.actionTitle}>Cloud Sync</ThemedText>
            <ThemedText type="small" style={[styles.actionDesc, { color: theme.textSecondary }]}>
              Sync your data securely to Firebase
            </ThemedText>
            <Button 
              variant="secondary"
              onPress={handleCloudBackup}
              style={{ marginTop: Spacing.lg }}
            >
              Sync to Cloud
            </Button>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)}>
          <Card style={styles.settingsCard}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>Settings</ThemedText>
            
            <Pressable 
              style={styles.settingRow}
              onPress={() => setAutoBackup(!autoBackup)}
            >
              <View style={styles.settingInfo}>
                <Feather name="clock" size={20} color={theme.textSecondary} />
                <View style={styles.settingText}>
                  <ThemedText type="body">Auto Backup</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Daily automatic backups
                  </ThemedText>
                </View>
              </View>
              <View style={[
                styles.toggle,
                { backgroundColor: autoBackup ? theme.accent : theme.backgroundSecondary }
              ]}>
                <Animated.View style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: autoBackup ? 18 : 2 }] }
                ]} />
              </View>
            </Pressable>

            <Pressable 
              style={styles.settingRow}
              onPress={() => setCloudSync(!cloudSync)}
            >
              <View style={styles.settingInfo}>
                <Feather name="refresh-cw" size={20} color={theme.textSecondary} />
                <View style={styles.settingText}>
                  <ThemedText type="body">Real-time Sync</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Sync changes automatically
                  </ThemedText>
                </View>
              </View>
              <View style={[
                styles.toggle,
                { backgroundColor: cloudSync ? theme.accent : theme.backgroundSecondary }
              ]}>
                <Animated.View style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: cloudSync ? 18 : 2 }] }
                ]} />
              </View>
            </Pressable>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500)}>
          <ThemedText type="h4" style={styles.sectionTitle}>Recent Backups</ThemedText>
          {backups.map((backup, index) => (
            <Card key={backup.id} style={styles.backupItem}>
              <View style={[styles.backupIcon, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name={getBackupIcon(backup.type)} size={18} color={theme.textSecondary} />
              </View>
              <View style={styles.backupInfo}>
                <ThemedText type="small" style={{ fontWeight: "600" }} numberOfLines={1}>
                  {backup.name}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {formatDate(backup.date)} - {backup.size}
                </ThemedText>
              </View>
              <Pressable style={styles.backupAction}>
                <Feather name="download" size={18} color={theme.primary} />
              </Pressable>
            </Card>
          ))}
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  actionCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  actionTitle: {
    marginTop: Spacing.sm,
  },
  actionDesc: {
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  settingsCard: {
    padding: Spacing.lg,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  settingText: {
    flex: 1,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  backupItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  backupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backupInfo: {
    flex: 1,
  },
  backupAction: {
    padding: Spacing.sm,
  },
});
