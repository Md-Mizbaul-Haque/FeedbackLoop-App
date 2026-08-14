import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { cn } from "../../lib/utils";
import { Icon, type IconName } from "./Icon";

type Variant = "default" | "outline" | "ghost" | "destructive" | "secondary";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, { container: string; text: string }> = {
  default: {
    container: "bg-primary active:bg-primary/90",
    text: "text-white",
  },
  outline: {
    container: "border border-border bg-card active:bg-muted",
    text: "text-foreground",
  },
  ghost: {
    container: "active:bg-muted",
    text: "text-foreground",
  },
  destructive: {
    container: "bg-destructive active:bg-destructive/90",
    text: "text-white",
  },
  secondary: {
    container: "bg-secondary active:bg-secondary/80",
    text: "text-secondary-foreground",
  },
};

const SIZES: Record<Size, { container: string; text: string; icon: number }> = {
  sm: { container: "h-8 rounded-lg px-3", text: "text-xs", icon: 16 },
  md: { container: "h-10 rounded-lg px-4", text: "text-sm", icon: 18 },
  lg: { container: "h-12 rounded-xl px-6", text: "text-sm", icon: 18 },
  icon: { container: "h-9 w-9 rounded-lg", text: "", icon: 18 },
};

export function Button({
  children,
  onPress,
  variant = "default",
  size = "md",
  icon,
  iconColor,
  disabled = false,
  loading = false,
  className,
  textClassName,
  style,
}: {
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconColor?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  style?: object;
}) {
  const v = VARIANTS[variant];
  const s = SIZES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
      className={cn(
        "flex-row items-center justify-center gap-2",
        s.container,
        v.container,
        (disabled || loading) && "opacity-50",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#4F46E5" : "#FFFFFF"}
        />
      ) : icon ? (
        <Icon name={icon} size={s.icon} color={iconColor ?? (variant === "default" || variant === "destructive" ? "#FFFFFF" : "#4F46E5")} />
      ) : null}
      {children ? (
        <Text className={cn("font-medium", s.text, v.text, textClassName)}>
          {children}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Row container matching the web layout's flex + gap pattern. */
export function HStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn("flex-row items-center gap-2", className)}>{children}</View>;
}
