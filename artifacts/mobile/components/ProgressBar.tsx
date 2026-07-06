import React from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color, height = 6 }: ProgressBarProps) {
  const colors = useColors();
  const pct = Math.min(Math.max(value, 0), 100);
  const barColor = color ?? colors.primary;

  return (
    <View style={[styles.track, { height, backgroundColor: colors.muted, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${pct}%`,
            height,
            backgroundColor: pct >= 100 ? "#22c55e" : barColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {},
});
