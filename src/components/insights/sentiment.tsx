import React from "react";
import { Text, View } from "react-native";
import { Card, CardContent } from "../ui/Card";
import type { SummaryModel } from "../../lib/insights/data";
import { AIBadge, NotEnoughEvidence, SectionHeading } from "./ui";

export function SentimentDistribution({ model }: { model: SummaryModel }) {
  const rows = [
    { label: "Positive", pct: model.pcts.positive, bar: "bg-emerald-500", value: "text-emerald-600" },
    { label: "Neutral", pct: model.pcts.neutral, bar: "bg-sky-400", value: "text-sky-600" },
    { label: "Negative", pct: model.pcts.negative, bar: "bg-rose-500", value: "text-rose-600" },
  ];
  const total = model.pcts.positive + model.pcts.neutral + model.pcts.negative;

  return (
    <Card className="h-full">
      <CardContent className="gap-5">
        <SectionHeading
          title="Sentiment Distribution"
          description="The share of reviews classified by tone."
          actions={<AIBadge label="AI analysis" />}
        />

        {total > 0 ? (
          <>
            <View className="h-3 flex-row overflow-hidden rounded-full bg-border">
              {rows.map((row) =>
                row.pct > 0 ? (
                  <View key={row.label} className={row.bar} style={{ width: `${row.pct}%` }} />
                ) : null,
              )}
            </View>

            <View className="gap-2.5">
              {rows.map((row) => (
                <View key={row.label} className="flex-row items-center gap-3">
                  <Text className="w-16 text-xs font-medium text-foreground/80">{row.label}</Text>
                  <View className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                    <View className={`h-full ${row.bar}`} style={{ width: `${row.pct}%` }} />
                  </View>
                  <Text className={`w-12 text-right text-xs font-semibold ${row.value}`}>
                    {row.pct}%
                  </Text>
                </View>
              ))}
            </View>

            {model.interpretation ? (
              <Text className="border-t border-border/70 pt-4 text-xs leading-relaxed text-muted-foreground">
                {model.interpretation}
              </Text>
            ) : null}
          </>
        ) : (
          <NotEnoughEvidence hint="Sentiment could not be derived for this result." />
        )}
      </CardContent>
    </Card>
  );
}
