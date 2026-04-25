import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaListener,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import "react-native-reanimated";
import { Toaster } from "sonner-native";
import { Uniwind } from "uniwind";
import { loadInitialThemePreference } from "@/hooks/use-theme-preference";

loadInitialThemePreference();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaListener
          onChange={({ insets }) => {
            Uniwind.updateInsets(insets);
          }}
        >
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="new-session"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="new-session-type"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="availability"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen name="suggestions" />
              <Stack.Screen name="profile" />
            </Stack>
            <StatusBar style="auto" />
            <Toaster position="top-center" offset={60} />
          </QueryClientProvider>
        </SafeAreaListener>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
