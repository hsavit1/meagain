import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Icon } from "@/components/icon";
import { ScreenHeader } from "@/components/screen-header";
import { useAvailability, useSessionTypes } from "@/hooks/use-api";
import { dayShort } from "@/lib/time";

export default function Settings() {
  const router = useRouter();
  const typesQ = useSessionTypes();
  const availQ = useAvailability();

  const enabledDays = (availQ.data ?? [])
    .filter((a) => a.enabled)
    .map((a) => dayShort(a.dayOfWeek))
    .join(", ");

  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Settings" />

      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        <View className="flex-row items-center justify-between px-6 pb-2">
          <Text className="text-muted-foreground text-xs font-semibold tracking-wide">
            ACTIVITY TYPES
          </Text>
          <Pressable
            onPress={() => router.push("/new-session-type")}
            className="bg-primary rounded-full h-7 px-3 flex-row items-center gap-1 active:opacity-80"
          >
            <Icon name="plus" size={12} color="#FFFFFF" />
            <Text className="text-white text-xs font-medium">New Type</Text>
          </Pressable>
        </View>

        <View className="px-4 gap-1.5 pb-6">
          {(typesQ.data ?? []).map((t) => (
            <Pressable
              key={t.id}
              onPress={() =>
                router.push({ pathname: "/new-session-type", params: { id: t.id } })
              }
              className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center gap-3 active:opacity-70"
            >
              <View
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              <View className="flex-1">
                <Text className="text-foreground text-base font-medium">
                  {t.name}
                </Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  {t.category} · Priority {t.priority}
                </Text>
              </View>
              <View className="bg-muted rounded-full px-2 py-0.5">
                <Text className="text-muted-foreground text-xs">
                  {t.completedCount + t.scheduledCount} logged
                </Text>
              </View>
            </Pressable>
          ))}
          {typesQ.isSuccess && typesQ.data.length === 0 && (
            <Text className="text-muted-foreground text-sm text-center py-6">
              No activity types yet — tap "New Type" to add one
            </Text>
          )}
        </View>

        <Text className="px-6 text-muted-foreground text-xs font-semibold tracking-wide pb-2">
          AVAILABILITY
        </Text>
        <Pressable
          onPress={() => router.push("/availability")}
          className="bg-card border-y border-border px-6 py-4 flex-row items-center gap-3 active:opacity-70"
        >
          <View className="h-9 w-9 rounded-xl bg-suggestion items-center justify-center">
            <Icon
              name="timer"
              size={18}
              colorVar="--color-suggestion-secondary"
            />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-base font-medium">
              Weekly Availability
            </Text>
            <Text className="text-muted-foreground text-xs mt-0.5">
              {enabledDays || "No days enabled"}
            </Text>
          </View>
          <Icon
            name="chevron-right"
            size={18}
            colorVar="--color-muted-foreground"
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}
