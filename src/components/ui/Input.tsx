import React from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { cn } from "../../lib/utils";

export function Field({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn("gap-1.5", className)}>{children}</View>;
}

export function FieldLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text className={cn("text-sm font-medium text-foreground", className)}>
      {children}
    </Text>
  );
}

export function FieldError({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <Text className={cn("text-xs font-medium text-destructive", className)}>
      {children}
    </Text>
  );
}

export function Input({
  className,
  ...props
}: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#A1A1AA"
      className={cn(
        "h-11 rounded-xl border border-input bg-card px-3 text-sm text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#A1A1AA"
      multiline
      textAlignVertical="top"
      className={cn(
        "min-h-[120px] rounded-xl border border-input bg-card p-3 text-sm text-foreground",
        className,
      )}
      {...props}
    />
  );
}
