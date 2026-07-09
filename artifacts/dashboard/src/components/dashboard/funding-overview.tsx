import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "./kpi-card";
import { useGetDashboardSummary, useGetFundingTrend } from "@workspace/api-client-react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { CHART_COLORS } from "@/lib/constants";
import { CustomTooltip, CustomLegend } from "./chart-helpers";
import { CSVLink } from "react-csv";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AddFundingEntryDialog } from "../forms/funding-entry-form";

export function FundingOverview({ isDark }: { isDark: boolean }) {
  const summaryQuery = useGetDashboardSummary();
  const trendQuery = useGetFundingTrend();
  const [addEntryOpen, setAddEntryOpen] = useState(false);

  const loading = summaryQuery.isLoading || summaryQuery.isFetching || trendQuery.isLoading || trendQuery.isFetching;
  const summary = summaryQuery.data;
  const trends = trendQuery.data || [];

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Funding Overview</h2>
        <Button onClick={() => setAddEntryOpen(true)} size="sm" className="h-8 gap-1">
          <Plus className="w-4 h-4" />
          Add Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Funding YTD"
          value={summary ? formatCurrency(summary.totalFundingYTD) : "$0"}
          change={summary?.totalFundingYTDChange ? `${formatPercent(summary.totalFundingYTDChange)}` : undefined}
          trend={summary?.totalFundingYTDChange ? (summary.totalFundingYTDChange >= 0 ? "up" : "down") : "neutral"}
          isLoading={loading}
        />
        <KPICard
          title="Average Gift Size"
          value={summary ? formatCurrency(summary.averageGiftSize) : "$0"}
          trend="neutral"
          isLoading={loading}
        />
        <KPICard
          title="Total Donors"
          value={summary ? summary.totalDonors.toLocaleString() : "0"}
          change={summary?.totalDonorsChange ? `${formatPercent(summary.totalDonorsChange)}` : undefined}
          trend={summary?.totalDonorsChange ? (summary.totalDonorsChange >= 0 ? "up" : "down") : "neutral"}
          isLoading={loading}
        />
        <KPICard
          title="Donor Retention"
          value={summary ? formatPercent(summary.donorRetentionRate) : "0%"}
          trend="neutral"
          isLoading={loading}
        />
      </div>

      <Card>
        <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">24-Month Funding Trend</CardTitle>
          {!loading && trends.length > 0 && (
            <CSVLink
              data={trends}
              filename="funding-trends.csv"
              className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
              aria-label="Export chart data as CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </CSVLink>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="w-full h-[350px]" />
          ) : trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={350} debounce={0}>
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGrants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorIndividual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.purple} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS.purple} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorCorporate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.pink} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS.pink} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickMargin={10} minTickGap={20} />
                <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickMargin={10} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }} />
                <Legend content={<CustomLegend />} />
                <Area type="monotone" dataKey="grants" name="Grants" stackId="1" stroke={CHART_COLORS.blue} fill="url(#colorGrants)" isAnimationActive={false} />
                <Area type="monotone" dataKey="individual" name="Individual" stackId="1" stroke={CHART_COLORS.purple} fill="url(#colorIndividual)" isAnimationActive={false} />
                <Area type="monotone" dataKey="corporate" name="Corporate" stackId="1" stroke={CHART_COLORS.green} fill="url(#colorCorporate)" isAnimationActive={false} />
                <Area type="monotone" dataKey="events" name="Events" stackId="1" stroke={CHART_COLORS.pink} fill="url(#colorEvents)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-[350px] flex items-center justify-center text-muted-foreground">
              No funding data available
            </div>
          )}
        </CardContent>
      </Card>

      <AddFundingEntryDialog open={addEntryOpen} onOpenChange={setAddEntryOpen} />
    </div>
  );
}
