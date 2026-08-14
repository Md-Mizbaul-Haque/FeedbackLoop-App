import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "feedbackloop:latest-summary";

export async function loadLatestSummary<T>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveLatestSummary(summary: unknown) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(summary));
  } catch {
    // ignore storage errors
  }
}

export async function clearLatestSummary() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
