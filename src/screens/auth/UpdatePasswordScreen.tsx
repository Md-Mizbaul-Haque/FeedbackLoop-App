import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { friendlyAuthMessage } from "../../lib/friendly-auth-error";
import { useToast } from "../../components/ui/toast";
import { Button } from "../../components/ui/Button";
import { Field, FieldError, FieldLabel, Input } from "../../components/ui/Input";
import { Icon } from "../../components/ui/Icon";
import { AuthLayout } from "./AuthLayout";

export default function UpdatePasswordScreen({
  onSignedOut,
  onDone,
}: {
  onSignedOut: () => void;
  onDone: () => void;
}) {
  const { success } = useToast();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setChecking(false);
    });
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      setLoading(false);
      setError(friendlyAuthMessage(authError));
      return;
    }
    setLoading(false);
    setDone(true);
    success("Password set successfully!");
  };

  return (
    <AuthLayout>
      <View className="gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
        {checking ? (
          <View className="items-center py-8">
            <Icon name="loader" size={24} color="#4F46E5" />
          </View>
        ) : !hasSession ? (
          <View className="items-center gap-4">
            <Text className="text-2xl font-bold tracking-tight text-foreground">
              Link invalid or expired
            </Text>
            <Text className="text-center text-sm text-muted-foreground">
              That link is invalid or has expired. Please request a new one.
            </Text>
            <Button onPress={onSignedOut}>Request a New Link</Button>
          </View>
        ) : done ? (
          <View className="items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <Icon name="check-circle" size={28} color="#059669" />
            </View>
            <Text className="text-2xl font-bold tracking-tight text-foreground">
              Password set successfully!
            </Text>
            <Text className="text-center text-sm text-muted-foreground">
              You can now sign in with your email and password.
            </Text>
            <Button onPress={onDone}>Continue to app</Button>
          </View>
        ) : (
          <View className="gap-5">
            <View className="items-center gap-1.5">
              <Text className="text-2xl font-bold tracking-tight text-foreground">
                Set a new password
              </Text>
              <Text className="text-sm text-muted-foreground">
                Choose a password for your account
              </Text>
            </View>

            <View className="gap-4">
              <Field>
                <FieldLabel>New password</FieldLabel>
                <View className="relative">
                  <Input
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-lg"
                  >
                    <Icon name={showPassword ? "eye-off" : "eye"} size={16} color="#71717A" />
                  </Pressable>
                </View>
              </Field>

              <Field>
                <FieldLabel>Confirm password</FieldLabel>
                <Input
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                />
              </Field>

              <Text className="text-xs text-muted-foreground">
                Password must be at least 8 characters long.
              </Text>
              <FieldError>{error}</FieldError>
              <Button size="lg" onPress={handleSubmit} loading={loading}>
                Set Password
              </Button>
            </View>
          </View>
        )}
      </View>
    </AuthLayout>
  );
}
