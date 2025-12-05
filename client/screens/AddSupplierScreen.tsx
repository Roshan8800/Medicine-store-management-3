import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing } from "@/constants/theme";

export default function AddSupplierScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/suppliers", {
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      Alert.alert("Success", "Supplier added successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to add supplier");
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Supplier name is required");
      return;
    }
    createMutation.mutate();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <ThemedText type="h4" style={styles.sectionTitle}>Basic Information</ThemedText>
        <View style={styles.formSection}>
          <TextInput
            label="Supplier Name *"
            placeholder="Enter supplier name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            label="Contact Person"
            placeholder="Enter contact person name"
            value={contactPerson}
            onChangeText={setContactPerson}
            autoCapitalize="words"
          />
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Contact Details</ThemedText>
        <View style={styles.formSection}>
          <TextInput
            label="Phone"
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            label="Email"
            placeholder="Enter email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            label="Address"
            placeholder="Enter full address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
            style={{ height: 60, textAlignVertical: "top" }}
          />
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>Business Details</ThemedText>
        <View style={styles.formSection}>
          <TextInput
            label="GST Number"
            placeholder="Enter GST number"
            value={gstNumber}
            onChangeText={setGstNumber}
            autoCapitalize="characters"
          />
          <TextInput
            label="Notes"
            placeholder="Additional notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top" }}
          />
        </View>

        <Button 
          onPress={handleSubmit} 
          disabled={createMutation.isPending}
          style={{ marginTop: Spacing.xl }}
        >
          {createMutation.isPending ? "Adding..." : "Add Supplier"}
        </Button>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  formSection: {
    gap: Spacing.md,
  },
});
