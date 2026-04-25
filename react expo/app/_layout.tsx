import {
  useFonts,
  PixelifySans_400Regular,
  PixelifySans_500Medium,
  PixelifySans_600SemiBold,
  PixelifySans_700Bold,
} from "@expo-google-fonts/pixelify-sans";
import { VT323_400Regular } from "@expo-google-fonts/vt323";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset } from "expo-asset";
import { Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import OnboardingView from "../src/Onboarding";

export default function RootLayout() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const pathname = usePathname();

  const [fontsLoaded] = useFonts({
    PixelifySans_400Regular,
    PixelifySans_500Medium,
    PixelifySans_600SemiBold,
    PixelifySans_700Bold,
    VT323_400Regular,
  });

  useEffect(() => {
    AsyncStorage.getItem("onboarded").then((val) =>
      setOnboarded(val === "true"),
    );
  }, [pathname]);

  useEffect(() => {
    // Warm image cache so logout -> onboarding feels instant.
    void Asset.fromModule(
      require("../assets/login_screen_ref.png"),
    ).downloadAsync();
    void Asset.fromModule(require("../assets/icon_apple.png")).downloadAsync();
    void Asset.fromModule(require("../assets/icon_google.png")).downloadAsync();
  }, []);

  if (!fontsLoaded || onboarded === null)
    return <View style={{ flex: 1, backgroundColor: "#EAE4DA" }} />;

  if (!onboarded) {
    return (
      <OnboardingView
        onDone={async () => {
          await AsyncStorage.setItem("onboarded", "true");
          setOnboarded(true);
        }}
      />
    );
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="map" />
      <Stack.Screen name="island" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
