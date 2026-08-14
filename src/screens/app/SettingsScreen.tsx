import React, { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { markIntentionalSignOut } from "../../lib/auth-events";
import {
  DEFAULT_SETTINGS,
  fetchUserSettings,
  saveUserSettings,
  type UserSettings,
} from "../../lib/settings";
import { userQueryKey } from "../../lib/queries";
import { useToast } from "../../components/ui/toast";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Icon } from "../../components/ui/Icon";

export default function SettingsScreen({ onSignedOut }: { onSignedOut: () => void }) {
  const queryClient = useQueryClient();
  const { success, error: errorToast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      fetchUserSettings(supabase, data.user).then((loaded) => {
        if (cancelled) return;
        setSettings(loaded);
        setSettingsLoaded(true);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await saveUserSettings(supabase, user, settings);
      if (error) errorToast(`Could not save settings: ${error}`);
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [settings, settingsLoaded, errorToast]);

  const update = (patch: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleDeleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);

    const { error } = await supabase.functions.invoke("delete-account", {
      method: "POST",
    });

    if (error) {
      setDeleting(false);
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        try {
          const body = (await ctx.json()) as { error?: string };
          if (body?.error) {
            errorToast(body.error);
            return;
          }
        } catch {
          // ignore malformed error bodies
        }
      }
      errorToast("Could not delete the account. Please try again.");
      return;
    }

    markIntentionalSignOut();
    await supabase.auth.signOut();
    queryClient.clear();
    setDeleting(false);
    setDeleteDialogOpen(false);
    success("Your account and data have been deleted.");
    onSignedOut();
  };

  return (
    <ScrollView contentContainerClassName="gap-6 pb-10">
      <View>
        <Text className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Settings</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Customize your workspace preferences.
        </Text>
      </View>

      <Card>
        <CardContent className="gap-6">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <Icon name="sliders" size={16} color="#4F46E5" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold tracking-tight text-foreground">Preferences</Text>
              <Text className="text-xs text-muted-foreground">
                Choose your default view. Saved to your account.
              </Text>
            </View>
          </View>

          <View className="max-w-sm gap-2">
            <Text className="text-sm font-medium text-foreground">Default view</Text>
            <Select
              value={settings.defaultView}
              onValueChange={(value) => update({ defaultView: value as UserSettings["defaultView"] })}
              options={[
                { value: "dashboard", label: "Dashboard" },
                { value: "summaries", label: "My Summaries" },
              ]}
            />
            <Text className="text-xs text-muted-foreground">Where you land after signing in.</Text>
          </View>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="gap-6">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
              <Icon name="alert-triangle" size={16} color="#E5484D" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold tracking-tight text-foreground">Danger Zone</Text>
              <Text className="text-xs text-muted-foreground">Actions that affect your account.</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-destructive">Delete account</Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                Permanently remove your account, summaries, and all data.
              </Text>
            </View>
            <Button variant="destructive" icon="trash" iconColor="#FFFFFF" onPress={() => setDeleteDialogOpen(true)}>
              Delete account
            </Button>
          </View>
        </CardContent>
      </Card>

      <Dialog
        visible={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete your account?"
        description="This permanently removes your account, all summaries, and preferences. This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onPress={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onPress={handleDeleteAccount} disabled={deleting} loading={deleting}>
              {deleting ? "Deleting..." : "Delete my account"}
            </Button>
          </>
        }
      />
    </ScrollView>
  );
}
