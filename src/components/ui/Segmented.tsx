import React from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "../../lib/utils";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "flex-row items-center rounded-full border border-border bg-secondary/40 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={cn(
              "rounded-full px-4 py-1.5",
              active ? "bg-card shadow-sm" : "",
            )}
          >
            <Text
              className={cn(
                "text-sm font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
