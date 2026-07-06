import { type ReactNode } from "react";

export function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        borderRadius: "6px",
        padding: "10px 14px",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
        fontSize: "13px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ marginBottom: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
        {payload.length === 1 && payload[0].color && payload[0].color !== "#ffffff" && (
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: payload[0].color, flexShrink: 0 }} />
        )}
        {label}
      </div>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
          {payload.length > 1 && entry.color && entry.color !== "#ffffff" && (
            <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          )}
          <span style={{ color: "var(--muted-foreground)" }}>{entry.name}</span>
          <span style={{ marginLeft: "auto", fontWeight: 600 }}>
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CustomLegend({ payload }: any) {
  if (!payload || payload.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 16px", fontSize: "13px" }}>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
