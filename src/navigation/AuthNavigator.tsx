import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import UpdatePasswordScreen from "../screens/auth/UpdatePasswordScreen";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  UpdatePassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator({
  onSignedIn,
  initialRoute = "Login",
  onForcedUpdateDone,
}: {
  onSignedIn: () => void;
  initialRoute?: keyof AuthStackParamList;
  onForcedUpdateDone?: () => void;
}) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen
            onSignedIn={onSignedIn}
            onNavigate={(screen) => {
              if (screen === "signup") props.navigation.navigate("Signup");
              else props.navigation.navigate("ForgotPassword");
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Signup">
        {(props) => (
          <SignupScreen
            onSignedIn={onSignedIn}
            onNavigate={() => props.navigation.navigate("Login")}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword">
        {(props) => (
          <ForgotPasswordScreen onNavigate={() => props.navigation.navigate("Login")} />
        )}
      </Stack.Screen>
      <Stack.Screen name="UpdatePassword">
        {(props) => (
          <UpdatePasswordScreen
            onSignedOut={() => props.navigation.navigate("Login")}
            onDone={() => onForcedUpdateDone?.()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
