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
  useGetFundingTrend,
  useCreateFundingEntry,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

type FundingPoint = {
  month: string;
  grants: number;
  individual: number;
  events: number;
  corporate: number;
  total: number;
};

type Source = "grants" | "individual" | "events" | "corporate";

const SOURCE_COLORS: Record<string, string> = {
  grants: "#1B2F80",
  individual: "#7C5CFC",
  corporate: "#0079F0",
  events: "#E05594",
};

const SOURCE_LABELS: Record<string, string> = {
  grants: "Grants",
  individual: "Individual",
  corporate: "Corporate",
  events: "Events",
};

const SOURCES: Source[] = ["grants", "individual", "corporate", "events"];

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function formatMonth(raw: string): string {
  const [year, month] = raw.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function AddEntryModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const mutation = useCreateFundingEntry();

  const todayStr = new Date().toISOString().slice(0, 10);

  const [source, setSource] = useState<Source>("individual");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr);
  const [donor, setDonor] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Validation", "Please enter a valid amount");
      return;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Validation", "Date must be in YYYY-MM-DD format");
      return;
    }
    mutation.mutate(
      {
        data: {
          source,
          amount: numAmount,
          date,
          donor: donor.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getFundingTrend"] });
          queryClient.invalidateQueries({ queryKey: ["getDashboardSummary"] });
          setAmount("");
          setDonor("");
          setNotes("");
          setDate(todayStr);
          onClose();
        },
        onError: () => Alert.alert("Error", "Failed to add funding entry"),
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
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Funding Entry</Text>
          <TouchableOpacity onPress={handleSave} style={styles.modalHeaderBtn} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.saveBtn, { color: colors.primary }]}>Add</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Source</Text>
          <View style={styles.sourceGrid}>
            {SOURCES.map((s) => {
              const selected = source === s;
              const sc = SOURCE_COLORS[s] ?? colors.primary;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSource(s)}
                  style={[
                    styles.sourceChip,
                    {
                      backgroundColor: selected ? sc + "22" : colors.muted,
                      borderColor: selected ? sc : colors.border,
                      borderWidth: selected ? 1.5 : 1,
                    },
                  ]}
                >
                  <View style={[styles.sourceChipDot, { backgroundColor: sc }]} />
                  <Text style={[styles.sourceChipText, { color: selected ? sc : colors.mutedForeground }]}>
                    {SOURCE_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Amount ($)</Text>
          <TextInput
            style={inputStyle}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="e.g. 5000"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={inputStyle}
            value={date}
            onChangeText={setDate}
            placeholder="2026-01-15"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Donor (optional)</Text>
          <TextInput
            style={inputStyle}
            value={donor}
            onChangeText={setDonor}
            placeholder="Donor name or organization"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Notes (optional)</Text>
          <TextInput
            style={[inputStyle, { height: 80, textAlignVertical: "top" }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Optional notes"
            placeholderTextColor={colors.mutedForeground}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SourceBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const colors = useColors();
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={styles.sourceRow}>
      <View style={[styles.sourceColorDot, { backgroundColor: color }]} />
      <Text style={[styles.sourceLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.sourceBarTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.sourceBarFill, { width: `${pct}%`, backgroundColor: color + "88" }]} />
      </View>
      <Text style={[styles.sourceValue, { color: colors.foreground }]}>{formatCurrency(value)}</Text>
    </View>
  );
}

function MonthCard({ item }: { item: FundingPoint }) {
  const colors = useColors();
  if (item.total === 0) return null;
  return (
    <View style={[styles.monthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.monthHeader}>
        <Text style={[styles.monthLabel, { color: colors.foreground }]}>{formatMonth(item.month)}</Text>
        <Text style={[styles.monthTotal, { color: colors.primary }]}>{formatCurrency(item.total)}</Text>
      </View>
      <View style={styles.sourcesContainer}>
        {(["grants", "individual", "corporate", "events"] as const).map((src) =>
          item[src] > 0 ? (
            <SourceBar key={src} label={SOURCE_LABELS[src]} value={item[src]} total={item.total} color={SOURCE_COLORS[src]} />
          ) : null
        )}
      </View>
    </View>
  );
}

export default function FundingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const query = useGetFundingTrend();

  const [addOpen, setAddOpen] = useState(false);

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

  const trend = ((query.data ?? []) as FundingPoint[])
    .filter((p) => p.total > 0)
    .slice()
    .reverse();

  const ytd = trend
    .filter((p) => p.month.startsWith(String(new Date().getFullYear())))
    .reduce((sum, p) => sum + p.total, 0);

  const monthlyAvg = trend.length > 0 ? trend.reduce((s, p) => s + p.total, 0) / trend.length : 0;

  const ListHeader = (
    <View>
      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Funding</Text>
        <TouchableOpacity
          onPress={() => setAddOpen(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>YTD Total</Text>
          <Text style={styles.summaryValue}>{formatCurrency(ytd)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Monthly Avg</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatCurrency(monthlyAvg)}</Text>
        </View>
      </View>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        MONTHLY BREAKDOWN · {trend.length} MONTHS
      </Text>
    </View>
  );

  return (
    <>
      <FlatList
        data={trend}
        keyExtractor={(item) => item.month}
        renderItem={({ item }) => <MonthCard item={item} />}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.listContent, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!trend.length}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No funding data available</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={query.isFetching} onRefresh={refresh} tintColor={colors.primary} />
        }
      />

      <AddEntryModal visible={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 16 },
  screenHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  screenTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  summaryCard: { flex: 1, borderRadius: 10, padding: 14 },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 0.3 },
  summaryValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginTop: 4 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10 },
  monthCard: { borderRadius: 10, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  monthHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, paddingBottom: 8 },
  monthLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  monthTotal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  sourcesContainer: { paddingHorizontal: 12, paddingBottom: 12 },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 },
  sourceColorDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  sourceLabel: { fontSize: 11, fontFamily: "Inter_400Regular", width: 68 },
  sourceBarTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  sourceBarFill: { height: 4, borderRadius: 2 },
  sourceValue: { fontSize: 11, fontFamily: "Inter_600SemiBold", width: 52, textAlign: "right" },
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
  sourceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  sourceChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  sourceChipDot: { width: 8, height: 8, borderRadius: 4 },
  sourceChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
