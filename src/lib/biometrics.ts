import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

export const BIOMETRICS_KEY = "feedbackloop-biometrics-enabled";

export async function isBiometricsEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(BIOMETRICS_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await AsyncStorage.setItem(BIOMETRICS_KEY, "true");
    } else {
      await AsyncStorage.removeItem(BIOMETRICS_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export async function canUseBiometrics(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hardware && enrolled;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock FeedbackLoop",
      cancelLabel: "Sign out",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
