import React, { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { API_URL } from "../../lib/constants";
import { useCredits, useUser, isExpiredSubscription } from "../../lib/queries";
import { useToast } from "../../components/ui/toast";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Segmented } from "../../components/ui/Segmented";
import { Icon } from "../../components/ui/Icon";

const PRO_MONTHLY_PRICE = "$9";
const PRO_YEARLY_PRICE = "$90";

const FREE_FEATURES = [
  "10 AI summaries per 24 hours",
  "Sentiment analysis",
  "Top themes & keywords",
  "Ranked recommendations",
  "Embeddable summary widget",
  "CSV import (up to 50 reviews)",
];

const PRO_FEATURES = [
  "50 AI summaries per day",
  "Unlimited reviews per batch",
  "Everything in Free",
  "Priority processing",
  "Deeper insights & impact matrix",
  "Email support",
];

export default function PricingScreen({
  onRequireSignIn,
}: {
  onRequireSignIn: () => void;
}) {
  const queryClient = useQueryClient();
  const { error, info, success } = useToast();
  const { user } = useUser();
  const { credits, isLoading: creditsLoading } = useCredits(user?.id ?? null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [activating, setActivating] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const pollRef = useRef<{
    timer: ReturnType<typeof globalThis.setInterval>;
    fail: ReturnType<typeof globalThis.setTimeout>;
  } | null>(null);

  const plan = credits?.plan ?? "free";
  const expired = isExpiredSubscription(credits);

  // Poll for plan activation after returning from checkout.
  useEffect(() => {
    if (!user || plan === "pro") return;
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current.timer);
        clearTimeout(pollRef.current.fail);
        pollRef.current = null;
      }
      setActivating(false);
    };
  }, [user, plan]);

  const startPolling = (userId: string) => {
    if (pollRef.current) return;
    setActivating(true);
    let stopped = false;

    const stop = (nextActivating?: boolean) => {
      stopped = true;
      if (pollRef.current) {
        clearInterval(pollRef.current.timer);
        clearTimeout(pollRef.current.fail);
        pollRef.current = null;
      }
      if (nextActivating !== undefined) setActivating(nextActivating);
    };

    const check = async () => {
      if (stopped) return;
      try {
        const { data } = await supabase
          .from("user_credits")
          .select("plan")
          .eq("user_id", userId)
          .maybeSingle();
        if (stopped) return;
        if (data?.plan === "pro") {
          stop(false);
          queryClient.invalidateQueries({ queryKey: ["credits"] });
          success("Welcome to Pro! Your plan is now active.");
        }
      } catch {
        // transient read errors: keep polling
      }
    };

    pollRef.current = {
      timer: globalThis.setInterval(() => {
        void check();
      }, 3000),
      fail: globalThis.setTimeout(() => {
        stop(false);
        queryClient.invalidateQueries({ queryKey: ["credits"] });
        info(
          "We received your payment — your Pro plan is still activating. " +
            "You'll get a confirmation email once it's live. If it doesn't show up, " +
            "open the Pricing tab again to re-check.",
        );
      }, 120_000),
    };
    void check();
  };

  const handleUpgrade = async () => {
    if (checkingOut || activating) return;
    setCheckingOut(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        onRequireSignIn();
        return;
      }

      const response = await fetch(`${API_URL}/api/lemon-squeezy/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      body: JSON.stringify({ interval: billingInterval }),
    });

      const body = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !body.url) {
        error(body?.error ?? "Could not start checkout. Please try again.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(body.url, API_URL);
      if (result.type === "success") {
        startPolling(session.user.id);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      error("Could not start checkout. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <ScrollView contentContainerClassName="gap-8 pb-10">
      <View className="items-center">
        <View className="mb-4 flex-row items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
          <Icon name="zap" size={14} color="#4F46E5" />
          <Text className="text-xs font-medium text-primary">Simple, flat pricing</Text>
        </View>
        <Text className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Start free, upgrade when you grow
        </Text>
        <Text className="mt-2 max-w-xl text-center text-sm text-muted-foreground md:text-base">
          Turn customer reviews into actionable insights. Upgrade to Pro for unlimited summaries.
        </Text>
      </View>

      <View className="items-center">
        <Segmented
          value={billingInterval}
          onChange={setBillingInterval}
          options={[
            { value: "month", label: "Monthly" },
            { value: "year", label: "Yearly · Save 17%" },
          ]}
        />
      </View>

      <View className="mx-auto w-full max-w-3xl gap-6 md:flex-row">
        <Card className="flex-1">
          <CardContent className="gap-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold tracking-tight text-foreground">Free</Text>
              {plan === "free" && !creditsLoading ? (
                <View className="rounded-md bg-secondary px-2 py-0.5">
                  <Text className="text-xs font-medium text-secondary-foreground">Current plan</Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-3xl font-bold text-foreground">$0</Text>
              <Text className="text-sm text-muted-foreground">/ forever</Text>
            </View>
            <View className="gap-2.5">
              {FREE_FEATURES.map((feature) => (
                <View key={feature} className="flex-row items-start gap-2">
                  <Icon name="check" size={16} color="#71717A" />
                  <Text className="flex-1 text-sm text-muted-foreground">{feature}</Text>
                </View>
              ))}
            </View>
            <Button variant="outline" className="w-full" onPress={() => {}}>
              Start with Free
            </Button>
          </CardContent>
        </Card>

        <Card className="flex-1 border-primary/40 shadow-lg shadow-primary/5">
          <View className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <View className="flex-row items-center gap-1 rounded-md bg-primary px-3 py-1">
              <Icon name="crown" size={12} color="#FFFFFF" />
              <Text className="text-xs font-medium text-white">Most popular</Text>
            </View>
          </View>
          <CardContent className="gap-6 pt-8">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold tracking-tight text-foreground">Pro</Text>
              {plan === "pro" && !creditsLoading ? (
                <View className="flex-row items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5">
                  <Icon name="check-circle" size={12} color="#4F46E5" />
                  <Text className="text-xs font-medium text-primary">Current plan</Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row flex-wrap items-baseline gap-1">
              <Text className="text-3xl font-bold text-foreground">
                {billingInterval === "month" ? PRO_MONTHLY_PRICE : PRO_YEARLY_PRICE}
              </Text>
              <Text className="text-sm text-muted-foreground">
                / {billingInterval === "month" ? "month" : "year"}
              </Text>
              {billingInterval === "year" ? (
                <Text className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Save 17%
                </Text>
              ) : null}
            </View>
            <View className="gap-2.5">
              {PRO_FEATURES.map((feature) => (
                <View key={feature} className="flex-row items-start gap-2">
                  <Icon name="check" size={16} color="#4F46E5" />
                  <Text className="flex-1 text-sm text-foreground">{feature}</Text>
                </View>
              ))}
            </View>
            {plan === "pro" && !creditsLoading ? (
              <View className="gap-2">
                <Button disabled className="w-full bg-primary/60">
                  You're on Pro
                </Button>
                {credits?.cancelAtPeriodEnd && credits?.endsAt ? (
                  <Text className="text-center text-xs text-muted-foreground">
                    Subscription cancelled — Pro access until{" "}
                    {new Date(credits.endsAt).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View className="gap-2">
                <Button
                  className="w-full"
                  onPress={handleUpgrade}
                  disabled={checkingOut || activating}
                  loading={checkingOut || activating}
                  icon={activating ? undefined : "sparkles"}
                  iconColor="#FFFFFF"
                >
                  {checkingOut
                    ? "Preparing checkout..."
                    : activating
                      ? "Activating Pro…"
                      : expired
                        ? "Renew Pro"
                        : "Upgrade to Pro"}
                </Button>
                {activating ? (
                  <Text className="text-center text-xs text-muted-foreground">
                    We received your payment — your plan is activating. This can take up to a
                    minute.
                  </Text>
                ) : null}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      <Text className="mx-auto max-w-md text-center text-xs text-muted-foreground">
        Payments are handled securely by Lemon Squeezy. Cancel anytime — you'll keep Pro benefits
        until the end of your billing period.
      </Text>
    </ScrollView>
  );
}
