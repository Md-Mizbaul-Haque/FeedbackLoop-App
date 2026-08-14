import React from "react";
import { Text, View } from "react-native";
import { Icon } from "./Icon";

export function EmptyState({
  title = "Not enough evidence",
  hint,
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <View className="items-center justify-center rounded-xl border border-dashed border-border px-4 py-8">
      <Icon name="inbox" size={24} color="#A1A1AA" />
      <Text className="mt-2 text-sm font-medium text-muted-foreground">{title}</Text>
      {hint ? (
        <Text className="mt-1 max-w-xs text-center text-xs text-muted-foreground/70">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function SectionHeading({
  title,
  badge,
  description,
  actions,
}: {
  title: string;
  badge?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </Text>
          {badge ? (
            <Text className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {badge}
            </Text>
          ) : null}
        </View>
        {description ? (
          <Text className="mt-0.5 text-xs text-muted-foreground">{description}</Text>
        ) : null}
      </View>
      {actions ? <View className="flex-row items-center gap-2">{actions}</View> : null}
    </View>
  );
}

export function AIBadge({ label = "AI generated" }: { label?: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-md border border-border bg-muted/60 px-1.5 py-0.5">
      <Icon name="sparkles" size={12} color="#71717A" />
      <Text className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}
