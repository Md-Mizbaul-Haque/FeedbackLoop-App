import React from "react";
import { Text } from "react-native";
import { cn } from "../../lib/utils";

/**
 * Badge renders as a single Text so color/border/bg classes compose the way
 * they do in the web shadcn Badge (e.g. "bg-emerald-500/10 text-emerald-700").
 */
export function Badge({
  children,
  className,
  variant = "default",
}: {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary";
}) {
  const base =
    variant === "outline"
      ? "border"
      : variant === "secondary"
        ? "bg-secondary text-secondary-foreground"
        : "";
  return (
    <Text
      className={cn(
        "self-start overflow-hidden rounded-md px-2 py-0.5 text-xs font-medium",
        base,
        className,
      )}
    >
      {children}
    </Text>
  );
}
