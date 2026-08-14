import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type IconName =
  | "sparkles"
  | "upload-cloud"
  | "loader"
  | "check-circle"
  | "alert-circle"
  | "alert-triangle"
  | "mail"
  | "lock"
  | "eye"
  | "eye-off"
  | "logout"
  | "login"
  | "dashboard"
  | "file-text"
  | "user"
  | "settings"
  | "credit-card"
  | "search"
  | "plus"
  | "close"
  | "more-vertical"
  | "save"
  | "copy"
  | "check"
  | "shield-check"
  | "star"
  | "message-text"
  | "chevron-down"
  | "quote"
  | "crown"
  | "zap"
  | "sliders"
  | "trash"
  | "building"
  | "calendar"
  | "gauge"
  | "globe"
  | "key"
  | "arrow-left"
  | "inbox"
  | "google"
  | "apple"
  | "menu"
  | "refresh";

const GLYPHS: Record<IconName, keyof typeof MaterialCommunityIcons.glyphMap> = {
  sparkles: "creation",
  "upload-cloud": "cloud-upload-outline",
  loader: "loading",
  "check-circle": "check-circle-outline",
  "alert-circle": "alert-circle-outline",
  "alert-triangle": "alert-outline",
  mail: "email-outline",
  lock: "lock-outline",
  eye: "eye-outline",
  "eye-off": "eye-off-outline",
  logout: "logout",
  login: "login",
  dashboard: "view-dashboard-outline",
  "file-text": "file-document-outline",
  user: "account-outline",
  settings: "cog-outline",
  "credit-card": "credit-card-outline",
  search: "magnify",
  plus: "plus",
  close: "close",
  "more-vertical": "dots-vertical",
  save: "content-save-outline",
  copy: "content-copy",
  check: "check",
  "shield-check": "shield-check-outline",
  star: "star",
  "message-text": "message-text-outline",
  "chevron-down": "chevron-down",
  quote: "format-quote-close",
  crown: "crown-outline",
  zap: "lightning-bolt",
  sliders: "tune-variant",
  trash: "trash-can-outline",
  building: "office-building-outline",
  calendar: "calendar-outline",
  gauge: "gauge",
  globe: "web",
  key: "key-outline",
  "arrow-left": "arrow-left",
  inbox: "inbox-outline",
  google: "google",
  apple: "apple",
  menu: "menu",
  refresh: "refresh",
};

export function Icon({
  name,
  size = 20,
  color = "#71717A",
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <MaterialCommunityIcons name={GLYPHS[name]} size={size} color={color} />;
}
