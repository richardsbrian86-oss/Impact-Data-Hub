import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "./kpi-card";
import { useGetDonorTrends } from "@workspace/api-client-react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { CHART_COLORS, CHART_COLOR_LIST } from "@/lib/constants";
import { CustomTooltip, CustomLegend } from "./chart-helpers";
import { CSVLink } from "react-csv";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DonorFormSheet } from "../forms/donor-form";

export function DonorTrends({ isDark }: { isDark: boolean }) {
  const query = useGetDonorTrends();
  const [addOpen, setAddOpen] = useState(false);

  const loading = query.isLoading || query.isFetching;
  const data = query.data;

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const monthly = data?.monthly || [];
  const tierBreakdown = data?.tierBreakdown || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Donor Trends</h2>
        <Button onClick={() => setAddOpen(true)} size="sm" className="h-8 gap-1">
          <Plus className="w-4 h-4" />
          Manage Donors
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Total Donors"
          value={monthly.length > 0 ? monthly[monthly.length - 1].total.toLocaleString() : "0"}
          trend="neutral"
          isLoading={loading}
        />
        <KPICard
          title="Donor Retention"
          value={data ? formatPercent(data.retentionRate) : "0%"}
          trend="neutral"
          isLoading={loading}
        />
        <KPICard
          title="Average Gift Size"
          value={data ? formatCurrency(data.averageGiftSize) : "$0"}
          trend="neutral"
          isLoading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Monthly Donor Activity</CardTitle>
            {!loading && monthly.length > 0 && (
              <CSVLink data={monthly} filename="monthly-donors.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Export chart data as CSV">
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="w-full h-[300px]" /> : (
              <ResponsiveContainer width="100%" height={300} debounce={0}>
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorRetained" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorLapsed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.red} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.red} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                  <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }} />
                  <Legend content={<CustomLegend />} />
                  <Area type="monotone" dataKey="retainedDonors" name="Retained" stackId="1" stroke={CHART_COLORS.blue} fill="url(#colorRetained)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="newDonors" name="New" stackId="1" stroke={CHART_COLORS.green} fill="url(#colorNew)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="lapsedDonors" name="Lapsed" stackId="1" stroke={CHART_COLORS.red} fill="url(#colorLapsed)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Tier Breakdown</CardTitle>
            {!loading && tierBreakdown.length > 0 && (
              <CSVLink data={tierBreakdown} filename="donor-tiers.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Export chart data as CSV">
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="w-full h-[300px]" /> : (
              <ResponsiveContainer width="100%" height={300} debounce={0}>
                <PieChart>
                  <Pie data={tierBreakdown} dataKey="count" nameKey="tier" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} cornerRadius={2} stroke="none" isAnimationActive={false}>
                    {tierBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                  <Legend content={<CustomLegend />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <DonorFormSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
