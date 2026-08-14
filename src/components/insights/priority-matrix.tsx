import React from "react";
import { Text, View } from "react-native";
import { Card, CardContent } from "../ui/Card";
import { cn } from "../../lib/utils";
import type { SummaryModel } from "../../lib/insights/data";
import type { Severity } from "../../lib/insights/types";
import { AIBadge, NotEnoughEvidence, SectionHeading } from "./ui";

const SEVERITY_Y: Record<Severity, number> = { high: 82, medium: 52, low: 22 };
const SEVERITY_FILL: Record<Severity, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export function PriorityMatrix({ model }: { model: SummaryModel }) {
  if (!model.hasThemes) {
    return (
      <Card className="h-full">
        <CardContent className="gap-4">
          <SectionHeading
            title="Priority Matrix"
            description="Plot themes by frequency and severity to see what to fix first."
          />
          <NotEnoughEvidence title="Not enough evidence" hint="Theme-level analysis is required to build the priority matrix." />
        </CardContent>
      </Card>
    );
  }

  const themes = model.themes.slice(0, 6);

  return (
    <Card className="h-full">
      <CardContent className="gap-4">
        <SectionHeading
          title="Priority Matrix"
          description="Where each theme sits on frequency vs. severity. High frequency + high severity should be fixed first."
          actions={<AIBadge label="AI analysis" />}
        />

        <View className="h-64 w-full overflow-hidden rounded-xl border border-border bg-card">
          <View className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/70" />
          <View className="absolute inset-y-0 left-1/2 border-l border-dashed border-border/70" />

          <Text className="absolute right-2 top-2 text-[10px] font-medium text-rose-600/80">
            Fix immediately
          </Text>
          <Text className="absolute left-2 top-2 text-[10px] font-medium text-amber-600/80">
            Investigate
          </Text>
          <Text className="absolute bottom-2 right-2 text-[10px] font-medium text-amber-600/80">
            Monitor / improve
          </Text>
          <Text className="absolute bottom-2 left-2 text-[10px] font-medium text-muted-foreground/80">
            Low priority
          </Text>

          <Text className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
            Frequency →
          </Text>
          <Text className="absolute -left-0.5 top-1/2 origin-left -rotate-90 text-[10px] font-medium text-muted-foreground">
            Severity ↑
          </Text>

          {themes.map((theme, index) => {
            const x = Math.min(94, Math.max(6, theme.reviewsPct || 10));
            const y = SEVERITY_Y[theme.severity];
            return (
              <View
                key={`${theme.name}-${index}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              >
                <View className={cn("h-3 w-3 rounded-full border-2 border-card shadow-sm", SEVERITY_FILL[theme.severity])} />
              </View>
            );
          })}
        </View>

        <View className="gap-1.5">
          {themes.map((theme, index) => (
            <View key={`${theme.name}-${index}`} className="flex-row items-center gap-2">
              <View className={cn("h-2 w-2 rounded-full", SEVERITY_FILL[theme.severity])} />
              <Text numberOfLines={1} className="shrink text-xs font-medium text-foreground/80">
                {theme.name}
              </Text>
              <Text className="ml-auto text-xs text-muted-foreground">
                {theme.mentions} mentions · {theme.reviewsPct}%
              </Text>
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}
