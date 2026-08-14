import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Card, CardContent } from "../ui/Card";
import { cn } from "../../lib/utils";
import type { SummaryModel } from "../../lib/insights/data";
import { dominantSentiment } from "../../lib/insights/data";
import { Icon } from "../ui/Icon";
import { SectionHeading } from "./ui";
import { API_URL } from "../../lib/constants";
import { useToast } from "../ui/toast";

export interface WidgetContent {
  header: string;
  subtitle?: string;
  items: string[];
}

export function widgetContent(model: SummaryModel): WidgetContent {
  const themes = [...model.themes].sort((a, b) => b.mentions - a.mentions).slice(0, 3);
  const items = themes.length
    ? themes.map((theme) => theme.name)
    : model.keywords.slice(0, 3).map((keyword) => keyword.label);

  const sentiment = model.analysis?.sentiment;
  const positive = sentiment?.positive_pct ?? model.pcts.positive;
  const neutral = sentiment?.neutral_pct ?? model.pcts.neutral;
  const negative = sentiment?.negative_pct ?? model.pcts.negative;
  const dominant = dominantSentiment(positive, neutral, negative);

  if (dominant === "positive") {
    return { header: "What customers love", items };
  }
  if (dominant === "negative") {
    return {
      header: "Customer Feedback",
      subtitle: "Customers are currently highlighting areas for improvement.",
      items,
    };
  }
  if (dominant === "neutral") {
    return { header: "Customer feedback", items };
  }
  return { header: "What customers say", items };
}

function WidgetFace({ content }: { content: WidgetContent }) {
  return (
    <View className="w-full max-w-xs rounded-xl border border-border bg-card p-4">
      <Text className="text-xs font-bold text-foreground">{content.header}</Text>
      {content.subtitle ? (
        <Text className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{content.subtitle}</Text>
      ) : null}
      <View className="mt-2.5 gap-2">
        {content.items.map((item, index) => (
          <View key={index} className="flex-row items-center gap-2">
            <View className="h-1.5 w-1.5 rounded-full bg-primary" />
            <Text className="text-xs text-muted-foreground">{item}</Text>
          </View>
        ))}
      </View>
      <View className="mt-3 flex-row items-center justify-center gap-1.5 border-t border-border/70 pt-2.5">
        <Icon name="shield-check" size={12} color="#10B981" />
        <Text className="text-[10px] text-muted-foreground">Verified by FeedbackLoop</Text>
      </View>
    </View>
  );
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function WidgetSection({ model }: { model: SummaryModel }) {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);
  const [dark, setDark] = useState(false);

  const content = widgetContent(model);
  const snippet = `<div id="feedbackloop-widget" data-id="${escapeAttr(model.widgetId)}"${dark ? ` data-theme="dark"` : ""}></div>\n<script src="${API_URL}/widget.js" async></script>`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(snippet);
    setCopied(true);
    success("Embed code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardContent className="gap-5">
        <SectionHeading
          title="Embeddable Widget"
          description="Paste this into your website to display live customer feedback. The widget adapts to the sentiment of your analysis and is verified by FeedbackLoop."
        />

        <View className="gap-6">
          <View className="gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-sm font-semibold text-foreground">Embed code</Text>
              <View className="flex-row items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
                <Pressable onPress={() => setDark(false)} className={cn("rounded-md px-2.5 py-1", !dark ? "bg-card shadow-sm" : "")}>
                  <Text className={cn("text-xs font-medium", !dark ? "text-foreground" : "text-muted-foreground")}>Light</Text>
                </Pressable>
                <Pressable onPress={() => setDark(true)} className={cn("rounded-md px-2.5 py-1", dark ? "bg-card shadow-sm" : "")}>
                  <Text className={cn("text-xs font-medium", dark ? "text-foreground" : "text-muted-foreground")}>Dark</Text>
                </Pressable>
              </View>
            </View>

            <View className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <View className="flex-row items-center justify-between border-b border-slate-800 bg-slate-800/50 px-4 py-2.5">
                <Text className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Embed HTML</Text>
                <Pressable onPress={handleCopy} className="h-6 w-6 items-center justify-center rounded-md">
                  <Icon name={copied ? "check" : "copy"} size={14} color={copied ? "#34D399" : "#94A3B8"} />
                </Pressable>
              </View>
              <ScrollView className="p-4" horizontal>
                <Text className="font-mono text-xs leading-relaxed text-slate-300">{snippet}</Text>
              </ScrollView>
            </View>

            <Text className="text-[11px] leading-relaxed text-muted-foreground">
              <Text className="text-emerald-500">ShieldCheck: </Text>
              The widget links to your live analysis, updates automatically, and always shows a
              verification mark so visitors know it is real customer feedback.
            </Text>
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Preview</Text>
            <View className="items-center rounded-xl border border-border bg-secondary/30 p-6">
              <WidgetFace content={content} />
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
