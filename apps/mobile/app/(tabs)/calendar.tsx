import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { toast } from "sonner-native";
import { Icon } from "@/components/icon";
import { ScreenHeader } from "@/components/screen-header";
import { SessionCard } from "@/components/session-card";
import { useSessions, useUpdateSession } from "@/hooks/use-api";
import {
  addDaysISO,
  dayNum,
  dayShortFromISO,
  formatDateLong,
  startOfWeekISO,
  todayISO,
} from "@/lib/time";

export default function Calendar() {
  const router = useRouter();
  const today = todayISO();
  const [selectedDate, setSelectedDate] = useState(today);
  const weekStart = startOfWeekISO(selectedDate);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)),
    [weekStart],
  );

  const sessionsQ = useSessions({
    startDate: weekStart,
    endDate: addDaysISO(weekStart, 6),
  });
  const updateSession = useUpdateSession();

  const monthLabel = new Date(selectedDate + "T00:00:00Z").toLocaleDateString(
    undefined,
    { month: "long", year: "numeric", timeZone: "UTC" },
  );

  const sessionsForSelected = useMemo(
    () => (sessionsQ.data ?? []).filter((s) => s.date === selectedDate),
    [sessionsQ.data, selectedDate],
  );

  function shiftWeek(direction: -1 | 1) {
    setSelectedDate((d) => addDaysISO(d, direction * 7));
  }

  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader
        title="Calendar"
        subtitle={monthLabel}
        rightAction={{ icon: "plus", onPress: () => router.push("/new-session") }}
      />

      <View className="flex-row items-center justify-between px-6 pb-1">
        <Pressable
          onPress={() => shiftWeek(-1)}
          hitSlop={12}
          className="h-8 w-8 rounded-full items-center justify-center active:opacity-60"
        >
          <Icon
            name="chevron-left"
            size={18}
            colorVar="--color-muted-foreground"
          />
        </Pressable>
        <Pressable
          onPress={() => setSelectedDate(today)}
          hitSlop={12}
          className="active:opacity-60"
        >
          <Text className="text-muted-foreground text-xs font-medium">
            Today
          </Text>
        </Pressable>
        <Pressable
          onPress={() => shiftWeek(1)}
          hitSlop={12}
          className="h-8 w-8 rounded-full items-center justify-center active:opacity-60"
        >
          <Icon
            name="chevron-right"
            size={18}
            colorVar="--color-muted-foreground"
          />
        </Pressable>
      </View>

      <View className="flex-row justify-between px-4 py-2">
        {weekDates.map((d) => {
          const isSelected = d === selectedDate;
          const isToday = d === today;
          return (
            <Pressable
              key={d}
              onPress={() => setSelectedDate(d)}
              className="rounded-xl items-center justify-center gap-0.5 active:opacity-70"
              style={{
                width: 44,
                height: 56,
                backgroundColor: isSelected ? "#1E3A5F" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isSelected ? "600" : "500",
                  color: isSelected
                    ? "#FFFFFF"
                    : isToday
                      ? "#1E3A5F"
                      : "#9CA3AF",
                }}
              >
                {dayShortFromISO(d)}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: isSelected ? "700" : "400",
                  color: isSelected
                    ? "#FFFFFF"
                    : isToday
                      ? "#1E3A5F"
                      : "#9CA3AF",
                }}
              >
                {dayNum(d)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="h-px bg-border" />

      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-4 pb-6">
        <Text className="text-muted-foreground text-xs font-semibold mb-2 tracking-wide">
          {selectedDate === today ? "TODAY · " : ""}
          {formatDateLong(selectedDate).toUpperCase()}
        </Text>

        {sessionsForSelected.length === 0 ? (
          <View className="bg-card border border-border rounded-2xl py-8 items-center">
            <View className="h-12 w-12 rounded-full bg-muted items-center justify-center mb-3">
              <Icon name="calendar" size={20} colorVar="--color-muted-foreground" />
            </View>
            <Text className="text-foreground text-sm font-medium">
              No sessions
            </Text>
            <Text className="text-muted-foreground text-xs mt-1">
              Tap + to schedule one
            </Text>
          </View>
        ) : (
          <View className="bg-card border border-border rounded-2xl px-4 py-1">
            {sessionsForSelected.map((s, i) => (
              <View
                key={s.id}
                className={i > 0 ? "border-t border-border" : ""}
              >
                <SessionCard
                  session={s}
                  onToggleStatus={() => {
                    const next =
                      s.status === "completed" ? "scheduled" : "completed";
                    updateSession.mutate(
                      { id: s.id, data: { status: next } },
                      {
                        onSuccess: () =>
                          toast.success(
                            next === "completed"
                              ? "Marked complete"
                              : "Marked scheduled",
                            { description: s.title },
                          ),
                      },
                    );
                  }}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/new-session",
            params: { date: selectedDate },
          })
        }
        className="absolute h-14 w-14 rounded-full bg-primary items-center justify-center active:opacity-80"
        style={{
          right: 24,
          bottom: 100,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Icon name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
