import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useAvailability, useSetAvailability } from "@/hooks/use-api";
import { dayShort, formatTime12h } from "@/lib/time";
import type { Availability } from "@/lib/types";

const DEFAULT_DAYS: Omit<Availability, "id">[] = Array.from(
  { length: 7 },
  (_, i) => ({
    dayOfWeek: i,
    startTime: "09:00",
    endTime: "17:00",
    enabled: false,
  }),
);

export default function AvailabilityEditor() {
  const router = useRouter();
  const { data } = useAvailability();
  const setAvail = useSetAvailability();

  const [windows, setWindows] =
    useState<Omit<Availability, "id">[]>(DEFAULT_DAYS);
  const [picker, setPicker] = useState<{
    day: number;
    field: "startTime" | "endTime";
  } | null>(null);

  useEffect(() => {
    if (data) {
      setWindows(
        data
          .slice()
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
          .map(({ id: _id, ...rest }) => rest),
      );
    }
  }, [data]);

  function update(day: number, patch: Partial<Omit<Availability, "id">>) {
    setWindows((prev) =>
      prev.map((w) => (w.dayOfWeek === day ? { ...w, ...patch } : w)),
    );
  }

  function handleSave() {
    for (const w of windows) {
      if (w.enabled && w.startTime >= w.endTime) {
        Alert.alert(
          "Invalid window",
          `${dayShort(w.dayOfWeek)}: start time must be before end time.`,
        );
        return;
      }
    }
    setAvail.mutate(windows, {
      onSuccess: () => router.back(),
      onError: (err) => Alert.alert("Could not save", err.message),
    });
  }

  return (
    <View className="flex-1 bg-background">
      <View className="items-center pt-3">
        <View className="bg-border rounded-full" style={{ width: 36, height: 4 }} />
      </View>
      <View className="flex-row items-center justify-between px-6 py-3">
        <Text className="text-foreground text-2xl font-medium">Availability</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-muted-foreground text-base">Cancel</Text>
        </Pressable>
      </View>
      <Text className="px-6 text-muted-foreground text-sm pb-2">
        Set your weekly recurring time windows
      </Text>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-2 pb-32 gap-1.5">
        {windows.map((w) => (
          <View
            key={w.dayOfWeek}
            className="bg-card border border-border rounded-xl px-4 h-14 flex-row items-center gap-3"
          >
            <Text
              className="text-foreground text-base font-medium"
              style={{ width: 36 }}
            >
              {dayShort(w.dayOfWeek)}
            </Text>
            <Switch
              value={w.enabled}
              onValueChange={(enabled) => update(w.dayOfWeek, { enabled })}
              trackColorOnClassName="accent-primary"
              trackColorOffClassName="accent-border"
              thumbColorClassName="accent-white"
            />
            {w.enabled ? (
              <View className="flex-row gap-2 ml-auto items-center">
                <Pressable
                  onPress={() => setPicker({ day: w.dayOfWeek, field: "startTime" })}
                  className="bg-muted rounded-lg h-8 px-2.5 items-center justify-center"
                >
                  <Text className="text-foreground text-xs">
                    {formatTime12h(w.startTime)}
                  </Text>
                </Pressable>
                <Text className="text-muted-foreground">–</Text>
                <Pressable
                  onPress={() => setPicker({ day: w.dayOfWeek, field: "endTime" })}
                  className="bg-muted rounded-lg h-8 px-2.5 items-center justify-center"
                >
                  <Text className="text-foreground text-xs">
                    {formatTime12h(w.endTime)}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text className="text-muted-foreground text-sm ml-auto">Off</Text>
            )}
          </View>
        ))}
      </ScrollView>

      {picker && (
        <DateTimePicker
          value={(() => {
            const w = windows.find((x) => x.dayOfWeek === picker.day)!;
            const time = w[picker.field];
            const [h, m] = time.split(":").map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
          })()}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => {
            if (Platform.OS !== "ios") setPicker(null);
            if (d) {
              const hh = String(d.getHours()).padStart(2, "0");
              const mm = String(d.getMinutes()).padStart(2, "0");
              update(picker.day, { [picker.field]: `${hh}:${mm}` });
            }
          }}
        />
      )}
      {picker && Platform.OS === "ios" && (
        <Pressable
          onPress={() => setPicker(null)}
          className="absolute bottom-24 self-center bg-card border border-border rounded-full px-6 py-2"
        >
          <Text className="text-foreground text-sm font-medium">Done</Text>
        </Pressable>
      )}

      <View className="absolute bottom-0 left-0 right-0 px-6 pb-safe-or-6 pt-3 bg-background">
        <Pressable
          onPress={handleSave}
          disabled={setAvail.isPending}
          className="bg-primary rounded-2xl items-center justify-center active:opacity-90"
          style={{ height: 52 }}
        >
          <Text className="text-white text-base font-semibold">
            {setAvail.isPending ? "Saving..." : "Save Availability"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
