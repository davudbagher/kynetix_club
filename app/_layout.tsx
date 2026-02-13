import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "react-native-reanimated";

import { auth } from "@/config/firebase";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Navigate based on auth state
  useEffect(() => {
    if (isLoading) return; // Don't navigate while loading

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";

    if (!user && !inAuthGroup) {
      // User not logged in, redirect to auth
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      // User logged in but on auth screen, redirect to tabs
      router.replace("/(tabs)");
    }
  }, [user, segments, isLoading]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.neonLime} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth Flow (not logged in) */}
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
            gestureEnabled: false, // Can't swipe back from auth
          }}
        />

        {/* Main App (logged in) */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            gestureEnabled: false, // Can't swipe back to auth after login
          }}
        />

        {/* Modal screens (accessible when logged in) */}
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Modal",
          }}
        />

        {/* Challenge Detail Modal */}
        <Stack.Screen
          name="challenge/[id]"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.darkGrey,
    justifyContent: "center",
    alignItems: "center",
  },
});
