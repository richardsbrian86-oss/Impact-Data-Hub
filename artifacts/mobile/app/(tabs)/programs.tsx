import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProgramOutcomes,
  useUpdateProgram,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { ProgressBar } from "@/components/ProgressBar";

type ProgramOutcome = {
  id: number;
  name: string;
  description: string;
  category: string;
  status: string;
  peopleServedTarget: number;
  peopleServedActual: number;
  peopleServedPct: number;
  outcomesTarget: number;
  outcomesActual: number;
  outcomesPct: number;
  annualBudget: number;
  costPerOutcome: number;
};

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  paused: "#f59e0b",
  completed: "#3b82f6",
};

type Status = "active" | "paused" | "completed";

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function StatusPicker({
  value,
  onChange,
  colors,
}: {
  value: Status;
  onChange: (s: Status) => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  const statuses: Status[] = ["active", "paused", "completed"];
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
      {statuses.map((s) => {
        const selected = value === s;
        const sc = STATUS_COLORS[s] ?? colors.primary;
        return (
          <TouchableOpacity
            key={s}
            onPress={() => onChange(s)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? sc + "22" : colors.muted,
                borderColor: selected ? sc : colors.border,
                borderWidth: selected ? 1.5 : 1,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: selected ? sc : colors.mutedForeground }]}>
              {s}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function EditProgramModal({
  visible,
  onClose,
  program,
}: {
  visible: boolean;
  onClose: () => void;
  program: ProgramOutcome | null;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const mutation = useUpdateProgram();

  const [status, setStatus] = useState<Status>((program?.status as Status) ?? "active");
  const [peopleServedActual, setPeopleServedActual] = useState(
    String(program?.peopleServedActual ?? "")
  );
  const [outcomesActual, setOutcomesActual] = useState(
    String(program?.outcomesActual ?? "")
  );
  const [costPerOutcome, setCostPerOutcome] = useState(
    String(program?.costPerOutcome ?? "")
  );

  const handleSave = () => {
    if (!program) return;
    mutation.mutate(
      {
        id: program.id,
        data: {
          name: program.name,
          description: program.description,
          category: program.category,
          status,
          annualBudget: program.annualBudget,
          peopleServedTarget: program.peopleServedTarget,
          peopleServedActual: Number(peopleServedActual) || program.peopleServedActual,
          outcomesTarget: program.outcomesTarget,
          outcomesActual: Number(outcomesActual) || program.outcomesActual,
          costPerOutcome: Number(costPerOutcome) || program.costPerOutcome,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getProgramOutcomes"] });
          queryClient.invalidateQueries({ queryKey: ["listPrograms"] });
          onClose();
        },
        onError: () => Alert.alert("Error", "Failed to update program"),
      }
    );
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
          <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>
            {program?.name ?? "Edit Program"}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.modalHeaderBtn} disabled={mutation.isPending}>
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
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Status</Text>
          <StatusPicker value={status} onChange={setStatus} colors={colors} />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            People Served (Actual)
          </Text>
          <Text style={[styles.targetHint, { color: colors.mutedForeground }]}>
            Target: {program?.peopleServedTarget.toLocaleString()}
          </Text>
          <TextInput
            style={inputStyle}
            value={peopleServedActual}
            onChangeText={setPeopleServedActual}
            keyboardType="numeric"
            placeholder={String(program?.peopleServedActual ?? "")}
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Outcomes (Actual)
          </Text>
          <Text style={[styles.targetHint, { color: colors.mutedForeground }]}>
            Target: {program?.outcomesTarget.toLocaleString()}
          </Text>
          <TextInput
            style={inputStyle}
            value={outcomesActual}
            onChangeText={setOutcomesActual}
            keyboardType="numeric"
            placeholder={String(program?.outcomesActual ?? "")}
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Cost Per Outcome ($)
          </Text>
          <TextInput
            style={inputStyle}
            value={costPerOutcome}
            onChangeText={setCostPerOutcome}
            keyboardType="numeric"
            placeholder={String(program?.costPerOutcome ?? "")}
            placeholderTextColor={colors.mutedForeground}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ProgramCard({ item, onEdit }: { item: ProgramOutcome; onEdit: (p: ProgramOutcome) => void }) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[item.status] ?? colors.mutedForeground;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.cardActions}>
            <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{item.status}</Text>
            </View>
            <TouchableOpacity onPress={() => onEdit(item)} style={styles.editBtn}>
              <Feather name="edit-2" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>{item.category}</Text>
      </View>

      <View style={styles.metricsSection}>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>People Served</Text>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>
            {item.peopleServedActual.toLocaleString()} / {item.peopleServedTarget.toLocaleString()}
          </Text>
        </View>
        <ProgressBar value={item.peopleServedPct} />

        <View style={[styles.metricRow, { marginTop: 10 }]}>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Outcomes</Text>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>
            {item.outcomesActual.toLocaleString()} / {item.outcomesTarget.toLocaleString()}
          </Text>
        </View>
        <ProgressBar value={item.outcomesPct} color={colors.chartPurple} />
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>Budget</Text>
          <Text style={[styles.footerValue, { color: colors.foreground }]}>{formatCurrency(item.annualBudget)}</Text>
        </View>
        <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>Cost / Outcome</Text>
          <Text style={[styles.footerValue, { color: colors.foreground }]}>{formatCurrency(item.costPerOutcome)}</Text>
        </View>
        <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>Completion</Text>
          <Text style={[styles.footerValue, { color: item.outcomesPct >= 100 ? "#22c55e" : colors.foreground }]}>
            {item.outcomesPct.toFixed(0)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ProgramsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const query = useGetProgramOutcomes();

  const [editingProgram, setEditingProgram] = useState<ProgramOutcome | null>(null);

  const openEdit = useCallback((p: ProgramOutcome) => setEditingProgram(p), []);
  const closeEdit = useCallback(() => setEditingProgram(null), []);

  const refresh = useCallback(() => query.refetch(), [query]);

  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom + 90;

  if (query.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const programs = (query.data ?? []) as ProgramOutcome[];

  return (
    <>
      <FlatList
        data={programs}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ProgramCard item={item} onEdit={openEdit} />}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.listContent, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={programs.length > 0}
        refreshControl={
          <RefreshControl refreshing={query.isFetching} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>Programs</Text>
            <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>
                {programs.filter((p) => p.status === "active").length} active
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No programs found</Text>
          </View>
        }
      />

      <EditProgramModal
        visible={editingProgram !== null}
        onClose={closeEdit}
        program={editingProgram}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 16 },
  listHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  screenTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  countBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  cardHeader: { padding: 14, paddingBottom: 10 },
  cardTitleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1, lineHeight: 20 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  editBtn: { padding: 4 },
  category: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  metricsSection: { paddingHorizontal: 14, paddingBottom: 12 },
  metricRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  metricLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  metricValue: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  cardFooter: { flexDirection: "row", borderTopWidth: 1 },
  footerItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  footerDivider: { width: 1, marginVertical: 8 },
  footerLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
  footerValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", paddingTop: 60 },
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
  modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  saveBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modalContent: { padding: 16 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4, marginTop: 14 },
  targetHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  chip: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
});
