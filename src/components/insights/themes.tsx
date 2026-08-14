import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Card, CardContent } from "../ui/Card";
import { cn } from "../../lib/utils";
import type { SummaryModel } from "../../lib/insights/data";
import { excerpt } from "../../lib/insights/data";
import { Icon } from "../ui/Icon";
import {
  AIBadge,
  EvidenceLine,
  NotEnoughEvidence,
  SectionHeading,
  SentimentBadge,
  SeverityBadge,
} from "./ui";

export function TopThemes({ model }: { model: SummaryModel }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!model.hasThemes) {
    return (
      <Card className="h-full">
        <CardContent className="gap-4">
          <SectionHeading title="Top Customer Themes" description="Grouped topics across your reviews." />
          <NotEnoughEvidence title="Not enough evidence" hint="Theme-level analysis was not included for this result." />
        </CardContent>
      </Card>
    );
  }

  const hasFallback = model.themes.some((theme) => theme.isFallback);

  return (
    <Card className="h-full">
      <CardContent className="gap-4">
        <SectionHeading
          title="Top Customer Themes"
          description="Grouped topics across your reviews, ranked by frequency and severity."
          actions={<AIBadge label="AI analysis" />}
        />

        {hasFallback ? (
          <Text className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            This result predates theme-level analysis. Topics below are a keyword-frequency
            estimate, not AI-detected themes.
          </Text>
        ) : null}

        <View className="gap-3">
          {model.themes.map((theme, index) => {
            const open = openIndex === index;
            const support = theme.supportingIndexes.length
              ? theme.supportingIndexes.slice(0, 3).map((i) => model.reviewRecords[i]).filter(Boolean)
              : [];

            return (
              <View key={`${theme.name}-${index}`} className="rounded-xl border border-border/70 bg-card p-4">
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                  <View className="flex-1 flex-row items-center gap-2">
                    <Text numberOfLines={1} className="shrink text-sm font-semibold text-foreground">
                      {theme.name}
                    </Text>
                    <SentimentBadge sentiment={theme.sentiment} />
                  </View>
                  <SeverityBadge severity={theme.severity} />
                </View>

                <View className="mt-2 flex-row flex-wrap items-center gap-x-3">
                  <EvidenceLine mentions={theme.mentions} total={model.reviewsCount} />
                  <Text className="text-xs text-muted-foreground">{theme.reviewsPct}% of reviews</Text>
                </View>

                <Text className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {theme.explanation || "Customers mentioned this topic in their reviews."}
                </Text>

                {support.length > 0 ? (
                  <View className="mt-3">
                    <Pressable
                      onPress={() => setOpenIndex(open ? null : index)}
                      className="flex-row items-center gap-1.5 self-start"
                    >
                      <Icon name="quote" size={14} color="#4F46E5" />
                      <Text className="text-xs font-medium text-primary">Supporting reviews</Text>
                      <Icon
                        name="chevron-down"
                        size={14}
                        color="#4F46E5"
                      />
                    </Pressable>
                    {open ? (
                      <View className="mt-2 gap-2">
                        {support.map((record) => (
                          <View
                            key={record.index}
                            className="rounded-lg border border-border/60 bg-secondary/30 p-3"
                          >
                            <Text className="text-xs leading-relaxed text-foreground/90">
                              “{excerpt(record.text)}”
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </CardContent>
    </Card>
  );
}
