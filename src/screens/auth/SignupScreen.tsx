import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { friendlyAuthMessage } from "../../lib/friendly-auth-error";
import { API_URL } from "../../lib/constants";
import { isValidEmail } from "../../lib/validation";
import { useToast } from "../../components/ui/toast";
import { Button } from "../../components/ui/Button";
import { Field, FieldError, FieldLabel, Input } from "../../components/ui/Input";
import { Icon } from "../../components/ui/Icon";
import { AuthLayout } from "./AuthLayout";

const RESEND_COOLDOWN = 60;

export default function SignupScreen({
  onSignedIn,
  onNavigate,
}: {
  onSignedIn: () => void;
  onNavigate: (screen: "login") => void;
}) {
  const { toast, success } = useToast();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (step !== "otp" || resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [step, resendIn]);

  const sendOtp = async (targetEmail: string, targetPassword: string) => {
    const res = await fetch(`${API_URL}/api/signup-otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, password: targetPassword }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: res.ok, error: data.error };
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!isValidEmail(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    const result = await sendOtp(email, password);
    setLoading(false);

    if (!result.ok) {
      setFormError(result.error ?? "Could not send the code. Please try again.");
      return;
    }

    setCode("");
    setOtpError("");
    setResendIn(RESEND_COOLDOWN);
    setStep("otp");
  };

  const handleResend = async () => {
    if (resending || resendIn > 0) return;
    setResending(true);
    const result = await sendOtp(email, password);
    setResending(false);
    if (!result.ok) {
      setOtpError(result.error ?? "Could not resend the code. Please try again.");
      return;
    }
    setCode("");
    setOtpError("");
    setResendIn(RESEND_COOLDOWN);
    success("A new code has been sent.");
  };

  const handleVerify = async () => {
    if (code.length !== 6 || verifying) return;
    setVerifying(true);
    setOtpError("");
    try {
      const res = await fetch(`${API_URL}/api/signup-otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setOtpError(data.error ?? "Could not verify the code.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        success("Account created! Sign in to continue.");
        onNavigate("login");
        return;
      }
      success("Account created — welcome!");
      onSignedIn();
    } finally {
      setVerifying(false);
    }
  };

  const formatCountdown = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <AuthLayout>
      <View className="gap-6">
        {step === "details" ? (
          <>
            <View className="gap-1.5">
              <Text className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Create your account
              </Text>
              <Text className="text-sm text-muted-foreground">
                Start summarizing customer feedback with AI
              </Text>
            </View>

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

              <Field>
                <FieldLabel>Password</FieldLabel>
                <View className="relative">
                  <Input
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
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
                <View className="relative">
                  <Input
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter your password"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-lg"
                  >
                    <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={16} color="#71717A" />
                  </Pressable>
                </View>
              </Field>

              <FieldError>{formError}</FieldError>

              <Button size="lg" onPress={handleSubmit} loading={loading}>
                Create Account
              </Button>
            </View>
          </>
        ) : (
          <>
            <View className="gap-1.5">
              <View className="mb-2 h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <Icon name="key" size={20} color="#4F46E5" />
              </View>
              <Text className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Enter the verification code
              </Text>
              <Text className="text-sm text-muted-foreground">
                We sent a 6-digit code to <Text className="font-medium text-foreground">{email}</Text>
              </Text>
              <Text className="rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                Didn't receive it? Check your spam or promotions folder.
              </Text>
            </View>

            <View className="gap-5">
              <TextInput
                value={code}
                onChangeText={(value) => {
                  setCode(value.replace(/[^0-9]/g, "").slice(0, 6));
                  setOtpError("");
                }}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="------"
                placeholderTextColor="#D4D4D8"
                className="h-14 rounded-xl border border-input bg-card text-center text-2xl font-bold tracking-[0.6em] text-foreground"
              />
              <FieldError className="text-center">{otpError}</FieldError>

              <Button size="lg" onPress={handleVerify} loading={verifying} disabled={code.length !== 6}>
                Verify & Create Account
              </Button>

              <View className="flex-row items-center justify-center gap-1.5">
                {resendIn > 0 ? (
                  <Text className="text-sm text-muted-foreground">
                    Resend code in <Text className="font-semibold text-foreground">{formatCountdown(resendIn)}</Text>
                  </Text>
                ) : (
                  <>
                    <Text className="text-sm text-muted-foreground">Didn't get it?</Text>
                    <Pressable onPress={handleResend} disabled={resending}>
                      <Text className="text-sm font-semibold text-primary">
                        {resending ? "Sending..." : "Resend code"}
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>

              <Pressable onPress={() => setStep("details")} className="flex-row items-center justify-center gap-1">
                <Icon name="arrow-left" size={14} color="#71717A" />
                <Text className="text-sm text-muted-foreground">Change email</Text>
              </Pressable>
            </View>
          </>
        )}

        <Text className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Text className="font-semibold text-primary" onPress={() => onNavigate("login")}>
            Sign in
          </Text>
        </Text>
      </View>
    </AuthLayout>
  );
}
