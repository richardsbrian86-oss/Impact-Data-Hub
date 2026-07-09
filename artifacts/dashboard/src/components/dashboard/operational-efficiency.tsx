import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOperationalMetrics } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/formatters";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { CHART_COLORS } from "@/lib/constants";
import { CustomTooltip, CustomLegend } from "./chart-helpers";
import { CSVLink } from "react-csv";
import { Download, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function ProgramExpenseGauge({ ratio, isDark }: { ratio: number; isDark: boolean }) {
  const capped = Math.min(100, Math.max(0, ratio));
  const onTarget = capped >= 65;
  const fillColor = onTarget ? CHART_COLORS.blue : "#f59e0b";
  const trackColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-full" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={[{ value: capped }, { value: 100 - capped }]}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius="58%"
              outerRadius="82%"
              dataKey="value"
              stroke="none"
              paddingAngle={1}
              isAnimationActive={false}
            >
              <Cell fill={fillColor} />
              <Cell fill={trackColor} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center pointer-events-none">
          <span className="text-3xl font-bold tabular-nums leading-none">
            {capped.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">of expenses</span>
        </div>
      </div>

      <div className="w-full flex items-center justify-between text-xs text-muted-foreground px-1 border-t pt-2 mt-1">
        <span>0%</span>
        <span className={onTarget ? "text-green-600 font-semibold dark:text-green-400" : "text-amber-500 font-semibold"}>
          {onTarget ? "✓ On target" : "↑ Below target"}
        </span>
        <span>100%</span>
      </div>
      <p className="text-xs text-muted-foreground">Target ≥ 65%</p>
    </div>
  );
}

export function OperationalEfficiency({ isDark, onEdit }: { isDark: boolean; onEdit?: () => void }) {
  const query = useGetOperationalMetrics();

  const loading = query.isLoading || query.isFetching;
  const metrics = query.data;

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const programRatio = metrics?.programExpenseRatio ?? 0;

  const allocationData = metrics ? [
    { name: "Program", value: metrics.programSpend },
    { name: "Administrative", value: metrics.adminSpend },
    { name: "Fundraising", value: metrics.fundraisingSpend },
  ] : [];

  const costTrend = metrics?.costTrend || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Operational Efficiency</h2>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5 print:hidden">
            <Settings2 className="w-4 h-4" />
            Edit Allocation
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Program Expense Ratio gauge */}
        <Card>
          <CardHeader className="px-4 pt-4 pb-2 space-y-0">
            <CardTitle className="text-base">Program Expense Ratio</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            {loading ? (
              <Skeleton className="w-full h-[200px]" />
            ) : (
              <ProgramExpenseGauge ratio={programRatio} isDark={isDark} />
            )}
          </CardContent>
        </Card>

        {/* Budget Allocation pie */}
        <Card>
          <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Budget Allocation</CardTitle>
            {!loading && allocationData.length > 0 && (
              <CSVLink
                data={allocationData}
                filename="budget-allocation.csv"
                className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
                aria-label="Export chart data as CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </CardHeader>
          <CardContent className="pb-6">
            {loading ? <Skeleton className="w-full h-[250px]" /> : (
              <ResponsiveContainer width="100%" height={250} debounce={0}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    cornerRadius={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    <Cell fill={CHART_COLORS.blue} />
                    <Cell fill={CHART_COLORS.purple} />
                    <Cell fill={CHART_COLORS.pink} />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                  <Legend content={<CustomLegend />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Multi-Year Cost Trend bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Multi-Year Cost Trend</CardTitle>
            {!loading && costTrend.length > 0 && (
              <CSVLink
                data={costTrend}
                filename="cost-trend.csv"
                className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
                aria-label="Export chart data as CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="w-full h-[250px]" /> : (
              <ResponsiveContainer width="100%" height={250} debounce={0}>
                <BarChart data={costTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                  <YAxis
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12, fill: tickColor }}
                    stroke={tickColor}
                  />
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                  <Legend content={<CustomLegend />} />
                  <Bar dataKey="programCosts" name="Program" stackId="a" fill={CHART_COLORS.blue} fillOpacity={0.9} isAnimationActive={false} />
                  <Bar dataKey="adminCosts" name="Admin" stackId="a" fill={CHART_COLORS.purple} fillOpacity={0.9} isAnimationActive={false} />
                  <Bar dataKey="fundraisingCosts" name="Fundraising" stackId="a" fill={CHART_COLORS.pink} fillOpacity={0.9} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
