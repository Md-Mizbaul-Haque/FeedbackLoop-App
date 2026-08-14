import React, { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useToast } from "../../components/ui/toast";
import { Button } from "../../components/ui/Button";
import { LogoMark } from "../../components/LogoMark";
import { authenticateWithBiometrics, setBiometricsEnabled } from "../../lib/biometrics";

export default function BiometricLockScreen({
  onUnlocked,
  onSignOut,
}: {
  onUnlocked: () => void;
  onSignOut: () => void;
}) {
  const { error } = useToast();
  const [unlocking, setUnlocking] = useState(false);

  const unlock = useCallback(async () => {
    if (unlocking) return;
    setUnlocking(true);
    const ok = await authenticateWithBiometrics();
    setUnlocking(false);
    if (ok) {
      onUnlocked();
    } else {
      error("Authentication failed. Try again or sign out.");
    }
  }, [unlocking, onUnlocked, error]);

  useEffect(() => {
    void unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await setBiometricsEnabled(false);
    onSignOut();
  };

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <LogoMark size={56} />
      <Text className="mt-5 text-xl font-bold tracking-tight text-foreground">
        Welcome back
      </Text>
      <Text className="mt-1 text-center text-sm text-muted-foreground">
        Unlock FeedbackLoop with Face ID or your fingerprint to continue.
      </Text>
      <View className="mt-8 w-full max-w-sm gap-3">
        <Button size="lg" onPress={unlock} loading={unlocking} icon="lock">
          Unlock
        </Button>
        <Pressable onPress={handleSignOut} className="items-center py-2">
          <Text className="text-sm font-medium text-muted-foreground">Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
