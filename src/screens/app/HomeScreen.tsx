import React, { useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useCredits, useUser, isExpiredSubscription } from "../../lib/queries";
import { columnLabel, columnValues, guessReviewColumn, parseCsv } from "../../lib/csv";
import { saveLatestSummary } from "../../lib/summary-storage";
import { useToast } from "../../components/ui/toast";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Textarea } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Dialog } from "../../components/ui/Modal";
import { Icon } from "../../components/ui/Icon";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const FREE_MAX_REVIEWS = 50;

const SAMPLE_CSV = `Title,Content,Rating
Great product,"Delivery was super fast, and the packaging was great!",5
Amazing quality,"Amazing quality product. Highly recommended.",5
Helpful support,"Customer support was very helpful and responsive.",4
Works as described,"Love the product! It works exactly as described.",5
Fast shipping,"Shipping was faster than I expected. Great experience!",4
Will buy again,"Will definitely buy again.",5
Best service,"The best customer service I've ever received.",5
Satisfied,"Very satisfied with the quality and build.",4
Worth every penny,"Easy to use and worth every penny.",5
Five stars,"Five stars from me!",5`;

export default function HomeScreen({
  onOpenResults,
  onOpenPricing,
}: {
  onOpenResults: () => void;
  onOpenPricing: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast, error: errorToast } = useToast();
  const { user } = useUser();
  const { credits } = useCredits(user?.id ?? null);
  const [reviews, setReviews] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[] | null>(null);
  const [csvRows, setCsvRows] = useState<string[][] | null>(null);
  const [csvColumnCount, setCsvColumnCount] = useState(0);
  const [selectedColumn, setSelectedColumn] = useState(0);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const plan = credits?.plan ?? "free";
  const expired = isExpiredSubscription(credits);

  const reviewCount = reviews.trim() ? reviews.trim().split("\n").filter(Boolean).length : 0;
  const characterCount = reviews.length;
  const overFreeLimit = plan === "free" && reviewCount > FREE_MAX_REVIEWS;

  const applyColumn = (rows: string[][], column: number) => {
    const values = columnValues(rows, column);
    if (values.length === 0) {
      errorToast("That column has no reviews. Try another one.");
      return;
    }
    setSelectedColumn(column);
    setReviews(values.join("\n"));
    toast("success", `Imported ${values.length} reviews.`);
  };

  const handleFile = async (asset: DocumentPicker.DocumentPickerAsset | null) => {
    if (!asset) return;
    if (asset.size && asset.size > MAX_FILE_SIZE) {
      errorToast("File is larger than 5MB. Please upload a smaller CSV.");
      return;
    }
    if (!asset.name.toLowerCase().endsWith(".csv")) {
      errorToast("Please upload a CSV file.");
      return;
    }

    try {
      const text = await FileSystem.readAsStringAsync(asset.uri);
      const { headers, rows } = parseCsv(text);

      if (rows.length === 0) {
        errorToast("No reviews found in the CSV file.");
        return;
      }

      const columnCount = Math.max(headers?.length ?? 0, ...rows.map((row) => row.length));
      const guess = guessReviewColumn(headers, rows);

      setCsvHeaders(headers);
      setCsvRows(rows);
      setCsvColumnCount(columnCount);
      applyColumn(rows, guess);
    } catch (err) {
      console.error(err);
      errorToast("Could not read the CSV file. Please try again.");
    }
  };

  const handlePickCsv = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "text/csv",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled && result.assets[0]) {
      handleFile(result.assets[0]);
    }
  };

  const handleDownloadSample = async () => {
    const fileUri = `${FileSystem.cacheDirectory}sample-reviews.csv`;
    await FileSystem.writeAsStringAsync(fileUri, SAMPLE_CSV);
    await Share.share({ url: fileUri, message: "Sample reviews CSV" }).catch(() => {});
  };

  const handleGenerate = async () => {
    if (isGenerating) return;

    const reviewsList = reviews
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (reviewsList.length < 10) {
      errorToast(`Please provide at least 10 reviews (you entered ${reviewsList.length}).`);
      return;
    }
    if (plan === "free" && reviewsList.length > FREE_MAX_REVIEWS) {
      errorToast(
        `The free plan supports up to ${FREE_MAX_REVIEWS} reviews per input (you entered ${reviewsList.length}).`,
      );
      return;
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      errorToast("Please sign in to generate a summary.");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-summaries", {
        body: { reviews: reviewsList },
      });

      if (error) {
        const ctx = (error as { context?: Response }).context;
        if (ctx) {
          try {
            const body = (await ctx.json()) as { error?: string; error_code?: string };
            if (body?.error_code === "usage_limit_exceeded") {
              queryClient.invalidateQueries({ queryKey: ["credits"] });
              setShowUpgradeDialog(true);
              return;
            }
            if (body?.error) {
              errorToast(body.error);
              return;
            }
          } catch {
            // ignore malformed error bodies
          }
        }
        throw error;
      }

      const result = data?.data as
        | {
            title: string;
            summary_points: string[];
            keywords: { label: string; count: number }[];
            positive_sentiment_pct: number | null;
            average_rating: number | null;
            analysis?: unknown;
          }
        | undefined;

      if (!result) {
        throw new Error("Empty analysis result.");
      }

      const summary = {
        user_id: currentUser.id,
        title: result.title,
        reviews_count: reviewsList.length,
        keywords: result.keywords,
        summary_points: result.summary_points,
        positive_sentiment_pct: result.positive_sentiment_pct ?? 0,
        average_rating: result.average_rating ?? 0,
        reviews: reviewsList.join("\n"),
        analysis: result.analysis ?? null,
        widget_id: Crypto.randomUUID(),
      };

      await saveLatestSummary(summary);

      toast("success", `Summary generated from ${reviewsList.length} reviews!`);
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      onOpenResults();
    } catch (err) {
      console.error(err);
      errorToast("AI analysis failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScrollView contentContainerClassName="gap-6 pb-10">
      {expired ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex-row items-center justify-between gap-4">
            <View className="flex-1 flex-row items-center gap-3">
              <Icon name="alert-circle" size={20} color="#E5484D" />
              <View className="flex-1">
                <Text className="font-medium text-foreground">Your Pro subscription has ended</Text>
                <Text className="text-sm text-muted-foreground">
                  You're now on the Free plan (10 summaries per 24 hours).
                </Text>
              </View>
            </View>
            <Button size="sm" icon="sparkles" iconColor="#FFFFFF" onPress={onOpenPricing}>
              Renew Pro
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <View>
        <Text className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Create New Summary
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Paste your customer reviews below or upload a CSV file.
        </Text>
      </View>

      <Card>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Paste Reviews</Text>
              <Text className="text-xs text-muted-foreground">
                {plan === "pro"
                  ? "Paste at least 10 customer reviews (one per line)"
                  : "Paste 10-50 customer reviews (one per line)"}
              </Text>
              <Textarea
                value={reviews}
                onChangeText={setReviews}
                placeholder="Paste your reviews here..."
                className="h-64 rounded-xl p-4"
              />
              <View className="flex-row items-center justify-between">
                <Text className={overFreeLimit ? "text-xs font-medium text-amber-600" : "text-xs text-muted-foreground"}>
                  {reviewCount} reviews • {characterCount.toLocaleString()} characters
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setReviews("")}
                  disabled={isGenerating}
                >
                  Clear
                </Button>
              </View>
              {overFreeLimit ? (
                <View className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                  You've entered {reviewCount} reviews. The free plan supports up to {FREE_MAX_REVIEWS}{" "}
                  per input. Upgrade to Pro for unlimited reviews.
                </View>
              ) : null}
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Or Upload CSV</Text>
              <Text className="text-xs text-muted-foreground">Upload a CSV file with your reviews</Text>

              <Pressable
                onPress={handlePickCsv}
                className="h-56 items-center justify-center rounded-xl border-2 border-dashed border-primary/20 bg-secondary/30"
              >
                <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm">
                  <Icon name="upload-cloud" size={20} color="#4F46E5" />
                </View>
                <Text className="text-xs font-medium text-foreground">
                  <Text className="font-semibold">Click to upload</Text> your CSV
                </Text>
                <Text className="mt-1 text-[11px] text-muted-foreground">CSV file (max. 5MB)</Text>
              </Pressable>

              {csvRows ? (
                <View className="gap-2 rounded-xl border border-primary/30 bg-secondary/40 p-3">
                  <View className="flex-row items-center gap-1.5">
                    <Icon name="check-circle" size={16} color="#4F46E5" />
                    <Text className="text-xs font-semibold text-foreground">
                      Which column has the reviews?
                    </Text>
                  </View>
                  <Select
                    value={String(selectedColumn)}
                    onValueChange={(value) => {
                      if (csvRows) applyColumn(csvRows, Number(value));
                    }}
                    options={Array.from({ length: csvColumnCount }, (_, index) => ({
                      value: String(index),
                      label: columnLabel(csvHeaders, index, columnValues(csvRows, index).length),
                    }))}
                  />
                </View>
              ) : null}

              <View className="flex-row items-center gap-1">
                <Text className="text-xs text-muted-foreground">
                  How should the CSV be formatted?{" "}
                </Text>
                <Pressable onPress={handleDownloadSample}>
                  <Text className="text-xs font-medium text-primary">Download sample CSV</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Button
            size="lg"
            icon="sparkles"
            iconColor="#FFFFFF"
            onPress={handleGenerate}
            loading={isGenerating}
          >
            {isGenerating ? "Analyzing Reviews..." : "Generate Summary"}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        visible={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        title="You've used all your free summaries"
        description="The free plan includes 10 summaries every 24 hours. Upgrade to Pro for unlimited summaries and never wait for a reset again."
        footer={
          <>
            <Button variant="outline" onPress={() => setShowUpgradeDialog(false)}>
              Maybe later
            </Button>
            <Button
              icon="sparkles"
              iconColor="#FFFFFF"
              onPress={() => {
                setShowUpgradeDialog(false);
                onOpenPricing();
              }}
            >
              Upgrade to Pro
            </Button>
          </>
        }
      >
        <View className="mt-4 items-center">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon name="sparkles" size={24} color="#4F46E5" />
          </View>
        </View>
      </Dialog>
    </ScrollView>
  );
}
