import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { toast } from "sonner-native";
import { Icon } from "@/components/icon";
import { ScreenHeader } from "@/components/screen-header";
import { SessionCard } from "@/components/session-card";
import { SuggestionCard } from "@/components/suggestion-card";
import {
  useProgress,
  useSessions,
  useSuggestions,
  useUpdateSession,
} from "@/hooks/use-api";
import { addDaysISO, formatDateLong, todayISO } from "@/lib/time";

export default function Dashboard() {
  const router = useRouter();
  const [scope, setScope] = useState<"today" | "week">("today");
  const today = todayISO();
  const endDate = scope === "today" ? today : addDaysISO(today, 6);

  const sessionsQ = useSessions({ startDate: today, endDate });
  const suggestionsQ = useSuggestions(2);
  const progressQ = useProgress();
  const updateSession = useUpdateSession();

  const sessions = sessionsQ.data ?? [];
  const completed = sessions.filter((s) => s.status === "completed").length;
  const progress = progressQ.data;

  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader
        title="Dashboard"
        rightAction={{ icon: "bell", onPress: () => {} }}
      />

      <ScrollView contentContainerClassName="pb-6" className="flex-1">
        <View className="flex-row items-center justify-between px-6 pb-3">
          <View className="flex-1">
            <Text className="text-foreground text-base font-medium">
              {formatDateLong(today)}
            </Text>
            <Text className="text-muted-foreground text-xs">
              Your schedule {scope}
            </Text>
          </View>
          <View className="flex-row bg-muted rounded-full p-1">
            <Pressable
              onPress={() => setScope("today")}
              className={
                scope === "today"
                  ? "bg-primary px-4 py-1.5 rounded-full"
                  : "px-4 py-1.5"
              }
            >
              <Text
                className={
                  scope === "today"
                    ? "text-white text-xs font-semibold"
                    : "text-muted-foreground text-xs"
                }
              >
                Today
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setScope("week")}
              className={
                scope === "week"
                  ? "bg-primary px-4 py-1.5 rounded-full"
                  : "px-4 py-1.5"
              }
            >
              <Text
                className={
                  scope === "week"
                    ? "text-white text-xs font-semibold"
                    : "text-muted-foreground text-xs"
                }
              >
                Week
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mx-6 mb-5 bg-card border border-border rounded-2xl px-4 py-3 flex-row items-center gap-2">
          <Text className="text-foreground text-sm font-medium">
            {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
          </Text>
          <Text className="text-muted-foreground text-sm">·</Text>
          <Icon name="check" size={14} colorVar="--color-success" />
          <Text className="text-foreground text-sm">{completed} done</Text>
        </View>

        {(suggestionsQ.data?.length ?? 0) > 0 && (
          <View className="mb-5">
            <Pressable
              onPress={() => router.push("/suggestions")}
              className="flex-row items-center justify-between px-6 mb-2 active:opacity-70"
            >
              <Text className="text-foreground text-base font-semibold">
                Smart Suggestions
              </Text>
              <Icon
                name="chevron-right"
                size={16}
                colorVar="--color-muted-foreground"
              />
            </Pressable>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-6 gap-3"
            >
              {suggestionsQ.data!.map((s, i) => (
                <View key={i} style={{ width: 280 }}>
                  <SuggestionCard suggestion={s} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="px-6 mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-foreground text-base font-semibold">
              {scope === "today" ? "Today's Sessions" : "This Week"}
            </Text>
            <Pressable
              onPress={() => router.push("/new-session")}
              hitSlop={12}
              className="h-7 w-7 rounded-full bg-primary items-center justify-center"
            >
              <Icon name="plus" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
          <View className="bg-card border border-border rounded-2xl px-4 py-1">
            {sessions.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-muted-foreground text-sm">
                  No sessions scheduled
                </Text>
              </View>
            ) : (
              sessions.map((s, i) => (
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
              ))
            )}
          </View>
        </View>

        {progress && (
          <View className="px-6 mb-2">
            <View className="bg-info-bg rounded-2xl p-4">
              <Text className="text-info text-xs font-semibold mb-3">
                Your Progress
              </Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-info text-2xl font-semibold">
                    {progress.totalScheduled}
                  </Text>
                  <Text className="text-info text-xs">Scheduled</Text>
                </View>
                <View>
                  <Text className="text-info text-2xl font-semibold">
                    {progress.totalCompleted}
                  </Text>
                  <Text className="text-info text-xs">Completed</Text>
                </View>
                <View>
                  <Text className="text-info text-2xl font-semibold">
                    {Math.round(progress.completionRate * 100)}%
                  </Text>
                  <Text className="text-info text-xs">Rate</Text>
                </View>
              </View>
              {progress.avgSpacingDays !== null && (
                <Text className="text-info text-xs mt-3">
                  Avg spacing {progress.avgSpacingDays} days · {progress.currentStreakDays}-day streak
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
