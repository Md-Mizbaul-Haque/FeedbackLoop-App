import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Badge } from "../ui/Badge";
import { Card, CardContent } from "../ui/Card";
import { cn } from "../../lib/utils";
import type { SummaryModel } from "../../lib/insights/data";
import { SEVERITY_RANK } from "../../lib/insights/data";
import { Icon } from "../ui/Icon";
import {
  AIBadge,
  EvidenceLine,
  NotEnoughEvidence,
  SectionHeading,
  SeverityBadge,
  SeverityDot,
} from "./ui";

function MetricTile({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  value: string;
  sub?: string;
  tone: "primary" | "rating" | "positive" | "neutral" | "negative";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    rating: "bg-amber-500/10 text-amber-600",
    positive: "bg-emerald-500/10 text-emerald-600",
    neutral: "bg-sky-500/10 text-sky-600",
    negative: "bg-rose-500/10 text-rose-600",
  };
  return (
    <View className="rounded-xl border border-border/70 bg-card p-4">
      <View className="flex-row items-center gap-1.5">
        <Icon name={icon} size={14} color="#71717A" />
        <Text className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </Text>
      </View>
      <Text className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </Text>
      {sub ? <Text className="mt-0.5 text-[11px] text-muted-foreground">{sub}</Text> : null}
      <View className={cn("mt-2 h-1 w-10 rounded-full", tones[tone])} />
    </View>
  );
}

export function ExecutiveOverview({ model }: { model: SummaryModel }) {
  const satisfactionTone =
    model.satisfaction === "strong_positive" || model.satisfaction === "mostly_positive"
      ? "bg-emerald-500"
      : model.satisfaction === "mostly_negative" || model.satisfaction === "strong_negative"
        ? "bg-rose-500"
        : "bg-amber-500";

  return (
    <Card>
      <CardContent className="gap-4">
        <SectionHeading
          title="Customer Feedback Overview"
          description="A snapshot of how customers responded to your product or service."
          actions={<AIBadge label="AI analysis" />}
        />

        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-sm font-semibold text-foreground">{model.headline}</Text>
          {model.themes.slice(0, 3).map((theme) => (
            <Badge key={theme.name} variant="outline" className="border-border bg-muted/40 text-xs font-medium">
              {theme.name}
            </Badge>
          ))}
        </View>

        <View className="flex-row flex-wrap gap-3">
          <View className="w-[47%] min-w-[140px] flex-1">
            <MetricTile icon="message-text" label="Reviews Analyzed" value={String(model.reviewsCount)} tone="primary" />
          </View>
          <View className="w-[47%] min-w-[140px] flex-1">
            <MetricTile
              icon="star"
              label="AI Estimated Rating"
              value={model.rating != null ? `${model.rating} / 5` : "—"}
              sub="Estimated from tone, not stars"
              tone="rating"
            />
          </View>
          <View className="w-[30%] min-w-[100px] flex-1">
            <MetricTile icon="check-circle" label="Positive" value={`${model.pcts.positive}%`} tone="positive" />
          </View>
          <View className="w-[30%] min-w-[100px] flex-1">
            <MetricTile icon="star" label="Neutral" value={`${model.pcts.neutral}%`} tone="neutral" />
          </View>
          <View className="w-[30%] min-w-[100px] flex-1">
            <MetricTile icon="alert-triangle" label="Negative" value={`${model.pcts.negative}%`} tone="negative" />
          </View>
        </View>

        <View className="flex-row items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4">
          <View className="flex-row items-center gap-2.5">
            <View className={cn("h-2.5 w-2.5 rounded-full", satisfactionTone)} />
            <Text className="text-sm font-semibold text-foreground">
              Overall: {model.satisfactionLabel}
            </Text>
          </View>
          <View className="h-2 flex-1 flex-row overflow-hidden rounded-full bg-border">
            <View style={{ width: `${model.pcts.positive}%` }} className="bg-emerald-500" />
            <View style={{ width: `${model.pcts.neutral}%` }} className="bg-sky-400" />
            <View style={{ width: `${model.pcts.negative}%` }} className="bg-rose-500" />
          </View>
          <Text className="shrink-0 text-xs text-muted-foreground">
            {model.pcts.positive}% pos · {model.pcts.negative}% neg
          </Text>
        </View>

        <View className="flex-row items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <Icon name="alert-triangle" size={16} color="#F43F5E" />
          <View className="flex-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Primary Issue
            </Text>
            <Text className="mt-0.5 text-sm font-medium text-foreground">
              {model.primaryIssue ?? "No single issue dominates the feedback."}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

export function ExecutiveSummarySection({ model }: { model: SummaryModel }) {
  return (
    <Card className="h-full">
      <CardContent className="gap-4">
        <SectionHeading title="AI Executive Summary" actions={<AIBadge />} />

        {model.hasExecutiveSummary ? (
          <Text className="text-sm leading-relaxed text-foreground/90">
            {model.executiveSummary}
          </Text>
        ) : model.summaryPoints.length > 0 ? (
          <>
            <Text className="text-xs text-muted-foreground">
              A narrative summary wasn't generated for this analysis. Key points:
            </Text>
            <View className="gap-2.5">
              {model.summaryPoints.slice(0, 3).map((point, index) => (
                <View key={index} className="flex-row items-start gap-3 rounded-lg border border-border/70 bg-secondary/30 p-3">
                  <Icon name="check-circle" size={16} color="#4F46E5" />
                  <Text className="flex-1 text-sm text-foreground/90">{point}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <NotEnoughEvidence hint="Re-run the analysis to generate a concise executive summary." />
        )}

        <View className="border-t border-border/70 pt-4">
          <KeyFindings model={model} />
        </View>
      </CardContent>
    </Card>
  );
}

export function KeyFindings({ model }: { model: SummaryModel }) {
  if (!model.hasThemes) {
    return (
      <NotEnoughEvidence
        title="Not enough evidence for key findings"
        hint="Theme-level analysis was not included for this result."
      />
    );
  }

  const findings = [...model.findings].sort(
    (a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      b.mentions - a.mentions,
  );

  return (
    <View className="gap-3">
      <Text className="text-sm font-semibold tracking-tight text-foreground">Key Findings</Text>
      {findings.map((finding) => (
        <View key={finding.name} className="flex-row gap-3 rounded-xl border border-border/70 bg-secondary/30 p-3.5">
          <SeverityDot severity={finding.severity} className="mt-1.5" />
          <View className="flex-1 gap-1">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Text className="text-sm font-semibold text-foreground">{finding.name}</Text>
              <SeverityBadge severity={finding.severity} />
            </View>
            <Text className="text-xs leading-relaxed text-muted-foreground">
              {finding.explanation || "Frequently mentioned by customers in the submitted reviews."}
            </Text>
            <EvidenceLine mentions={finding.mentions} total={model.reviewsCount} />
          </View>
        </View>
      ))}
    </View>
  );
}
