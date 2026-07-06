import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetOrgProfile,
  useUpdateOrgProfile,
  type OrgProfile,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/auth-context";

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function AllocationBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.allocRow}>
      <View style={[styles.allocDot, { backgroundColor: color }]} />
      <Text style={[styles.allocLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.allocTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.allocFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.allocPct, { color: colors.foreground }]}>{pct}%</Text>
    </View>
  );
}

function EditOrgModal({
  visible,
  onClose,
  profile,
}: {
  visible: boolean;
  onClose: () => void;
  profile: OrgProfile;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const mutation = useUpdateOrgProfile();

  const [name, setName] = useState(profile?.name ?? "");
  const [mission, setMission] = useState(profile?.mission ?? "");
  const [annualBudget, setAnnualBudget] = useState(
    String(profile?.annualBudget ?? "")
  );
  const [programPct, setProgramPct] = useState(String(profile?.programPct ?? ""));
  const [adminPct, setAdminPct] = useState(String(profile?.adminPct ?? ""));
  const [fundraisingPct, setFundraisingPct] = useState(
    String(profile?.fundraisingPct ?? "")
  );

  const total =
    (Number(programPct) || 0) +
    (Number(adminPct) || 0) +
    (Number(fundraisingPct) || 0);

  const handleSave = () => {
    if (!profile) return;
    if (total !== 100) {
      Alert.alert("Validation", "Program + Admin + Fundraising must equal 100%");
      return;
    }
    mutation.mutate(
      {
        data: {
          name: name.trim(),
          mission: mission.trim(),
          founded: profile.founded,
          city: profile.city,
          state: profile.state,
          website: profile.website,
          annualBudget: Number(annualBudget) || profile.annualBudget,
          fiscalYearStart: profile.fiscalYearStart,
          programPct: Number(programPct),
          adminPct: Number(adminPct),
          fundraisingPct: Number(fundraisingPct),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getOrgProfile"] });
          onClose();
        },
        onError: () => {
          Alert.alert("Error", "Failed to update organization profile");
        },
      }
    );
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.muted,
      borderColor: colors.border,
      color: colors.foreground,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.modalHeader,
            {
              paddingTop: insets.top + 16,
              borderBottomColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.modalHeaderBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Edit Organization
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.modalHeaderBtn}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Organization Name
          </Text>
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="Organization name"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Mission Statement
          </Text>
          <TextInput
            style={[inputStyle, { height: 90, textAlignVertical: "top" }]}
            value={mission}
            onChangeText={setMission}
            multiline
            placeholder="Mission statement"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Annual Budget ($)
          </Text>
          <TextInput
            style={inputStyle}
            value={annualBudget}
            onChangeText={setAnnualBudget}
            keyboardType="numeric"
            placeholder="e.g. 2840000"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            BUDGET ALLOCATION
          </Text>
          <View
            style={[
              styles.allocHint,
              {
                backgroundColor: total === 100 ? "#22c55e18" : "#f59e0b18",
                borderColor: total === 100 ? "#22c55e" : "#f59e0b",
              },
            ]}
          >
            <Text
              style={{
                color: total === 100 ? "#22c55e" : "#f59e0b",
                fontSize: 13,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Total: {total}% {total === 100 ? "✓" : `(need ${100 - total}% more)`}
            </Text>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Program %
          </Text>
          <TextInput
            style={inputStyle}
            value={programPct}
            onChangeText={setProgramPct}
            keyboardType="numeric"
            placeholder="e.g. 78"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Administrative %
          </Text>
          <TextInput
            style={inputStyle}
            value={adminPct}
            onChangeText={setAdminPct}
            keyboardType="numeric"
            placeholder="e.g. 14"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Fundraising %
          </Text>
          <TextInput
            style={inputStyle}
            value={fundraisingPct}
            onChangeText={setFundraisingPct}
            keyboardType="numeric"
            placeholder="e.g. 8"
            placeholderTextColor={colors.mutedForeground}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [editOpen, setEditOpen] = useState(false);
  const { signOut } = useAuth();

  const orgQuery = useGetOrgProfile();
  const org = orgQuery.data;

  const handleSignOut = useCallback(() => {
    // react-native-web does not support multi-button Alert.alert (no-op),
    // so use the browser confirm dialog on web.
    if (Platform.OS === "web") {
      const confirmed =
        typeof window === "undefined" ||
        window.confirm("Are you sure you want to sign out?");
      if (confirmed) void signOut();
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          void signOut();
        },
      },
    ]);
  }, [signOut]);

  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom + 90;

  const handleOpenEdit = useCallback(() => {
    setEditOpen(true);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Settings</Text>
        <TouchableOpacity
          onPress={handleOpenEdit}
          style={[styles.editBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="edit-2" size={15} color="#fff" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {orgQuery.isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : org ? (
        <>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.orgName, { color: colors.foreground }]}>{org.name}</Text>
            <Text style={[styles.orgMission, { color: colors.mutedForeground }]}>
              {org.mission}
            </Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            ORGANIZATION DETAILS
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InfoRow label="Founded" value={String(org.founded)} />
            <InfoRow label="Location" value={`${org.city}, ${org.state}`} />
            {org.website && <InfoRow label="Website" value={org.website} />}
            <InfoRow label="Annual Budget" value={formatCurrency(org.annualBudget)} />
            <InfoRow label="Fiscal Year Start" value={org.fiscalYearStart} />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            BUDGET ALLOCATION
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AllocationBar label="Program" pct={org.programPct} color={colors.chartBlue} />
            <AllocationBar label="Administrative" pct={org.adminPct} color={colors.chartPurple} />
            <AllocationBar label="Fundraising" pct={org.fundraisingPct} color={colors.chartPink} />
          </View>
        </>
      ) : null}

      <TouchableOpacity
        onPress={handleSignOut}
        style={[
          styles.signOutBtn,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <Feather name="log-out" size={16} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {org && (
        <EditOrgModal
          visible={editOpen}
          onClose={() => setEditOpen(false)}
          profile={org}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 4,
  },
  orgName: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 6 },
  orgMission: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  infoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1.5, textAlign: "right" },
  allocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  allocDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  allocLabel: { fontSize: 13, fontFamily: "Inter_500Medium", width: 110 },
  allocTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  allocFill: { height: 6, borderRadius: 3 },
  allocPct: { fontSize: 13, fontFamily: "Inter_700Bold", width: 38, textAlign: "right" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalHeaderBtn: { width: 60, alignItems: "flex-start" },
  modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modalContent: { padding: 16 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    marginTop: 12,
  },
  sectionSeparator: { height: 1, marginVertical: 16 },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  allocHint: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
    alignItems: "center",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    marginTop: 24,
  },
  signOutText: {
    color: "#ef4444",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
