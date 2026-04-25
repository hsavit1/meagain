import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { toast } from "sonner-native";
import { Icon } from "@/components/icon";
import { useAvailability, useSetAvailability } from "@/hooks/use-api";
import { dayShort, formatTime12h } from "@/lib/time";
import type { Availability } from "@/lib/types";

function DayToggle({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      className={value ? "bg-primary" : "bg-border"}
      style={{
        width: 46,
        height: 28,
        borderRadius: 14,
        padding: 2,
        justifyContent: "center",
        alignItems: value ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      />
    </Pressable>
  );
}

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
        toast.error("Invalid window", {
          description: `${dayShort(w.dayOfWeek)}: start time must be before end time.`,
        });
        return;
      }
    }
    setAvail.mutate(windows, {
      onSuccess: () => {
        toast.success("Availability saved");
        router.back();
      },
      onError: (err) =>
        toast.error("Could not save", { description: err.message }),
    });
  }

  return (
    <View className="flex-1 bg-background">
      <View className="items-center pt-3">
        <View className="bg-border rounded-full" style={{ width: 36, height: 4 }} />
      </View>
      <View className="flex-row items-center justify-between px-6 py-3">
        <Text className="text-foreground text-2xl font-medium">
          Weekly Hours
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-muted-foreground text-base">Cancel</Text>
        </Pressable>
      </View>

      <View className="mx-4 mb-2 flex-row items-start gap-2.5 rounded-xl bg-suggestion px-4 py-3">
        <View className="pt-0.5">
          <Icon name="lightbulb" size={16} colorVar="--color-suggestion-accent" />
        </View>
        <Text className="text-suggestion-foreground text-sm flex-1 leading-5">
          Smart Suggestions place new sessions inside these hours. You can
          still log a session anytime.
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-2 pb-32 gap-1.5">
        {windows.map((w) => {
          const isAllDay = w.startTime === "00:00" && w.endTime === "23:59";
          return (
            <View
              key={w.dayOfWeek}
              className="bg-card border border-border rounded-xl px-4 h-14 flex-row items-center"
            >
              <Text
                className="text-foreground text-base font-medium"
                style={{ width: 44 }}
              >
                {dayShort(w.dayOfWeek)}
              </Text>
              {w.enabled ? (
                isAllDay ? (
                  <View className="flex-row gap-2 flex-1 items-center">
                    <View className="bg-muted rounded-lg h-8 px-3 items-center justify-center">
                      <Text className="text-foreground text-xs font-medium">
                        All day
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        update(w.dayOfWeek, {
                          startTime: "09:00",
                          endTime: "17:00",
                        })
                      }
                      hitSlop={6}
                      className="active:opacity-60"
                    >
                      <Text className="text-muted-foreground text-xs underline">
                        Custom
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View className="flex-row gap-1.5 flex-1 items-center">
                    <Pressable
                      onPress={() =>
                        setPicker({ day: w.dayOfWeek, field: "startTime" })
                      }
                      className="bg-muted rounded-lg h-8 px-2.5 items-center justify-center"
                    >
                      <Text className="text-foreground text-xs">
                        {formatTime12h(w.startTime)}
                      </Text>
                    </Pressable>
                    <Text className="text-muted-foreground">–</Text>
                    <Pressable
                      onPress={() =>
                        setPicker({ day: w.dayOfWeek, field: "endTime" })
                      }
                      className="bg-muted rounded-lg h-8 px-2.5 items-center justify-center"
                    >
                      <Text className="text-foreground text-xs">
                        {formatTime12h(w.endTime)}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        update(w.dayOfWeek, {
                          startTime: "00:00",
                          endTime: "23:59",
                        })
                      }
                      hitSlop={6}
                      className="ml-1 active:opacity-60"
                    >
                      <Text className="text-muted-foreground text-xs underline">
                        24h
                      </Text>
                    </Pressable>
                  </View>
                )
              ) : (
                <Text className="text-muted-foreground text-sm flex-1">
                  Unavailable
                </Text>
              )}
              <DayToggle
                value={w.enabled}
                onValueChange={(enabled) => update(w.dayOfWeek, { enabled })}
              />
            </View>
          );
        })}
      </ScrollView>

      {Platform.OS === "ios" ? (
        <Modal
          transparent
          animationType="slide"
          visible={!!picker}
          onRequestClose={() => setPicker(null)}
        >
          {picker && (
            <View
              className="flex-1 justify-end"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
              <Pressable
                onPress={() => setPicker(null)}
                className="flex-1"
              />
              <View className="bg-card pb-safe-or-4">
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
                  <Text className="text-muted-foreground text-sm">
                    {picker.field === "startTime" ? "Start time" : "End time"}
                  </Text>
                  <Pressable onPress={() => setPicker(null)} hitSlop={12}>
                    <Text className="text-primary text-base font-semibold">
                      Done
                    </Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={(() => {
                    const w = windows.find(
                      (x) => x.dayOfWeek === picker.day,
                    )!;
                    const time = w[picker.field];
                    const [h, m] = time.split(":").map(Number);
                    const d = new Date();
                    d.setHours(h, m, 0, 0);
                    return d;
                  })()}
                  mode="time"
                  display="spinner"
                  onChange={(_, d) => {
                    if (d) {
                      const hh = String(d.getHours()).padStart(2, "0");
                      const mm = String(d.getMinutes()).padStart(2, "0");
                      update(picker.day, {
                        [picker.field]: `${hh}:${mm}`,
                      });
                    }
                  }}
                />
              </View>
            </View>
          )}
        </Modal>
      ) : (
        picker && (
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
            display="default"
            onChange={(_, d) => {
              setPicker(null);
              if (d) {
                const hh = String(d.getHours()).padStart(2, "0");
                const mm = String(d.getMinutes()).padStart(2, "0");
                update(picker.day, { [picker.field]: `${hh}:${mm}` });
              }
            }}
          />
        )
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
