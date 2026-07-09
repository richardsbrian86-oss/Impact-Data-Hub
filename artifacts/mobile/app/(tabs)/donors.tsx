import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDonorTrends,
  useListDonors,
  useCreateDonor,
  useUpdateDonor,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const TIER_LABELS: Record<string, string> = {
  major: "Major",
  mid_level: "Mid-Level",
  grassroots: "Grassroots",
};

const TIER_COLORS: Record<string, string> = {
  major: "#1B2F80",
  mid_level: "#7C5CFC",
  grassroots: "#008F19",
};

type Tier = "major" | "mid_level" | "grassroots";

type Donor = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tier: Tier;
  totalGiven: number;
  lastGiftAmount?: number;
  lastGiftDate?: string;
  firstGiftDate?: string;
  isRecurring: boolean;
  notes?: string;
};

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function TierPicker({
  value,
  onChange,
  colors,
}: {
  value: Tier;
  onChange: (t: Tier) => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  const tiers: Tier[] = ["major", "mid_level", "grassroots"];
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
      {tiers.map((t) => {
        const selected = value === t;
        const tc = TIER_COLORS[t] ?? colors.primary;
        return (
          <TouchableOpacity
            key={t}
            onPress={() => onChange(t)}
            style={[
              styles.tierChip,
              {
                backgroundColor: selected ? tc + "22" : colors.muted,
                borderColor: selected ? tc : colors.border,
                borderWidth: selected ? 1.5 : 1,
              },
            ]}
          >
            <Text style={[styles.tierChipText, { color: selected ? tc : colors.mutedForeground }]}>
              {TIER_LABELS[t]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DonorFormModal({
  visible,
  onClose,
  editing,
}: {
  visible: boolean;
  onClose: () => void;
  editing: Donor | null;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const createMutation = useCreateDonor();
  const updateMutation = useUpdateDonor();

  const [firstName, setFirstName] = useState(editing?.firstName ?? "");
  const [lastName, setLastName] = useState(editing?.lastName ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [tier, setTier] = useState<Tier>(editing?.tier ?? "grassroots");
  const [totalGiven, setTotalGiven] = useState(String(editing?.totalGiven ?? "0"));
  const [isRecurring, setIsRecurring] = useState(editing?.isRecurring ?? false);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert("Validation", "First name, last name, and email are required");
      return;
    }
    const data = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      tier,
      totalGiven: Number(totalGiven) || 0,
      isRecurring,
    };

    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: ["listDonors"] });
      queryClient.invalidateQueries({ queryKey: ["getDonorTrends"] });
      onClose();
    };
    const onError = () => Alert.alert("Error", "Failed to save donor");

    if (editing) {
      updateMutation.mutate({ id: editing.id, data }, { onSuccess, onError });
    } else {
      createMutation.mutate({ data }, { onSuccess, onError });
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground },
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
            { paddingTop: insets.top + 16, borderBottomColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.modalHeaderBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {editing ? "Edit Donor" : "Add Donor"}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.modalHeaderBtn} disabled={isLoading}>
            {isLoading ? (
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
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>First Name</Text>
          <TextInput style={inputStyle} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={colors.mutedForeground} />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Last Name</Text>
          <TextInput style={inputStyle} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={colors.mutedForeground} />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
          <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.mutedForeground} />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Donor Tier</Text>
          <TierPicker value={tier} onChange={setTier} colors={colors} />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Total Given ($)</Text>
          <TextInput style={inputStyle} value={totalGiven} onChangeText={setTotalGiven} keyboardType="numeric" placeholder="e.g. 5000" placeholderTextColor={colors.mutedForeground} />

          <TouchableOpacity
            onPress={() => setIsRecurring((v) => !v)}
            style={[
              styles.toggleRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Recurring Donor</Text>
            <View
              style={[
                styles.toggle,
                { backgroundColor: isRecurring ? colors.primary : colors.muted },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: isRecurring ? 20 : 2 }] },
                ]}
              />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DonorRow({
  donor,
  onEdit,
}: {
  donor: Donor;
  onEdit: (d: Donor) => void;
}) {
  const colors = useColors();
  const tierColor = TIER_COLORS[donor.tier] ?? colors.primary;
  const initials = getInitials(donor.firstName, donor.lastName);

  return (
    <View
      style={[
        styles.donorRow,
        { borderBottomColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: tierColor + "22" }]}>
        <Text style={[styles.avatarText, { color: tierColor }]}>{initials}</Text>
      </View>
      <View style={styles.donorInfo}>
        <Text style={[styles.donorName, { color: colors.foreground }]}>
          {donor.firstName} {donor.lastName}
        </Text>
        <View style={styles.donorMeta}>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + "18" }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>
              {TIER_LABELS[donor.tier] ?? donor.tier}
            </Text>
          </View>
          {donor.isRecurring && (
            <View style={[styles.recurringBadge, { backgroundColor: "#22c55e18" }]}>
              <Text style={[styles.recurringText, { color: "#22c55e" }]}>Recurring</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.donorAmount, { color: colors.foreground }]}>
        {formatCurrency(donor.totalGiven)}
      </Text>
      <TouchableOpacity onPress={() => onEdit(donor)} style={styles.editIcon}>
        <Feather name="edit-2" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

export default function DonorsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const trendsQuery = useGetDonorTrends();
  const donorsQuery = useListDonors({});

  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);

  const openAdd = useCallback(() => {
    setEditingDonor(null);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((d: Donor) => {
    setEditingDonor(d);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingDonor(null);
  }, []);

  const refresh = useCallback(() => {
    trendsQuery.refetch();
    donorsQuery.refetch();
  }, [trendsQuery, donorsQuery]);

  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom + 90;

  const isLoading = trendsQuery.isLoading || donorsQuery.isLoading;

  const allDonors = (donorsQuery.data ?? []) as Donor[];
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? allDonors.filter(
          (d) =>
            `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
            d.email.toLowerCase().includes(q)
        )
      : allDonors;
  }, [allDonors, search]);

  const trends = trendsQuery.data;
  const tierBreakdown = trends?.tierBreakdown ?? [];

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const ListHeader = (
    <View>
      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Donors</Text>
        <TouchableOpacity
          onPress={openAdd}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
        {allDonors.length} total · {(trends?.retentionRate ?? 0).toFixed(1)}% retention
      </Text>

      {tierBreakdown.length > 0 && (
        <View style={styles.tierRow}>
          {tierBreakdown.map((tier) => {
            const tc = TIER_COLORS[tier.tier] ?? colors.primary;
            return (
              <View key={tier.tier} style={[styles.tierCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.tierCardLabel, { color: colors.mutedForeground }]}>
                  {TIER_LABELS[tier.tier] ?? tier.tier}
                </Text>
                <Text style={[styles.tierCardCount, { color: tc }]}>{tier.count}</Text>
                <Text style={[styles.tierCardGiven, { color: colors.foreground }]}>
                  {formatCurrency(tier.totalGiven)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search donors…"
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <DonorRow donor={item} onEdit={openEdit} />}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.listContent, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {search ? "No donors match your search" : "No donors found"}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={trendsQuery.isFetching || donorsQuery.isFetching}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      />

      <DonorFormModal
        visible={modalVisible}
        onClose={closeModal}
        editing={editingDonor}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 16 },
  screenHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  screenTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  screenSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tierRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  tierCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center" },
  tierCardLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.3 },
  tierCardCount: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 3 },
  tierCardGiven: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", padding: 0 },
  donorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  donorInfo: { flex: 1 },
  donorName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  donorMeta: { flexDirection: "row", gap: 4, marginTop: 2 },
  tierBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  tierText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  recurringBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  recurringText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  donorAmount: { fontSize: 13, fontFamily: "Inter_700Bold", flexShrink: 0 },
  editIcon: { padding: 6 },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
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
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6, marginTop: 14 },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  tierChip: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  tierChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  toggleLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: "center" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
});
