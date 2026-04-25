import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ScreenHeader } from "@/components/screen-header";
import { useProgress } from "@/hooks/use-api";
import { addDaysISO, todayISO } from "@/lib/time";

type Period = "week" | "month" | "all";

export default function Stats() {
  const [period, setPeriod] = useState<Period>("week");
  const today = todayISO();
  const since =
    period === "week"
      ? addDaysISO(today, -7)
      : period === "month"
        ? addDaysISO(today, -30)
        : undefined;

  const { data: progress } = useProgress(since);

  const periods: { key: Period; label: string }[] = [
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "all", label: "All Time" },
  ];

  const maxCount =
    progress?.byType.reduce((m, t) => Math.max(m, t.total), 0) ?? 1;

  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Stats" />

      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        <View className="flex-row gap-2 px-6 pb-4">
          {periods.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              className="h-8 px-4 rounded-full items-center justify-center"
              style={{
                backgroundColor: period === p.key ? "#1E3A5F" : "transparent",
                borderWidth: period === p.key ? 0 : 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: period === p.key ? "600" : "400",
                  color: period === p.key ? "#FFFFFF" : "#9CA3AF",
                }}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row gap-3 px-6 pb-3">
          <StatCard
            value={progress?.totalScheduled ?? 0}
            label="Scheduled"
          />
          <StatCard
            value={progress?.totalCompleted ?? 0}
            label="Completed"
          />
          <StatCard
            value={`${Math.round((progress?.completionRate ?? 0) * 100)}%`}
            label="Rate"
          />
        </View>

        <View className="flex-row gap-3 px-6 pb-4">
          <View className="flex-1 bg-info-bg rounded-xl p-3">
            <Text className="text-info text-xl font-semibold">
              {progress?.avgSpacingDays ?? 0} days
            </Text>
            <Text className="text-info text-xs">Avg spacing</Text>
          </View>
          <View className="flex-1 bg-success-bg rounded-xl p-3">
            <Text className="text-success text-xl font-semibold">
              {progress?.currentStreakDays ?? 0} days
            </Text>
            <Text className="text-success text-xs">Current streak</Text>
          </View>
        </View>

        <Text className="px-6 text-foreground text-sm font-semibold pb-2">
          By Session Type
        </Text>
        <View className="px-6 gap-3">
          {(progress?.byType ?? []).map((t) => (
            <View
              key={t.typeId}
              className="bg-card border border-border rounded-xl p-4 gap-2"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <Text className="text-foreground text-sm font-medium">
                    {t.name}
                  </Text>
                </View>
                <Text className="text-muted-foreground text-xs">
                  {t.completed} done
                </Text>
              </View>
              <View className="bg-border rounded-full h-1.5 overflow-hidden">
                <View
                  className="h-1.5 rounded-full"
                  style={{
                    backgroundColor: t.color,
                    width: `${(t.total / maxCount) * 100}%`,
                  }}
                />
              </View>
            </View>
          ))}
          {(progress?.byType.length ?? 0) === 0 && (
            <Text className="text-muted-foreground text-sm py-4 text-center">
              No data yet
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <View className="flex-1 bg-card border border-border rounded-xl p-3">
      <Text className="text-foreground text-2xl font-semibold">{value}</Text>
      <Text className="text-muted-foreground text-xs">{label}</Text>
    </View>
  );
}
