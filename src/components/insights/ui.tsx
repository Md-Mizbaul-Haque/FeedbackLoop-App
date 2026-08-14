import React from "react";
import { Text, View } from "react-native";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { severityLabel } from "../../lib/insights/data";
import type { MixedSentiment, Severity } from "../../lib/insights/types";

export function SentimentBadge({
  sentiment,
  className,
}: {
  sentiment: MixedSentiment;
  className?: string;
}) {
  const map: Record<MixedSentiment, string> = {
    positive: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    neutral: "bg-sky-500/10 text-sky-700 border-sky-500/20",
    negative: "bg-rose-500/10 text-rose-700 border-rose-500/20",
    mixed: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  };
  const label = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  return (
    <Badge variant="outline" className={cn("border px-2", map[sentiment], className)}>
      {label}
    </Badge>
  );
}

export function SeverityBadge({
  severity,
  label,
  className,
  tone = "severity",
}: {
  severity: Severity;
  label?: string;
  className?: string;
  tone?: "severity" | "impact";
}) {
  const map: Record<Severity, string> = {
    high: "bg-rose-500/10 text-rose-700 border-rose-500/20",
    medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    low: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  };
  const text =
    tone === "impact"
      ? `${severityLabel(severity)} impact`
      : `${severityLabel(severity)} priority`;
  return (
    <Badge variant="outline" className={cn("border px-2", map[severity], className)}>
      {label ?? text}
    </Badge>
  );
}

export function SeverityDot({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const map: Record<Severity, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  };
  return <View className={cn("h-2 w-2 rounded-full", map[severity], className)} />;
}

export function EvidenceLine({
  mentions,
  total,
  className,
}: {
  mentions: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.round((mentions / total) * 100) : 0;
  return (
    <Text className={cn("text-xs font-medium text-muted-foreground", className)}>
      {mentions} of {total} reviews · {pct}%
    </Text>
  );
}

export { SectionHeading, AIBadge } from "../ui/EmptyState";

export function NotEnoughEvidence({
  title = "Not enough evidence",
  hint,
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <View className="items-center justify-center rounded-lg border border-dashed border-border px-4 py-8">
      <Text className="text-sm font-medium text-muted-foreground">{title}</Text>
      {hint ? (
        <Text className="mt-1 max-w-xs text-center text-xs text-muted-foreground/70">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
