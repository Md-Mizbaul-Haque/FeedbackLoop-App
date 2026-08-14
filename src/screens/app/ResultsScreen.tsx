import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { loadLatestSummary, clearLatestSummary } from "../../lib/summary-storage";
import { SummaryResults, type Summary } from "../../components/summary-result";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ResultsScreen({
  summaryId,
  onCreateAnother,
}: {
  summaryId?: string;
  onCreateAnother: () => void;
}) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (summaryId) {
        const { data } = await supabase
          .from("summaries")
          .select("*")
          .eq("id", summaryId)
          .maybeSingle();
        if (cancelled) return;
        setSummary((data as Summary) ?? null);
      } else {
        const latest = await loadLatestSummary<Summary>();
        if (cancelled) return;
        setSummary(latest);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [summaryId]);

  const handleSave = useCallback(async () => {
    if (!summary || saving) return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        error("Please sign in to save this summary.");
        return;
      }

      let savedId: string | null = null;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { data, error: insertError } = await supabase
          .from("summaries")
          .insert({
            user_id: user.id,
            title: summary.title,
            reviews_count: summary.reviews_count,
            keywords: summary.keywords,
            summary_points: summary.summary_points,
            positive_sentiment_pct: summary.positive_sentiment_pct ?? 0,
            average_rating: summary.average_rating ?? 0,
            reviews: summary.reviews ?? null,
            widget_id: summary.widget_id,
            analysis: summary.analysis ?? null,
          })
          .select("id")
          .single();

        if (!insertError && data) {
          savedId = data.id;
          break;
        }
        lastError = insertError;
        if (insertError?.code !== "23505") break;
      }

      if (!savedId) throw lastError ?? new Error("Failed to save summary.");

      await clearLatestSummary();
      success("Summary saved to your account!");
    } catch (err) {
      console.error(err);
      error("Failed to save summary. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [summary, saving, error, success]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!summary) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <CardEmpty
          title="No summary selected"
          hint="Generate a new summary to see your results."
          onAction={onCreateAnother}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SummaryResults
        summary={summary}
        onSave={summaryId ? undefined : handleSave}
        saving={saving}
        onCreateAnother={onCreateAnother}
      />
    </View>
  );
}

function CardEmpty({
  title,
  hint,
  onAction,
}: {
  title: string;
  hint: string;
  onAction: () => void;
}) {
  return (
    <ScrollView contentContainerClassName="gap-4 items-center py-8">
      <Text className="text-sm text-muted-foreground">{title}</Text>
      <Text className="text-center text-sm text-muted-foreground">{hint}</Text>
      <Button onPress={onAction}>Create New Summary</Button>
    </ScrollView>
  );
}
