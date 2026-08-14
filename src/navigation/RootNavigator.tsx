import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useSupabaseSession } from "../hooks/useSupabaseSession";
import { fetchUserSettings } from "../lib/settings";
import { isBiometricsEnabled } from "../lib/biometrics";
import { consumeIntentionalSignOut } from "../lib/auth-events";
import { useToast } from "../components/ui/toast";
import { LogoMark } from "../components/LogoMark";
import AuthNavigator, { type AuthStackParamList } from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import BiometricLockScreen from "../screens/auth/BiometricLockScreen";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#FAFAFA",
    card: "#FFFFFF",
    text: "#09090B",
    border: "#E3E1E6",
    primary: "#4F46E5",
  },
};

function parseCallbackUrl(url: string): { code: string | null; next: string | null } {
  const code = url.match(/[?&]code=([^&]+)/)?.[1] ?? null;
  const next = url.match(/[?&]next=([^&]+)/)?.[1] ?? null;
  return { code: code ? decodeURIComponent(code) : null, next: next ? decodeURIComponent(next) : null };
}

export default function RootNavigator() {
  const { session, loading } = useSupabaseSession();
  const queryClient = useQueryClient();
  const { info } = useToast();
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);
  const [forcedUpdate, setForcedUpdate] = useState(false);
  const [biometricsEnabled, setBiometricsEnabledState] = useState(false);
  const [biometricsChecked, setBiometricsChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const authNavRef = useRef<AuthStackParamList | null>(null);
  const handledInitialUrl = useRef(false);

  const resolveLanding = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const settings = await fetchUserSettings(supabase, user);
      if (settings.defaultView === "summaries") setInitialTab("Summaries");
    } catch {
      // fall back to dashboard
    }
  }, []);

  const handleCallbackUrl = useCallback(
    async (url: string | null) => {
      if (!url) return;
      const { code, next } = parseCallbackUrl(url);
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Auth callback failed:", error);
          return;
        }
      }
      if (next === "update-password") {
        setForcedUpdate(true);
      }
    },
    [],
  );

  // Deep links (native): OAuth / magic link / password reset callbacks.
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!handledInitialUrl.current) {
      handledInitialUrl.current = true;
      Linking.getInitialURL().then((url) => handleCallbackUrl(url));
    }
    const sub = Linking.addEventListener("url", ({ url }) => handleCallbackUrl(url));
    return () => sub.remove();
  }, [handleCallbackUrl]);

  // On first sign-in, honor the user's default-landing setting.
  const prevSessionRef = useRef<boolean | null>(null);
  useEffect(() => {
    const hasSession = !!session;
    if (prevSessionRef.current !== hasSession) {
      const hadSession = prevSessionRef.current;
      prevSessionRef.current = hasSession;
      if (hasSession) {
        if (hadSession === false) setUnlocked(true);
        setInitialTab(undefined);
        void resolveLanding();
      }
    }
  }, [session, resolveLanding]);

  useEffect(() => {
    let mounted = true;
    void isBiometricsEnabled().then((enabled) => {
      if (!mounted) return;
      setBiometricsEnabledState(enabled);
      setBiometricsChecked(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!session) setUnlocked(false);
  }, [session]);

  // Surface unexpected session expiry (e.g. refresh token revoked).
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !consumeIntentionalSignOut()) {
        info("Your session has expired. Please sign in again.");
      }
    });
    return () => subscription.unsubscribe();
  }, [info]);

  const needsUnlock =
    !!session &&
    !forcedUpdate &&
    Platform.OS !== "web" &&
    biometricsChecked &&
    biometricsEnabled &&
    !unlocked;

  if (loading || !biometricsChecked) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <LogoMark size={48} />
        <View className="mt-4">
          <ActivityIndicator color="#4F46E5" />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      {needsUnlock ? (
        <BiometricLockScreen
          onUnlocked={() => setUnlocked(true)}
          onSignOut={() => {
            void supabase.auth.signOut();
          }}
        />
      ) : session && !forcedUpdate ? (
        <MainNavigator initialTab={initialTab} />
      ) : (
        <AuthNavigator
          initialRoute={forcedUpdate ? "UpdatePassword" : "Login"}
          onSignedIn={() => {
            void resolveLanding();
          }}
          onForcedUpdateDone={() => setForcedUpdate(false)}
        />
      )}
    </NavigationContainer>
  );
}