import { Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { Icon } from "@/components/icon";

type TabKey = "index" | "calendar" | "stats" | "settings";

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "index", label: "Home", icon: "house" },
  { key: "calendar", label: "Calendar", icon: "calendar" },
  { key: "stats", label: "Stats", icon: "chart-bar" },
  { key: "settings", label: "Settings", icon: "settings" },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => {
        const cardColor = useCSSVariable("--color-card") as string;
        const borderColor = useCSSVariable("--color-border") as string;
        return (
          <View
            className="flex-row pt-3 pb-safe-or-5 px-6 justify-between border-t"
            style={{ backgroundColor: cardColor, borderTopColor: borderColor }}
          >
            {TABS.map((tab, idx) => {
              const focused = state.index === idx;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => navigation.navigate(tab.key)}
                  className="items-center gap-1 active:opacity-70"
                  style={{ width: 60 }}
                >
                  <View
                    className="h-8 rounded-full items-center justify-center"
                    style={{
                      width: 52,
                      backgroundColor: focused ? "#1E3A5F" : "transparent",
                    }}
                  >
                    <Icon
                      name={tab.icon}
                      size={22}
                      color={focused ? "#FFFFFF" : "#9CA3AF"}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: focused ? "600" : "400",
                      color: focused ? "#1E3A5F" : "#9CA3AF",
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="stats" options={{ title: "Stats" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
