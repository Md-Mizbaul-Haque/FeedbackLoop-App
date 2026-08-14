import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../components/ui/toast";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Dialog } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { Icon } from "../../components/ui/Icon";

interface SummaryItem {
  id: string;
  title: string;
  reviewsCount: number;
  keywords: { label: string; colorClass: string }[];
  createdAt: string;
  createdAtRaw: string;
}

const colorPalettes = [
  "bg-orange-50 text-orange-600 border-orange-200",
  "bg-rose-50 text-rose-600 border-rose-200",
  "bg-purple-50 text-purple-600 border-purple-200",
  "bg-amber-50 text-amber-600 border-amber-200",
  "bg-emerald-50 text-emerald-600 border-emerald-200",
  "bg-sky-50 text-sky-600 border-sky-200",
  "bg-indigo-50 text-indigo-600 border-indigo-200",
  "bg-blue-50 text-blue-600 border-blue-200",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SummariesScreen({
  onView,
  onCreate,
}: {
  onView: (id: string) => void;
  onCreate: () => void;
}) {
  const { success, error } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SummaryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cutoff, setCutoff] = useState<number | null>(null);
  const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
      const now = Date.now();
      setCutoff(
        timeRange === "7days"
          ? now - 7 * 24 * 60 * 60 * 1000
          : timeRange === "30days"
            ? now - 30 * 24 * 60 * 60 * 1000
            : timeRange === "year"
              ? new Date(new Date().getFullYear(), 0, 1).getTime()
              : null,
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, timeRange]);

  const toSummaryItems = (
    rows: { id: string; title: string; reviews_count: number; keywords: { label: string }[]; created_at: string }[],
  ): SummaryItem[] =>
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      reviewsCount: row.reviews_count,
      keywords: (row.keywords ?? []).map((kw, index) => ({
        label: kw.label,
        colorClass: colorPalettes[index % colorPalettes.length],
      })),
      createdAt: formatDate(row.created_at),
      createdAtRaw: row.created_at,
    }));

  const PAGE_SIZE = 20;

  const fetchPage = useCallback(
    async (cursor: { createdAt: string; id: string } | null, append: boolean) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSummaries([]);
        setSignedIn(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      setSignedIn(true);

      const { data, error: rpcError } = await supabase.rpc("list_summaries_page", {
        p_page_size: PAGE_SIZE,
        p_cursor_created_at: cursor?.createdAt ?? null,
        p_cursor_id: cursor?.id ?? null,
      });

      if (rpcError) {
        console.error(rpcError);
        error("Failed to load summaries.");
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const rows = (data ?? []) as {
        id: string;
        title: string;
        reviews_count: number;
        keywords: { label: string }[];
        created_at: string;
        has_more: boolean;
      }[];

      const items = toSummaryItems(rows);
      setSummaries((prev) => (append ? [...prev, ...items] : items));
      const last = rows[rows.length - 1];
      setNextCursor(last ? { createdAt: last.created_at, id: last.id } : null);
      setHasMore(rows.length > 0 ? rows[rows.length - 1].has_more : false);
      setLoading(false);
      setLoadingMore(false);
    },
    [error],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      await fetchPage(null, false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const reload = useCallback(() => {
    setSummaries([]);
    setNextCursor(null);
    setHasMore(false);
    fetchPage(null, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || !nextCursor) return;
    setLoadingMore(true);
    fetchPage(nextCursor, true);
  }, [fetchPage, loadingMore, nextCursor]);

  const handleDelete = async (summary: SummaryItem) => {
    setDeleting(true);
    const { error: deleteError } = await supabase.from("summaries").delete().eq("id", summary.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (deleteError) {
      console.error(deleteError);
      error("Failed to delete summary.");
      return;
    }
    success("Summary deleted.");
    reload();
  };

  const handleExport = async (summary: SummaryItem) => {
    const lines = [
      summary.title,
      `${summary.reviewsCount} reviews analyzed`,
      `Created: ${summary.createdAt}`,
      "",
      "Top keywords:",
      ...summary.keywords.map((kw) => `- ${kw.label}`),
    ];
    await Share.share({ message: lines.join("\n") }).catch(() => {});
  };

  const filteredSummaries = useMemo(() => {
    const q = debouncedQuery;
    return summaries.filter((item) => {
      if (cutoff !== null && new Date(item.createdAtRaw).getTime() < cutoff) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.label.toLowerCase().includes(q))
      );
    });
  }, [summaries, debouncedQuery, cutoff]);

  return (
    <ScrollView contentContainerClassName="gap-6 pb-10">
      <View className="flex-row flex-wrap items-center justify-between gap-4">
        <View className="flex-1">
          <Text className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            My Summaries
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            View and manage all your previously generated summaries.
          </Text>
        </View>
        <Button icon="plus" iconColor="#FFFFFF" onPress={onCreate}>
          Create New Summary
        </Button>
      </View>

      <Card>
        <CardContent className="gap-6">
          <View className="flex-row flex-wrap items-center gap-4">
            <View className="relative min-w-[200px] flex-1">
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by title or keyword..."
                className="pl-9 pr-9"
              />
              <View className="absolute left-3 top-1/2 -translate-y-1/2">
                <Icon name="search" size={16} color="#71717A" />
              </View>
              {searchQuery ? (
                <View className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onPress={() => setSearchQuery("")}>
                    <Icon name="close" size={14} color="#71717A" />
                  </Button>
                </View>
              ) : null}
            </View>
            <Select
              className="min-w-[150px]"
              value={timeRange}
              onValueChange={(v) => setTimeRange(v ?? "all")}
              options={[
                { value: "all", label: "All Time" },
                { value: "7days", label: "Last 7 days" },
                { value: "30days", label: "Last 30 days" },
                { value: "year", label: "This year" },
              ]}
            />
          </View>

          <View className="overflow-hidden rounded-xl border border-border/60">
            <View className="flex-row items-center border-b border-border/60 bg-muted/50 px-4 py-3">
              <Text className="w-[30%] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</Text>
              <Text className="w-[18%] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reviews</Text>
              <Text className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keywords</Text>
              <Text className="w-[20%] text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</Text>
            </View>

            {loading ? (
              <View className="gap-4 p-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <View key={i} className="flex-row items-center gap-4">
                    <Skeleton className="h-5 w-[30%]" />
                    <Skeleton className="h-4 w-[18%]" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-4 w-[20%]" />
                  </View>
                ))}
              </View>
            ) : filteredSummaries.length > 0 ? (
              <View>
                {filteredSummaries.map((summary) => (
                  <View
                    key={summary.id}
                    className="flex-row items-center gap-3 border-b border-border/60 px-4 py-4"
                  >
                    <Text numberOfLines={1} className="w-[30%] shrink text-sm font-semibold text-foreground">
                      {summary.title}
                    </Text>
                    <Text className="w-[18%] text-sm text-muted-foreground">
                      {summary.reviewsCount} reviews
                    </Text>
                    <View className="flex-1 flex-row flex-wrap gap-1.5">
                      {summary.keywords.slice(0, 3).map((kw, idx) => (
                        <Text key={idx} className={`rounded-md border px-2.5 py-0.5 text-xs font-medium ${kw.colorClass}`}>
                          {kw.label}
                        </Text>
                      ))}
                    </View>
                    <View className="w-[20%] flex-row items-center justify-end gap-1">
                      <Text numberOfLines={1} className="shrink text-xs text-muted-foreground">
                        {summary.createdAt}
                      </Text>
                      <Pressable onPress={() => onView(summary.id)} className="h-8 w-8 items-center justify-center rounded-lg active:bg-muted">
                        <Icon name="eye" size={16} color="#71717A" />
                      </Pressable>
                      <Pressable onPress={() => handleExport(summary)} className="h-8 w-8 items-center justify-center rounded-lg active:bg-muted">
                        <Icon name="more-vertical" size={16} color="#71717A" />
                      </Pressable>
                      <Pressable onPress={() => setDeleteTarget(summary)} className="h-8 w-8 items-center justify-center rounded-lg active:bg-muted">
                        <Icon name="trash" size={16} color="#E5484D" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-8">
                <Text className="text-center text-sm text-muted-foreground">
                  {signedIn === false
                    ? "Sign in to view your generated summaries."
                    : searchQuery
                      ? "No summaries found matching your search."
                      : "No summaries yet. Generate your first summary to get started!"}
                </Text>
              </View>
            )}
          </View>

          {(hasMore || loadingMore) ? (
            <View className="items-center pt-2">
              <Button variant="outline" onPress={loadMore} loading={loadingMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </View>
          ) : null}
          {!hasMore && !loading && summaries.length > 0 ? (
            <Text className="pt-2 text-center text-xs text-muted-foreground">
              All {summaries.length} summaries shown.
            </Text>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        visible={deleteTarget !== null}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Delete summary?"
        description={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onPress={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onPress={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={deleting}
              loading={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      />
    </ScrollView>
  );
}
