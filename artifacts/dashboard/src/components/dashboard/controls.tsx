import { useState, useRef, useEffect } from "react";
import { RefreshCw, ChevronDown, Check, Printer, Sun, Moon, Settings, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLogout } from "@workspace/api-client-react";
import { DATA_SOURCES } from "@/lib/constants";

export function DashboardControls({
  isDark,
  setIsDark,
  lastRefreshedAt,
  onOpenSettings
}: {
  isDark: boolean;
  setIsDark: (d: boolean) => void;
  lastRefreshedAt: number | null;
  onOpenSettings: () => void;
}) {
  const queryClient = useQueryClient();
  const logout = useLogout({
    mutation: {
      onSettled: () => {
        // Drop all cached data; the auth gate refetches /auth/me → login screen.
        queryClient.clear();
      },
    },
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [intervalMs, setIntervalMs] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const INTERVAL_OPTIONS = [
    { label: "Off", ms: 0 },
    { label: "Every 5 min", ms: 5 * 60 * 1000 },
    { label: "Every 15 min", ms: 15 * 60 * 1000 },
    { label: "Every 1 hour", ms: 60 * 60 * 1000 },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (intervalMs === 0) return;
    const t = setInterval(() => {
      handleRefresh();
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  const handleRefresh = async () => {
    setIsSpinning(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsSpinning(false), 600);
  };

  const lastRefreshed = lastRefreshedAt
    ? (() => {
        const d = new Date(lastRefreshedAt);
        const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
        const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${time} on ${date}`;
      })()
    : null;

  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-x-4 gap-y-4">
      <div className="pt-2">
        <h1 className="font-bold text-[32px] tracking-tight">ImpactIQ</h1>
        <p className="text-muted-foreground mt-1.5 text-[14px]">Executive Impact & Operations Dashboard</p>
        
        {DATA_SOURCES.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[12px] text-muted-foreground shrink-0">Data Sources:</span>
            {DATA_SOURCES.map((source) => (
              <span
                key={source}
                className="text-[12px] font-bold rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
                title={source}
                style={{
                  maxWidth: "20ch",
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgb(229, 231, 235)",
                  color: isDark ? "#c8c9cc" : "rgb(75, 85, 99)",
                }}
              >
                {source}
              </span>
            ))}
          </div>
        )}

        {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-2">Last refresh: {lastRefreshed}</p>}
      </div>

      <div className="flex items-center gap-3 pt-2 print:hidden">
        <div
          className="flex items-center rounded-[6px] overflow-hidden h-[26px] text-[12px]"
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
            color: isDark ? "#c8c9cc" : "#4b5563",
          }}
        >
          <button onClick={handleRefresh} className="flex items-center gap-1 px-2 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="w-px h-4 shrink-0" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen((o) => !o)} className="flex items-center justify-center px-1.5 h-[26px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-md overflow-hidden z-50">
                <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
                  Auto-Refresh
                </div>
                {INTERVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setIntervalMs(opt.ms);
                      setDropdownOpen(false);
                    }}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {opt.label}
                    {intervalMs === opt.ms && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
          aria-label="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
          aria-label="Export as PDF"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
        
        <button
          onClick={() => setIsDark(!isDark)}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors disabled:opacity-60"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
          aria-label="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
