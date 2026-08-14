import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogoMark } from "../../components/LogoMark";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-between px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center gap-2.5">
            <LogoMark size={36} />
            <Text className="text-xl font-bold tracking-tight text-foreground">
              FeedbackLoop
            </Text>
          </View>

          <View className="my-8 w-full max-w-md self-center">{children}</View>

          <Text className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} FeedbackLoop Inc. All rights reserved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
