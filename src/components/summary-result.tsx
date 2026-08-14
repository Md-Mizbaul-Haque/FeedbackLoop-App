import React, { useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button } from "./ui/Button";
import { buildSummaryModel } from "../lib/insights/data";
import type { SummaryRow } from "../lib/insights/types";
import { ExecutiveOverview, ExecutiveSummarySection } from "./insights/executive";
import { SentimentDistribution } from "./insights/sentiment";
import { TopThemes } from "./insights/themes";
import { PriorityMatrix } from "./insights/priority-matrix";
import { BusinessImpact, RecommendedActions } from "./insights/impact";
import { CustomerVoice, ReviewBreakdown } from "./insights/customer-voice";
import { WidgetSection } from "./insights/widget-section";

export interface SummaryKeyword {
  label: string;
  count: number;
}

export interface Summary {
  id: string;
  title: string;
  reviews_count: number;
  keywords: SummaryKeyword[];
  summary_points: string[];
  positive_sentiment_pct: number | null;
  average_rating: number | null;
  widget_id: string;
  reviews?: string | null;
  analysis?: unknown;
  created_at: string;
}

export function SummaryResults({
  summary,
  onSave,
  saving = false,
  onCreateAnother,
}: {
  summary: Summary;
  onSave?: () => void;
  saving?: boolean;
  onCreateAnother?: () => void;
}) {
  const model = useMemo(() => buildSummaryModel(summary as SummaryRow), [summary]);
  const breakdownRef = useRef<ScrollView>(null);
  const [focusRequest, setFocusRequest] = useState<{
    sentiment: "positive" | "neutral" | "negative" | "all";
    nonce: number;
  } | null>(null);

  const handleViewAll = (sentiment: "positive" | "neutral" | "negative" | "all") => {
    setFocusRequest((prev) => ({ sentiment, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  return (
    <ScrollView contentContainerClassName="gap-6 pb-10">
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-2xl font-bold tracking-tight text-foreground">{model.title}</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {model.reviewsCount} customer reviews analyzed. {model.satisfactionLabel} overall.
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {onSave ? (
            <Button onPress={onSave} disabled={saving} loading={saving} icon="save" iconColor="#FFFFFF">
              {saving ? "Saving..." : "Save Summary"}
            </Button>
          ) : null}
          {onCreateAnother ? (
            <Button variant="outline" icon="plus" onPress={onCreateAnother}>
              Create Another
            </Button>
          ) : null}
        </View>
      </View>

      <ExecutiveOverview model={model} />
      <View className="gap-6">
        <View className="gap-6 lg:flex-row">
          <View className="flex-1">
            <ExecutiveSummarySection model={model} />
          </View>
          <View className="flex-1">
            <SentimentDistribution model={model} />
          </View>
        </View>
        <View className="gap-6 lg:flex-row">
          <View className="flex-1">
            <TopThemes model={model} />
          </View>
          <View className="flex-1">
            <BusinessImpact model={model} />
          </View>
        </View>
        <View className="gap-6 lg:flex-row">
          <View className="flex-1">
            <RecommendedActions model={model} />
          </View>
          <View className="flex-1">
            <PriorityMatrix model={model} />
          </View>
        </View>
        <View className="gap-6 lg:flex-row">
          <View className="flex-1">
            <CustomerVoice model={model} onViewAll={handleViewAll} />
          </View>
          <View className="flex-1">
            <ReviewBreakdown
              key={`breakdown-${focusRequest?.nonce ?? 0}`}
              model={model}
              initialSentiment={focusRequest?.sentiment ?? "all"}
            />
          </View>
        </View>
      </View>

      <WidgetSection model={model} />
    </ScrollView>
  );
}
