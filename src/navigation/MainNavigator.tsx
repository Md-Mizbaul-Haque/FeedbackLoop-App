import React from "react";
import { Text } from "react-native";
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
  type BottomTabNavigationProp,
} from "@react-navigation/bottom-tabs";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { markIntentionalSignOut } from "../lib/auth-events";
import HomeScreen from "../screens/app/HomeScreen";
import SummariesScreen from "../screens/app/SummariesScreen";
import ResultsScreen from "../screens/app/ResultsScreen";
import PricingScreen from "../screens/app/PricingScreen";
import ProfileScreen from "../screens/app/ProfileScreen";
import SettingsScreen from "../screens/app/SettingsScreen";

export type MainStackParamList = {
  Tabs: { screen?: keyof TabParamList } | undefined;
  Results: { summaryId?: string } | undefined;
};

export type TabParamList = {
  Home: undefined;
  Summaries: undefined;
  Pricing: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Home: "view-dashboard-outline",
  Summaries: "file-document-outline",
  Pricing: "credit-card-outline",
  Profile: "account-outline",
  Settings: "cog-outline",
};

const TAB_LABELS: Record<string, string> = {
  Home: "Home",
  Summaries: "Summaries",
  Pricing: "Pricing",
  Profile: "Profile",
  Settings: "Settings",
};

type TabsNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Home">,
  NativeStackNavigationProp<MainStackParamList>
>;

function Tabs({ initialTab }: { initialTab?: string }) {
  const navigation = useNavigation<TabsNavigation>();

  const openResults = () => navigation.navigate("Results");
  const openPricing = () => navigation.navigate("Pricing");
  const openHome = () => navigation.navigate("Home");
  const openResultsId = (summaryId: string) => navigation.navigate("Results", { summaryId });
  const signOut = () => {
    markIntentionalSignOut();
    void supabase.auth.signOut();
  };

  return (
    <Tab.Navigator
      initialRouteName={(initialTab as keyof TabParamList) ?? "Home"}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#A1A1AA",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={TAB_ICONS[route.name] ?? "view-dashboard-outline"}
            size={size}
            color={color}
          />
        ),
        tabBarLabel: ({ color }) => (
          <Text style={{ color, fontSize: 11, fontWeight: "500" }}>
            {TAB_LABELS[route.name] ?? route.name}
          </Text>
        ),
        tabBarStyle: { borderTopColor: "#E3E1E6", backgroundColor: "#FFFFFF" },
      })}
    >
      <Tab.Screen name="Home">
        {() => <HomeScreen onOpenResults={openResults} onOpenPricing={openPricing} />}
      </Tab.Screen>
      <Tab.Screen name="Summaries">
        {() => <SummariesScreen onView={openResultsId} onCreate={openHome} />}
      </Tab.Screen>
      <Tab.Screen name="Pricing">
        {() => <PricingScreen onRequireSignIn={signOut} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {() => <ProfileScreen onOpenPricing={openPricing} />}
      </Tab.Screen>
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onSignedOut={signOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function MainNavigator({ initialTab }: { initialTab?: string }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs">
        {(props) => (
          <Tabs
            initialTab={props.route.params?.screen ?? initialTab}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Results"
        options={{
          headerShown: true,
          title: "Results",
          headerBackTitle: "Back",
          headerTintColor: "#4F46E5",
          headerTitleStyle: { color: "#09090B" },
          headerStyle: { backgroundColor: "#FAFAFA" },
          contentStyle: { backgroundColor: "#FAFAFA" },
        }}
      >
        {(props) => (
          <ResultsScreen
            summaryId={props.route.params?.summaryId}
            onCreateAnother={() =>
              props.navigation.navigate("Tabs", { screen: "Home" })
            }
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
