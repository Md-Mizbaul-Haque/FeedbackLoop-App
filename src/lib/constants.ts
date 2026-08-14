import { Platform } from "react-native";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * The Next.js backend that hosts the signup-OTP flow and Lemon Squeezy
 * checkout/portal endpoints. Falls back to the production URL.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://feedback-loop-delta.vercel.app";

export const APP_SCHEME = "feedbackloop";

/** Deep-link prefix used for OAuth/magic-link callbacks. */
export function getRedirectUrl(path = "auth/callback") {
  if (Platform.OS === "web") {
    return `${window.location.origin}/${path}`;
  }
  return `${APP_SCHEME}://${path}`;
}
