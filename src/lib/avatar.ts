import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const AVATAR_SIZE = 512;
const SIGNED_URL_TTL_SECONDS = 3600;
const REFRESH_BEFORE_MS = 10 * 60 * 1000;
const SIGNED_URL_STALE_MS =
  (SIGNED_URL_TTL_SECONDS - REFRESH_BEFORE_MS / 1000) * 1000;
const SIGNED_URL_GC_MS = SIGNED_URL_TTL_SECONDS * 1000;

const avatarUrlQueryKey = (path: string) => ["avatar", "signed-url", path] as const;

export const AVATAR_MAX_SIZE = 2 * 1024 * 1024;

export function isStorageAvatarPath(value: unknown): value is string {
  return typeof value === "string" && /^[^/]+\/[^/]+\.\w+$/.test(value);
}

export function getAvatarStoragePath(userId: string): string {
  return `${userId}/avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
}

export function useAvatarUrl(user: User | null): string | null {
  const meta = user?.user_metadata?.avatar_url;
  const isExternalUrl = typeof meta === "string" && /^https?:\/\//i.test(meta);
  const isStoragePath = isStorageAvatarPath(meta);
  const path = isStoragePath && typeof meta === "string" ? meta : "";

  const { data: signed, refetch } = useQuery({
    queryKey: avatarUrlQueryKey(path),
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      if (error || !data) return null;
      return { path, url: data.signedUrl };
    },
    enabled: isStoragePath && path !== "",
    staleTime: SIGNED_URL_STALE_MS,
    gcTime: SIGNED_URL_GC_MS,
  });

  useEffect(() => {
    if (!isStoragePath || path === "") return;
    const timer = setTimeout(() => {
      refetch();
    }, SIGNED_URL_TTL_SECONDS * 1000 - REFRESH_BEFORE_MS);
    return () => clearTimeout(timer);
  }, [isStoragePath, path, refetch]);

  if (isExternalUrl && typeof meta === "string") return meta;
  return signed?.path === path && signed.url ? signed.url : null;
}

/** Base64 -> Uint8Array without relying on global atob/btoa. */
export function base64ToUint8Array(base64: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup: Record<string, number> = {};
  for (let i = 0; i < alphabet.length; i += 1) lookup[alphabet[i]] = i;

  const clean = base64.replace(/=+$/, "");
  const output = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let index = 0;

  for (let i = 0; i < clean.length; i += 1) {
    const value = lookup[clean[i]];
    if (value === undefined) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output[index++] = (buffer >> bits) & 0xff;
    }
  }
  return output.slice(0, index);
}

export interface PickedAvatar {
  uri: string;
  bytes: Uint8Array;
  mimeType: string;
}

/**
 * Opens the photo library, enforces the 2 MB limit, and returns the image
 * ready to upload to Supabase Storage.
 */
export async function pickAvatar(): Promise<PickedAvatar> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      "Photo library access is needed to upload an avatar. Enable it in Settings.",
    );
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) {
    throw new Error("cancelled");
  }

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > AVATAR_MAX_SIZE) {
    throw new Error("The image must be smaller than 2 MB.");
  }
  if (!asset.base64) {
    throw new Error("Could not read the image file. Please try again.");
  }

  return {
    uri: asset.uri,
    bytes: base64ToUint8Array(asset.base64),
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}
