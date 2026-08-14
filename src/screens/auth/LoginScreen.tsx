import React, { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "../../lib/supabase";
import { friendlyAuthMessage } from "../../lib/friendly-auth-error";
import { fetchUserSettings } from "../../lib/settings";
import { getRedirectUrl } from "../../lib/constants";
import { isValidEmail } from "../../lib/validation";
import { useToast } from "../../components/ui/toast";
import { Button } from "../../components/ui/Button";
import { Field, FieldError, FieldLabel, Input } from "../../components/ui/Input";
import { Icon } from "../../components/ui/Icon";
import { AuthLayout } from "./AuthLayout";

export default function LoginScreen({
  onSignedIn,
  onNavigate,
}: {
  onSignedIn: () => void;
  onNavigate: (screen: "signup" | "forgot") => void;
}) {
  const { toast, success, error } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState<"password" | "google" | "magic" | "apple" | null>(null);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  const handlePasswordLogin = async () => {
    setFormError("");
    setEmailNotConfirmed(false);
    const trimmed = email.trim();
    if (!trimmed) {
      setFormError("Enter your email address.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setFormError("Enter your password.");
      return;
    }
    setLoading("password");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    setLoading(null);
    if (authError) {
      if (authError.code === "email_not_confirmed") {
        setEmailNotConfirmed(true);
      }
      setFormError(friendlyAuthMessage(authError));
      return;
    }
    success("Signed in successfully!");
    onSignedIn();
  };

  const handleGoogleLogin = async () => {
    setLoading("google");
    setFormError("");
    setEmailNotConfirmed(false);
    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectUrl(),
          skipBrowserRedirect: Platform.OS !== "web",
        },
      });
      if (authError) {
        setLoading(null);
        setFormError(friendlyAuthMessage(authError));
        return;
      }
      if (!data?.url) {
        setLoading(null);
        setFormError("Could not start Google sign-in. Please try again.");
        return;
      }
      if (Platform.OS === "web") {
        window.location.href = data.url;
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(data.url, getRedirectUrl());
      if (result.type === "success" && result.url) {
        const code = extractCode(result.url);
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setLoading(null);
            setFormError(friendlyAuthMessage(exchangeError));
            return;
          }
          success("Signed in successfully!");
          onSignedIn();
          return;
        }
      }
      setLoading(null);
      if (result.type !== "cancel") {
        setFormError("Google sign-in did not complete. Please try again.");
      }
    } catch (err) {
      setLoading(null);
      console.error(err);
      setFormError("Something went wrong. Please try again in a moment.");
    }
  };

  const handleAppleLogin = async () => {
    setLoading("apple");
    setFormError("");
    setEmailNotConfirmed(false);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });
      if (!credential.identityToken) {
        setFormError("Apple sign-in did not complete. Please try again.");
        return;
      }
      const { error: authError } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      if (authError) {
        setFormError(friendlyAuthMessage(authError));
        return;
      }
      success("Signed in successfully!");
      onSignedIn();
    } catch (err) {
      if ((err as { code?: number }).code !== 1001) {
        console.error(err);
        setFormError("Apple sign-in did not complete. Please try again.");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleMagicLink = async () => {
    setFormError("");
    setEmailNotConfirmed(false);
    const trimmed = email.trim();
    if (!trimmed) {
      setFormError("Enter your email address first.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setFormError("Enter a valid email address.");
      return;
    }
    setLoading("magic");
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: getRedirectUrl(), shouldCreateUser: false },
    });
    setLoading(null);
    if (authError) {
      setFormError(friendlyAuthMessage(authError));
      return;
    }
    toast("info", "Check your inbox (and spam folder) — a magic link has been sent.");
  };

  const handleResendConfirmation = async () => {
    if (resendingConfirmation) return;
    setResendingConfirmation(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: getRedirectUrl() },
    });
    setResendingConfirmation(false);
    if (resendError) {
      setFormError(friendlyAuthMessage(resendError));
      return;
    }
    setEmailNotConfirmed(false);
    toast("info", "Confirmation email sent — check your inbox (and spam folder).");
  };

  return (
    <AuthLayout>
      <View className="gap-6">
        <View className="gap-1.5">
          <Text className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back!
          </Text>
          <Text className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </Text>
        </View>

        <View className="gap-3">
          {Platform.OS === "ios" ? (
            <Button variant="outline" size="lg" icon="apple" loading={loading === "apple"} disabled={loading !== null} onPress={handleAppleLogin}>
              Continue with Apple
            </Button>
          ) : null}
          <Button variant="outline" size="lg" icon="google" loading={loading === "google"} disabled={loading !== null} onPress={handleGoogleLogin}>
            Continue with Google
          </Button>
          <Button variant="outline" size="lg" icon="mail" loading={loading === "magic"} disabled={loading !== null} onPress={handleMagicLink}>
            Continue with Magic Link
          </Button>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-border" />
          <Text className="text-xs font-medium uppercase text-muted-foreground">
            Or sign in with email
          </Text>
          <View className="h-px flex-1 bg-border" />
        </View>

        <View className="gap-4">
          <Field>
            <FieldLabel>Email address</FieldLabel>
            <Input
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setEmailNotConfirmed(false);
              }}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </Field>

          <Field>
            <View className="flex-row items-center justify-between">
              <FieldLabel>Password</FieldLabel>
              <Pressable onPress={() => onNavigate("forgot")}>
                <Text className="text-xs font-medium text-primary">Forgot password?</Text>
              </Pressable>
            </View>
            <View className="relative">
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-lg"
              >
                <Icon name={showPassword ? "eye-off" : "eye"} size={16} color="#71717A" />
              </Pressable>
            </View>
          </Field>

          <FieldError>{formError}</FieldError>

          {emailNotConfirmed ? (
            <Button
              variant="outline"
              size="sm"
              onPress={handleResendConfirmation}
              loading={resendingConfirmation}
              disabled={resendingConfirmation}
            >
              Resend confirmation email
            </Button>
          ) : null}

          <Button size="lg" onPress={handlePasswordLogin} loading={loading === "password"} disabled={loading !== null}>
            Sign In
          </Button>
        </View>

        <Text className="text-center text-sm text-muted-foreground">
          No account yet?{" "}
          <Text className="font-semibold text-primary" onPress={() => onNavigate("signup")}>
            Sign up
          </Text>
        </Text>
      </View>
    </AuthLayout>
  );
}

function extractCode(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("code");
  } catch {
    return null;
  }
}
