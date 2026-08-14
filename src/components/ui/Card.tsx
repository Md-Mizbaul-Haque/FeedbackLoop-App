import React from "react";
import { View } from "react-native";
import { cn } from "../../lib/utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("rounded-2xl border border-border bg-card", className)}>
      {children}
    </View>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn("p-4 sm:p-6", className)}>{children}</View>;
}
