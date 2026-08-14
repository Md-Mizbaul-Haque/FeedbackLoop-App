import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export const SETTINGS_KEY = "feedbackloop-settings";

export const DEFAULT_SETTINGS = {
  defaultView: "dashboard" as "dashboard" | "summaries",
};

export type UserSettings = typeof DEFAULT_SETTINGS;

const KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof UserSettings)[];

export function normalizeSettings(raw: unknown): UserSettings {
  const parsed = typeof raw === "object" && raw !== null ? (raw as object) : {};
  const result = { ...DEFAULT_SETTINGS };
  for (const key of KEYS) {
    const value = (parsed as Record<string, unknown>)[key];
    if (value === undefined) continue;
    if (typeof value === typeof DEFAULT_SETTINGS[key]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = value;
    }
  }
  return result;
}

export async function loadSettingsFromStorage(): Promise<UserSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? normalizeSettings(JSON.parse(raw)) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettingsToStorage(settings: UserSettings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

export async function fetchUserSettings(
  supabase: SupabaseClient,
  user: User,
): Promise<UserSettings> {
  const local = await loadSettingsFromStorage();
  const { data, error } = await supabase
    .from("user_settings")
    .select("settings")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return local;

  const remote = normalizeSettings(data.settings);
  await saveSettingsToStorage(remote);
  return remote;
}

export async function saveUserSettings(
  supabase: SupabaseClient,
  user: User,
  settings: UserSettings,
): Promise<{ error: string | null }> {
  await saveSettingsToStorage(settings);
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      settings: settings as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  return { error: error ? error.message : null };
}
