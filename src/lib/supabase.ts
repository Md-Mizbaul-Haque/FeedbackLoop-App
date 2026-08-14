import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./constants";

const projectRef = SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
const AUTH_TOKEN_KEY = `sb-${projectRef}-auth-token`;

const nativeStorage: SupportedStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

const storage: SupportedStorage = Platform.OS === "web" ? AsyncStorage : nativeStorage;

if (Platform.OS !== "web") {
  void (async () => {
    try {
      if (await SecureStore.getItemAsync(AUTH_TOKEN_KEY)) return;
      const legacy = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (legacy) await SecureStore.setItemAsync(AUTH_TOKEN_KEY, legacy);
    } catch {
      // ignore migration failures
    }
  })();
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
