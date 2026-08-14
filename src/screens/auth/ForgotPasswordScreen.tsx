import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { friendlyAuthMessage } from "../../lib/friendly-auth-error";
import { getRedirectUrl } from "../../lib/constants";
import { isValidEmail } from "../../lib/validation";
import { useToast } from "../../components/ui/toast";
import { Button } from "../../components/ui/Button";
import { Field, FieldError, FieldLabel, Input } from "../../components/ui/Input";
import { Icon } from "../../components/ui/Icon";
import { AuthLayout } from "./AuthLayout";

export default function ForgotPasswordScreen({
  onNavigate,
}: {
  onNavigate: (screen: "login") => void;
}) {
  const { success } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl("auth/callback?next=update-password"),
    });
    setLoading(false);

    if (authError) {
      setError(friendlyAuthMessage(authError));
      return;
    }
    setSent(true);
    success("If an account exists for that email, a reset link has been sent.");
  };

  return (
    <AuthLayout>
      <View className="gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <View className="items-center gap-1.5">
          <Text className="text-2xl font-bold tracking-tight text-foreground">
            Reset your password
          </Text>
          <Text className="text-sm text-muted-foreground">
            Enter your email and we'll send you a reset link
          </Text>
        </View>

        {sent ? (
          <Text className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-700">
            If an account exists for that email, a reset link has been sent.
          </Text>
        ) : (
          <View className="gap-4">
            <Field>
              <FieldLabel>Email address</FieldLabel>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </Field>
            <FieldError>{error}</FieldError>
            <Button size="lg" onPress={handleSubmit} loading={loading}>
              Send Reset Link
            </Button>
          </View>
        )}

        <Pressable onPress={() => onNavigate("login")} className="flex-row items-center justify-center gap-1">
          <Icon name="arrow-left" size={14} color="#4F46E5" />
          <Text className="text-sm font-semibold text-primary">Back to sign in</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
