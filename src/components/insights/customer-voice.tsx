import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Segmented } from "../ui/Segmented";
import { Icon } from "../ui/Icon";
import type { SummaryModel, ReviewRecord } from "../../lib/insights/data";
import { SEVERITY_RANK, excerpt, severityLabel } from "../../lib/insights/data";
import type { Sentiment } from "../../lib/insights/types";
import { NotEnoughEvidence, SectionHeading, SentimentBadge } from "./ui";

function pickDefaultSentiment(model: SummaryModel): Sentiment {
  if (model.dominant === "positive") return "positive";
  if (model.dominant === "negative") return "negative";
  const order: Sentiment[] = ["positive", "neutral", "negative"];
  let best: Sentiment = "neutral";
  let bestCount = -1;
  for (const s of order) {
    if (model.counts[s] > bestCount) {
      bestCount = model.counts[s];
      best = s;
    }
  }
  return best;
}

export function CustomerVoice({
  model,
  onViewAll,
}: {
  model: SummaryModel;
  onViewAll: (sentiment: Sentiment | "all") => void;
}) {
  const [active, setActive] = useState<Sentiment>(() => pickDefaultSentiment(model));
  const bySentiment = useMemo(() => {
    const map: Record<Sentiment, ReviewRecord[]> = { positive: [], neutral: [], negative: [] };
    for (const record of model.reviewRecords) map[record.sentiment].push(record);
    return map;
  }, [model.reviewRecords]);

  const tabs: Sentiment[] = ["positive", "neutral", "negative"];
  const counts: Record<Sentiment, number> = model.counts;
  const labels: Record<Sentiment, string> = { positive: "Positive", neutral: "Neutral", negative: "Negative" };

  return (
    <Card className="h-full">
      <CardContent className="gap-4">
        <SectionHeading
          title="Customer Voice"
          description="Representative excerpts from the reviews you submitted. Quotes are verbatim."
          actions={
            <Button variant="outline" size="sm" className="h-8 text-xs" onPress={() => onViewAll(active)}>
              View all reviews
            </Button>
          }
        />

        {model.reviewRecords.length > 0 ? (
          <>
            <Segmented
              options={tabs.map((tab) => ({ value: tab, label: `${labels[tab]} (${counts[tab]})` }))}
              value={active}
              onChange={setActive}
            />

            {bySentiment[active].length > 0 ? (
              <View className="gap-2.5">
                {bySentiment[active].slice(0, 3).map((record) => (
                  <View key={record.index} className="rounded-xl border border-border/70 bg-secondary/30 p-4">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[10px] font-bold text-muted-foreground">
                        Review #{record.index + 1}
                      </Text>
                      <SentimentBadge sentiment={record.sentiment} />
                    </View>
                    <Text className="mt-2 text-sm leading-relaxed text-foreground/90">
                      “{excerpt(record.text)}”
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                No {labels[active].toLowerCase()} reviews in this batch.
              </Text>
            )}
          </>
        ) : (
          <NotEnoughEvidence title="Not enough evidence" hint="No review excerpts are available for this result." />
        )}
      </CardContent>
    </Card>
  );
}

const SENTIMENT_ORDER: Record<Sentiment, number> = { positive: 0, neutral: 1, negative: 2 };

export function ReviewBreakdown({
  model,
  initialSentiment = "all",
}: {
  model: SummaryModel;
  initialSentiment?: "all" | Sentiment;
}) {
  const [search, setSearch] = useState("");
  const [sentiment, setSentiment] = useState<"all" | Sentiment>(initialSentiment);
  const [theme, setTheme] = useState<"all" | number>("all");
  const [sort, setSort] = useState<"index" | "severity" | "sentiment">("index");

  const hasClassifiedThemes = model.reviewRecords.some((r) => r.themes.length > 0);

  const filtered = useMemo(() => {
    let rows = model.reviewRecords.slice();
    if (sentiment !== "all") rows = rows.filter((r) => r.sentiment === sentiment);
    if (theme !== "all") rows = rows.filter((r) => r.themes.includes(theme));
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => r.text.toLowerCase().includes(q));

    if (sort === "index") {
      rows.sort((a, b) => a.index - b.index);
    } else if (sort === "severity") {
      rows.sort(
        (a, b) =>
          SEVERITY_RANK[b.severity ?? "low"] - SEVERITY_RANK[a.severity ?? "low"] ||
          a.index - b.index,
      );
    } else {
      rows.sort(
        (a, b) => SENTIMENT_ORDER[a.sentiment] - SENTIMENT_ORDER[b.sentiment] || a.index - b.index,
      );
    }
    return rows;
  }, [model.reviewRecords, sentiment, theme, search, sort]);

  if (model.reviewRecords.length === 0) {
    return (
      <Card>
        <CardContent className="gap-4">
          <SectionHeading title="Source Reviews" />
          <NotEnoughEvidence title="Not enough evidence" hint="The full review list is not available for this result." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="gap-4">
        <SectionHeading
          title="Source Reviews"
          badge={`${filtered.length} of ${model.reviewsCount}`}
          description="Browse the original reviews. Filter by sentiment or theme and sort by severity."
        />

        <View className="flex-row flex-wrap items-center gap-3">
          <View className="relative min-w-[200px] flex-1">
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search reviews..."
              className="h-9 pl-9 pr-9"
            />
            <View className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon name="search" size={16} color="#71717A" />
            </View>
            {search ? (
              <View className="absolute right-3 top-1/2 -translate-y-1/2">
                <Button variant="ghost" size="icon" className="h-6 w-6" onPress={() => setSearch("")}>
                  <Icon name="close" size={14} color="#71717A" />
                </Button>
              </View>
            ) : null}
          </View>

          <Select
            className="min-w-[140px] flex-1"
            value={sentiment}
            onValueChange={(v) => setSentiment(v as "all" | Sentiment)}
            options={[
              { value: "all", label: "All sentiment" },
              { value: "positive", label: "Positive" },
              { value: "neutral", label: "Neutral" },
              { value: "negative", label: "Negative" },
            ]}
          />

          {hasClassifiedThemes ? (
            <Select
              className="min-w-[140px] flex-1"
              value={theme === "all" ? "all" : String(theme)}
              onValueChange={(v) => setTheme(v === "all" ? "all" : Number(v))}
              options={[
                { value: "all", label: "All themes" },
                ...model.themes.map((t, index) => ({ value: String(index), label: t.name })),
              ]}
            />
          ) : null}

          <Select
            className="min-w-[140px] flex-1"
            value={sort}
            onValueChange={(v) => setSort(v as "index" | "severity" | "sentiment")}
            options={[
              { value: "index", label: "Order submitted" },
              { value: "severity", label: "Severity (high first)" },
              { value: "sentiment", label: "Sentiment" },
            ]}
          />
        </View>

        <ScrollView className="max-h-[480px] rounded-xl border border-border/60 bg-muted/40 p-3">
          {filtered.length > 0 ? (
            <View className="gap-2.5">
              {filtered.map((record) => (
                <View key={record.index} className="rounded-lg border border-border/60 bg-card p-3.5">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-[10px] font-bold text-muted-foreground">#{record.index + 1}</Text>
                    <SentimentBadge sentiment={record.sentiment} className="px-1.5 py-0 text-[10px]" />
                    {record.themes.map((themeIdx, idx) => {
                      const theme = model.themes[themeIdx];
                      return theme ? (
                        <Badge key={idx} variant="secondary" className="px-2 text-[10px] font-medium">
                          {theme.name}
                        </Badge>
                      ) : null;
                    })}
                    {record.severity ? (
                      <Text className="ml-auto text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {severityLabel(record.severity)}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="mt-2 text-sm leading-relaxed text-foreground/90">
                    {record.text}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="py-8 text-center text-sm text-muted-foreground">
              No reviews match the current filters.
            </Text>
          )}
        </ScrollView>
      </CardContent>
    </Card>
  );
}
