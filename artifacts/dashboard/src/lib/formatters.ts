import { format } from "date-fns";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d);
}

export function formatDate(dateStr: string | undefined, fmt = "MMM d, yyyy"): string {
  if (!dateStr) return "";
  try {
    return format(parseLocalDate(dateStr), fmt);
  } catch (e) {
    return "";
  }
}
