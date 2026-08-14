import React from "react";
import { Text, View } from "react-native";
import { Badge } from "../ui/Badge";
import { Card, CardContent } from "../ui/Card";
import { cn } from "../../lib/utils";
import type { SummaryModel } from "../../lib/insights/data";
import type { Severity } from "../../lib/insights/types";
import { AIBadge, NotEnoughEvidence, SectionHeading } from "./ui";

const RISK_TONES: Record<Severity, string> = {
  high: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};

function RiskBadge({ level, label }: { level: Severity; label: string }) {
  return <Badge variant="outline" className={cn("border px-2", RISK_TONES[level])}>{label}</Badge>;
}

export function BusinessImpact({ model }: { model: SummaryModel }) {
  return (
    <Card className="h-full">
      <CardContent className="gap-4">
        <SectionHeading
          title="Business Impact"
          description="Potential consequences inferred from the reviews."
          actions={<AIBadge label="AI analysis" />}
        />

        {model.hasImpact ? (
          <>
            <View className="gap-3">
              {model.impact.map((item) => (
                <View key={item.area} className="rounded-xl border border-border/70 bg-card p-4">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="flex-1 text-sm font-semibold text-foreground">{item.area}</Text>
                    <RiskBadge level={item.risk} label={`${item.risk} risk`} />
                  </View>
                  <Text className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {item.summary}
                  </Text>
                </View>
              ))}
            </View>
            <Text className="text-[11px] leading-relaxed text-muted-foreground/70">
              Impact is inferred from the submitted reviews and expressed with hedged
              language (“may”, “could”, “appears”) rather than stated as fact.
            </Text>
          </>
        ) : (
          <NotEnoughEvidence title="Not enough evidence" hint="Re-run the analysis to see potential business impact." />
        )}
      </CardContent>
    </Card>
  );
}

export function RecommendedActions({ model }: { model: SummaryModel }) {
  return (
    <Card className="h-full">
      <CardContent className="gap-4">
        <SectionHeading
          title="Recommended Actions"
          description="Prioritized, specific actions grounded in the review themes."
          actions={<AIBadge label="AI analysis" />}
        />

        {model.hasRecommendations ? (
          <View className="gap-4">
            {model.recommendations.map((rec) => (
              <View key={rec.priority} className="rounded-xl border border-border/70 bg-card p-4">
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                  <View className="flex-1 flex-row items-center gap-2.5">
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <Text className="text-xs font-bold text-primary">{rec.priority}</Text>
                    </View>
                    <Text className="shrink text-sm font-semibold text-foreground">{rec.title}</Text>
                  </View>
                  <RiskBadge level={rec.impact} label={`${rec.impact} impact`} />
                </View>

                {rec.actions.length > 0 ? (
                  <View className="mt-3 gap-1.5">
                    {rec.actions.map((action, index) => (
                      <View key={index} className="flex-row items-start gap-2">
                        <View className="mt-1 h-1 w-1 rounded-full bg-primary" />
                        <Text className="flex-1 text-xs leading-relaxed text-foreground/80">
                          {action}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {rec.why ? (
                  <Text className="mt-3 border-t border-border/60 pt-2.5 text-xs leading-relaxed text-muted-foreground">
                    <Text className="font-semibold text-foreground/70">Why: </Text>
                    {rec.why}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <NotEnoughEvidence title="Not enough evidence" hint="Re-run the analysis to get actionable recommendations." />
        )}
      </CardContent>
    </Card>
  );
}
