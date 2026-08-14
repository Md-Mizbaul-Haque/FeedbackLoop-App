import React from "react";
import { Image, Text, View } from "react-native";
import { cn } from "../../lib/utils";

export function Avatar({
  uri,
  name,
  size = 40,
  className,
}: {
  uri?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={cn("items-center justify-center overflow-hidden bg-primary/15", className)}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          className="h-full w-full"
        />
      ) : (
        <Text
          style={{ fontSize: size * 0.38 }}
          className="font-semibold text-primary"
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
