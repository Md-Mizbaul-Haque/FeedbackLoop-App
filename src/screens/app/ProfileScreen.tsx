import React, { useEffect, useState } from "react";
import { Image, Platform, Pressable, ScrollView, Switch, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { friendlyAuthMessage } from "../../lib/friendly-auth-error";
import {
  AVATAR_MAX_SIZE,
  getAvatarStoragePath,
  isStorageAvatarPath,
  pickAvatar,
  useAvatarUrl,
} from "../../lib/avatar";
import {
  businessQueryKey,
  effectiveUsage,
  isExpiredSubscription,
  useBusinessProfile,
  useCredits,
  useUser,
  userQueryKey,
} from "../../lib/queries";
import { API_URL } from "../../lib/constants";
import {
  authenticateWithBiometrics,
  canUseBiometrics,
  isBiometricsEnabled,
  setBiometricsEnabled,
} from "../../lib/biometrics";
import { useToast } from "../../components/ui/toast";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Modal";
import { Field, FieldLabel, Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { Icon } from "../../components/ui/Icon";

const CREDITS_PER_WINDOW = 10;

function formatDate(value: string | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfileScreen({ onOpenPricing }: { onOpenPricing: () => void }) {
  const queryClient = useQueryClient();
  const { success, error: errorToast } = useToast();
  const { user } = useUser();
  const { credits } = useCredits(user?.id ?? null);
  const { businessName, website } = useBusinessProfile(user?.id ?? null);
  const avatarUrl = useAvatarUrl(user);

  const [fullName, setFullName] = useState("");
  const [businessNameForm, setBusinessNameForm] = useState("");
  const [websiteForm, setWebsiteForm] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [pendingAvatarBytes, setPendingAvatarBytes] = useState<Uint8Array | null>(null);
  const [pendingAvatarMime, setPendingAvatarMime] = useState("image/jpeg");
  const [removePending, setRemovePending] = useState(false);
  const [removeAvatarOpen, setRemoveAvatarOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabledState] = useState(false);

  useEffect(() => {
    let mounted = true;
    void canUseBiometrics().then((ok) => {
      if (!mounted) return;
      setBiometricsAvailable(ok);
      if (ok) {
        void isBiometricsEnabled().then((enabled) => {
          if (mounted) setBiometricsEnabledState(enabled);
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(
        (user.user_metadata?.full_name as string) ??
          (user.user_metadata?.name as string) ??
          "",
      );
    }
  }, [user]);

  useEffect(() => {
    setBusinessNameForm(businessName);
    setWebsiteForm(website);
  }, [businessName, website]);

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    (user?.email ? user.email.split("@")[0] : "");
  const initials =
    displayName
      .split(" ")
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const { used: usageUsed, resetAt: usageResetAt } = effectiveUsage(credits);
  const plan = credits?.plan ?? "free";
  const expired = isExpiredSubscription(credits);
  const statusInfo: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-emerald-500/10 text-emerald-600" },
    on_trial: { label: "Trial", className: "bg-emerald-500/10 text-emerald-600" },
    past_due: { label: "Payment failed", className: "bg-destructive/10 text-destructive" },
    unpaid: { label: "Payment failed", className: "bg-destructive/10 text-destructive" },
    cancelled: { label: "Cancelled", className: "bg-amber-500/10 text-amber-600" },
    paused: { label: "Paused", className: "bg-secondary text-secondary-foreground" },
    expired: { label: "Expired", className: "bg-secondary text-secondary-foreground" },
  };
  const status = credits?.subscriptionStatus ? statusInfo[credits.subscriptionStatus] : null;

  const handleAvatarChange = async () => {
    try {
      const picked = await pickAvatar();
      if (picked.uri === "cancelled") return;
      setPendingAvatarUri(picked.uri);
      setPendingAvatarBytes(picked.bytes);
      setPendingAvatarMime(picked.mimeType);
      setRemovePending(false);
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Could not process the image. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);

    const metadata: Record<string, string> = { full_name: fullName.trim() };
    let uploadedPath: string | null = null;

    try {
      if (pendingAvatarBytes) {
        uploadedPath = getAvatarStoragePath(user.id);
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(uploadedPath, pendingAvatarBytes, { contentType: pendingAvatarMime });
        if (uploadError) {
          console.error("Avatar upload failed:", uploadError);
          errorToast("Could not upload the image. Please try again.");
          return;
        }
        metadata.avatar_url = uploadedPath;
      } else if (removePending) {
        metadata.avatar_url = "";
      }

      const { error: updateError } = await supabase.auth.updateUser({ data: metadata });
      if (updateError) {
        if (uploadedPath) {
          await supabase.storage.from("avatars").remove([uploadedPath]);
        }
        errorToast(friendlyAuthMessage(updateError));
        return;
      }

      if (uploadedPath) {
        const { data: existing, error: listError } = await supabase.storage
          .from("avatars")
          .list(user.id);
        if (!listError && existing) {
          const stale = existing
            .map((item) => `${user.id}/${item.name}`)
            .filter((itemPath) => itemPath !== uploadedPath);
          if (stale.length > 0) {
            await supabase.storage.from("avatars").remove(stale);
          }
        }
      } else if (removePending) {
        const currentPath = (user.user_metadata?.avatar_url as string | undefined) ?? "";
        if (isStorageAvatarPath(currentPath)) {
          await supabase.storage.from("avatars").remove([currentPath]);
        }
      }

      setPendingAvatarUri(null);
      setPendingAvatarBytes(null);
      setRemovePending(false);
      queryClient.invalidateQueries({ queryKey: userQueryKey });
      success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      errorToast("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!user || savingBusiness) return;

    const trimmedWebsite = websiteForm.trim();
    if (trimmedWebsite) {
      const urlPattern = /^https?:\/\/[^\s]+$/i;
      const valid = urlPattern.test(trimmedWebsite) || /^[^\s]+\.[a-z]{2,}$/i.test(trimmedWebsite);
      if (!valid) {
        errorToast("Enter a valid website URL.");
        return;
      }
    }

    setSavingBusiness(true);
    const { error: saveError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          business_name: businessNameForm.trim(),
          website: trimmedWebsite,
        },
        { onConflict: "id" },
      );
    setSavingBusiness(false);

    if (saveError) {
      console.error("Failed to save business info:", saveError);
      errorToast("Could not save business info. Please try again.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: businessQueryKey(user.id) });
    success("Business info saved!");
  };

  const handlePasswordSubmit = async () => {
    if (newPassword.length < 8) {
      errorToast("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      errorToast("Passwords do not match.");
      return;
    }

    setSettingPassword(true);
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setSettingPassword(false);

    if (updateError) {
      errorToast(friendlyAuthMessage(updateError));
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    if (data.user) queryClient.setQueryData(userQueryKey, data.user);
    success("Password updated successfully!");
  };

  const handleToggleBiometrics = async (enabled: boolean) => {
    if (enabled) {
      const ok = await authenticateWithBiometrics();
      if (!ok) {
        errorToast("Could not enable Face ID. Try again.");
        return;
      }
    }
    setBiometricsEnabledState(enabled);
    await setBiometricsEnabled(enabled);
    success(enabled ? "Face ID enabled." : "Face ID disabled.");
  };

  const handleManageSubscription = async () => {
    if (managingSubscription) return;
    setManagingSubscription(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        errorToast("Please sign in again.");
        return;
      }
      const response = await fetch(`${API_URL}/api/lemon-squeezy/portal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) {
        errorToast(body?.error ?? "Could not open the billing portal.");
        return;
      }
      await WebBrowser.openBrowserAsync(body.url);
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      success("Billing updated. If you made changes, they may take a moment to reflect.");
    } catch (err) {
      console.error("Billing portal failed:", err);
      errorToast("Could not open the billing portal.");
    } finally {
      setManagingSubscription(false);
    }
  };

  const profileAvatarUri = pendingAvatarUri ?? avatarUrl;

  return (
    <ScrollView contentContainerClassName="gap-6 pb-10">
      <View>
        <Text className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Profile</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Manage your personal details and account preferences.
        </Text>
      </View>

      <Card>
        <CardContent className="gap-6">
          <View className="flex-row items-center gap-4">
            <Avatar uri={profileAvatarUri} name={displayName} size={64} />
            <View className="flex-1">
              <Text className="text-lg font-bold tracking-tight text-foreground">
                {displayName || "…"}
              </Text>
              <Text className="text-sm text-muted-foreground">{user?.email ?? ""}</Text>
            </View>
            <View className="gap-2">
              <Button size="sm" variant="outline" icon="upload-cloud" onPress={handleAvatarChange}>
                {pendingAvatarUri ? "Change" : "Upload"}
              </Button>
              {(pendingAvatarUri || avatarUrl) ? (
                <Button
                  size="sm"
                  variant="ghost"
                  icon="trash"
                  onPress={() => {
                    if (pendingAvatarUri) {
                      setPendingAvatarUri(null);
                      setPendingAvatarBytes(null);
                      setRemovePending(false);
                    } else {
                      setRemoveAvatarOpen(true);
                    }
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </View>
          </View>

          {pendingAvatarUri ? (
            <View className="flex-row items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
              <Image source={{ uri: pendingAvatarUri }} className="h-10 w-10 rounded-full" />
              <Text className="flex-1 text-xs text-muted-foreground">
                New photo selected — save your profile to upload it.
              </Text>
            </View>
          ) : null}

          <View className="gap-4">
            <Field>
              <FieldLabel>Full name</FieldLabel>
              <Input value={fullName} onChangeText={setFullName} placeholder="Your name" />
            </Field>

            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={user?.email ?? ""} editable={false} />
            </Field>

            <Button onPress={handleSave} loading={saving} disabled={saving}>
              Save Profile
            </Button>
          </View>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-6">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <Icon name="building" size={16} color="#4F46E5" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold tracking-tight text-foreground">Business Info</Text>
              <Text className="text-xs text-muted-foreground">
                Shown on your public feedback widget.
              </Text>
            </View>
          </View>

          <View className="gap-4">
            <Field>
              <FieldLabel>Business name</FieldLabel>
              <Input value={businessNameForm} onChangeText={setBusinessNameForm} placeholder="Your business" />
            </Field>
            <Field>
              <FieldLabel>Website</FieldLabel>
              <Input value={websiteForm} onChangeText={setWebsiteForm} placeholder="https://example.com" autoCapitalize="none" keyboardType="url" />
            </Field>
            <Button variant="outline" onPress={handleSaveBusiness} loading={savingBusiness} disabled={savingBusiness}>
              Save Business Info
            </Button>
          </View>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-5">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <Icon name="credit-card" size={16} color="#4F46E5" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold tracking-tight text-foreground">Subscription</Text>
              <Text className="text-xs text-muted-foreground">Your plan, usage, and billing.</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-3">
            <View className="min-w-[140px] flex-1 rounded-xl border border-border/70 bg-secondary/30 p-4">
              <Text className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Plan</Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Text className="text-lg font-bold text-foreground capitalize">{plan}</Text>
                {status ? (
                  <Badge className={`border-0 ${status.className}`}>{status.label}</Badge>
                ) : null}
              </View>
            </View>
            <View className="min-w-[140px] flex-1 rounded-xl border border-border/70 bg-secondary/30 p-4">
              <Text className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Usage</Text>
              <Text className="mt-1 text-lg font-bold text-foreground">
                {usageUsed} / {plan === "pro" ? "50" : String(CREDITS_PER_WINDOW)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-muted-foreground">
                {usageResetAt ? `Resets ${new Date(usageResetAt).toLocaleDateString()}` : "per 24 hours"}
              </Text>
            </View>
          </View>

          {expired ? (
            <Button icon="sparkles" iconColor="#FFFFFF" onPress={onOpenPricing}>
              Renew Pro
            </Button>
          ) : plan === "pro" ? (
            <Button variant="outline" onPress={handleManageSubscription} loading={managingSubscription} disabled={managingSubscription}>
              Manage subscription
            </Button>
          ) : (
            <Button icon="sparkles" iconColor="#FFFFFF" onPress={onOpenPricing}>
              Upgrade to Pro
            </Button>
          )}

          {plan === "pro" && credits?.renewsAt ? (
            <Text className="text-xs text-muted-foreground">
              Renews {formatDate(credits.renewsAt ?? undefined)}
              {credits?.cancelAtPeriodEnd && credits?.endsAt
                ? ` · Cancels ${formatDate(credits.endsAt)}`
                : ""}
            </Text>
          ) : null}
        </CardContent>
      </Card>

      {Platform.OS !== "web" && biometricsAvailable ? (
        <Card>
          <CardContent className="gap-5">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary">
                <Icon name="shield-check" size={16} color="#4F46E5" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold tracking-tight text-foreground">Face ID</Text>
                <Text className="text-xs text-muted-foreground">
                  Unlock the app with Face ID or your fingerprint after launching.
                </Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: "#E3E1E6", true: "#4F46E5" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="gap-5">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <Icon name="lock" size={16} color="#4F46E5" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold tracking-tight text-foreground">Password</Text>
              <Text className="text-xs text-muted-foreground">
                Set a new password for your account (min. 8 characters).
              </Text>
            </View>
          </View>

          <View className="gap-4">
            <Field>
              <FieldLabel>New password</FieldLabel>
              <Input value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" secureTextEntry />
            </Field>
            <Field>
              <FieldLabel>Confirm password</FieldLabel>
              <Input value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" secureTextEntry />
            </Field>
            <Button variant="outline" onPress={handlePasswordSubmit} loading={settingPassword} disabled={settingPassword}>
              Update Password
            </Button>
          </View>
        </CardContent>
      </Card>

      <Dialog
        visible={removeAvatarOpen}
        onClose={() => setRemoveAvatarOpen(false)}
        title="Remove avatar?"
        description="Your profile photo will be removed."
        footer={
          <>
            <Button variant="outline" onPress={() => setRemoveAvatarOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onPress={() => {
                setRemoveAvatarOpen(false);
                setRemovePending(true);
              }}
            >
              Remove
            </Button>
          </>
        }
      />
    </ScrollView>
  );
}
