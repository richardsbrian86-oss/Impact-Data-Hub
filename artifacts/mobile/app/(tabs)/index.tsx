import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetDashboardSummary, useGetOrgProfile } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { KPICard } from "@/components/KPICard";

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function formatPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const summaryQuery = useGetDashboardSummary();
  const orgQuery = useGetOrgProfile();

  const isLoading = summaryQuery.isLoading;
  const s = summaryQuery.data;
  const org = orgQuery.data;

  const refresh = useCallback(() => {
    summaryQuery.refetch();
    orgQuery.refetch();
  }, [summaryQuery, orgQuery]);

  const refreshing = summaryQuery.isFetching || orgQuery.isFetching;

  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom + 90;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 12, paddingBottom: bottomPad },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.orgHeader}>
        <Text style={[styles.orgName, { color: colors.foreground }]} numberOfLines={2}>
          {org?.name ?? "Impact Dashboard"}
        </Text>
        <Text style={[styles.orgMission, { color: colors.mutedForeground }]} numberOfLines={2}>
          {org?.mission ?? "Executive Impact & Operations Overview"}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        FUNDING
      </Text>
      <View style={styles.kpiRow}>
        <KPICard
          title="Funding YTD"
          value={s ? formatCurrency(s.totalFundingYTD) : "—"}
          change={s?.totalFundingYTDChange}
          isLoading={isLoading}
          accent
        />
        <KPICard
          title="Avg Gift Size"
          value={s ? formatCurrency(s.averageGiftSize) : "—"}
          isLoading={isLoading}
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        DONORS
      </Text>
      <View style={styles.kpiRow}>
        <KPICard
          title="Total Donors"
          value={s ? String(s.totalDonors) : "—"}
          change={s?.totalDonorsChange}
          isLoading={isLoading}
        />
        <KPICard
          title="Retention Rate"
          value={s ? formatPct(s.donorRetentionRate) : "—"}
          isLoading={isLoading}
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        PROGRAMS
      </Text>
      <View style={styles.kpiRow}>
        <KPICard
          title="Active Programs"
          value={s ? String(s.activeProgramsCount) : "—"}
          isLoading={isLoading}
        />
        <KPICard
          title="People Served"
          value={s ? s.totalPeopleServed.toLocaleString() : "—"}
          change={s?.totalPeopleServedChange ?? null}
          isLoading={isLoading}
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        OPERATIONS
      </Text>
      <View style={styles.kpiRow}>
        <KPICard
          title="Program Expense %"
          value={s ? `${s.programExpenseRatio}%` : "—"}
          isLoading={isLoading}
        />
        <KPICard
          title="Annual Budget"
          value={org ? formatCurrency(org.annualBudget) : "—"}
          isLoading={isLoading || orgQuery.isLoading}
        />
      </View>

      {org && (
        <View
          style={[
            styles.orgFooter,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.orgFooterText, { color: colors.mutedForeground }]}>
            {org.city}, {org.state} · Est. {org.founded} · FY starts {org.fiscalYearStart}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18 },
  orgHeader: { marginBottom: 16 },
  orgName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
  },
  orgMission: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 4,
  },
  divider: { height: 1, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  orgFooter: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  orgFooterText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
