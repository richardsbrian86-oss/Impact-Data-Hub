import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface KPICardProps {
  title: string;
  value: string;
  change?: number | null;
  isLoading?: boolean;
  accent?: boolean;
}

export function KPICard({ title, value, change, isLoading, accent }: KPICardProps) {
  const colors = useColors();

  const trendColor =
    change === null || change === undefined
      ? colors.mutedForeground
      : change >= 0
      ? "#22c55e"
      : "#ef4444";

  const trendIcon =
    change === null || change === undefined
      ? undefined
      : change >= 0
      ? "trending-up"
      : "trending-down";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primary : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: accent ? "rgba(255,255,255,0.75)" : colors.mutedForeground },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={accent ? "rgba(255,255,255,0.6)" : colors.primary}
          style={{ marginTop: 8 }}
        />
      ) : (
        <Text
          style={[
            styles.value,
            { color: accent ? "#FFFFFF" : colors.foreground },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
      )}
      {!isLoading && trendIcon && change !== undefined && change !== null && (
        <View style={styles.trendRow}>
          <Feather name={trendIcon} size={11} color={accent ? "rgba(255,255,255,0.8)" : trendColor} />
          <Text
            style={[
              styles.trendText,
              { color: accent ? "rgba(255,255,255,0.8)" : trendColor },
            ]}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}% vs prior
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    minHeight: 88,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  trendText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
