import React from "react";
import { Image } from "react-native";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <Image
      source={require("../../assets/logo.png")}
      style={{ width: size, height: size * (1024 / 1536) }}
      resizeMode="contain"
    />
  );
}
