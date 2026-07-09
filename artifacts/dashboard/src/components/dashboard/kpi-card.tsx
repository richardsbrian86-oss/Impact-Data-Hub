import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  isLoading?: boolean;
}

export function KPICard({ title, value, change, trend, isLoading }: KPICardProps) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";

  return (
    <Card>
      <CardContent className="p-6">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "#0079F2" }}>
              {value}
            </p>
            {change && trend !== "neutral" && (
              <div className="flex items-center gap-1 mt-1">
                {isPositive ? (
                  <ArrowUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={`text-sm ${
                    isPositive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {change}
                </span>
                <span className="text-sm text-muted-foreground">vs last period</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
