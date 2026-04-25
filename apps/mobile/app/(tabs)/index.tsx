import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { toast } from "sonner-native";
import { ActionSheet } from "@/components/action-sheet";
import { Icon } from "@/components/icon";
import { NotificationsSheet } from "@/components/notifications-sheet";
import { ScreenHeader } from "@/components/screen-header";
import { SessionCard } from "@/components/session-card";
import { SuggestionCard } from "@/components/suggestion-card";
import {
  useCreateSession,
  useDeleteSession,
  useProgress,
  useSessions,
  useSuggestions,
  useUpdateSession,
} from "@/hooks/use-api";
import { ApiError } from "@/lib/api";
import type { Session, Suggestion } from "@/lib/types";
import {
  addDaysISO,
  diffDaysISO,
  formatDateLong,
  formatDateShort,
  startOfWeekISO,
  todayISO,
} from "@/lib/time";

function formatWeekRange(startISO: string, endISO: string): string {
  const s = new Date(`${startISO}T00:00:00Z`);
  const e = new Date(`${endISO}T00:00:00Z`);
  const sM = s.toLocaleDateString(undefined, {
    month: "short",
    timeZone: "UTC",
  });
  const eM = e.toLocaleDateString(undefined, {
    month: "short",
    timeZone: "UTC",
  });
  const sD = s.getUTCDate();
  const eD = e.getUTCDate();
  return sM === eM ? `${sM} ${sD} – ${eD}` : `${sM} ${sD} – ${eM} ${eD}`;
}

function relativeWeekLabel(offset: number): string {
  if (offset === 0) return "This week";
  if (offset === -1) return "Last week";
  if (offset === 1) return "Next week";
  if (offset < 0) return `${-offset} weeks ago`;
  return `In ${offset} weeks`;
}

function relativeDayLabel(offset: number): string {
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  if (offset === 1) return "Tomorrow";
  if (offset < 0) return `${-offset} days ago`;
  return `In ${offset} days`;
}

export default function Dashboard() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const [scope, setScopeState] = useState<"today" | "week">("today");
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const today = todayISO();

  useEffect(() => {
    if (!params.date) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) return;
    setScopeState("today");
    setDayOffset(diffDaysISO(params.date, today));
    router.setParams({ date: undefined });
  }, [params.date, today, router]);
  const currentWeekStart = startOfWeekISO(today);
  const weekStart = addDaysISO(currentWeekStart, weekOffset * 7);
  const weekEnd = addDaysISO(weekStart, 6);
  const selectedDay = addDaysISO(today, dayOffset);

  const startDate = scope === "today" ? selectedDay : weekStart;
  const endDate = scope === "today" ? selectedDay : weekEnd;

  function setScope(next: "today" | "week") {
    if (next === "today") setDayOffset(0);
    if (next === "week") setWeekOffset(0);
    setScopeState(next);
  }

  const sessionsQ = useSessions({ startDate, endDate });
  const suggestionsQ = useSuggestions(2);
  const progressQ = useProgress({ since: startDate, until: endDate });
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();
  const createSession = useCreateSession();
  const [actionTarget, setActionTarget] = useState<Session | null>(null);
  const [suggestionTarget, setSuggestionTarget] = useState<Suggestion | null>(
    null,
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshAll() {
    setRefreshing(true);
    try {
      await Promise.all([
        sessionsQ.refetch(),
        suggestionsQ.refetch(),
        progressQ.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  function adjustSuggestion(s: Suggestion) {
    router.push({
      pathname: "/new-session",
      params: {
        typeId: s.sessionTypeId,
        date: s.date,
        startTime: s.startTime,
        duration: String(s.duration),
      },
    });
  }

  function acceptSuggestion(s: Suggestion) {
    createSession.mutate(
      {
        sessionTypeId: s.sessionTypeId,
        title: s.sessionType.name,
        date: s.date,
        startTime: s.startTime,
        duration: s.duration,
      },
      {
        onSuccess: () => {
          toast.success("Activity scheduled", {
            description: `${s.sessionType.name} on ${s.date} at ${s.startTime}`,
            onPress: () =>
              router.navigate({ pathname: "/", params: { date: s.date } }),
          });
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            toast.error("Time conflict", {
              description: "Open Adjust to pick a different time.",
            });
            adjustSuggestion(s);
          } else {
            toast.error("Could not save", { description: err.message });
          }
        },
      },
    );
  }

  const sessions = sessionsQ.data ?? [];
  const completed = sessions.filter((s) => s.status === "completed").length;
  const progress = progressQ.data;

  const sessionsByDay =
    scope === "week"
      ? sessions.reduce<{ date: string; items: typeof sessions }[]>(
          (acc, s) => {
            const last = acc[acc.length - 1];
            if (last && last.date === s.date) last.items.push(s);
            else acc.push({ date: s.date, items: [s] });
            return acc;
          },
          [],
        )
      : null;

  function toggleSession(s: (typeof sessions)[number]) {
    const next = s.status === "completed" ? "scheduled" : "completed";
    updateSession.mutate(
      { id: s.id, data: { status: next } },
      {
        onSuccess: () => {
          if (next === "completed") {
            toast.success("Marked complete", { description: s.title });
          } else {
            toast("Reverted to scheduled", { description: s.title });
          }
        },
      },
    );
  }

  function setStatus(s: Session, status: Session["status"], label: string) {
    updateSession.mutate(
      { id: s.id, data: { status } },
      { onSuccess: () => toast(label, { description: s.title }) },
    );
  }

  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader
        title="Dashboard"
        rightAction={{
          icon: "bell",
          onPress: () => setNotificationsOpen(true),
        }}
      />

      <ScrollView
        contentContainerClassName="pb-6"
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
        }
      >
        <View className="flex-row items-center justify-between px-6 pb-3">
          <View className="flex-1 pr-3">
            {scope === "today" ? (
              <>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => setDayOffset((o) => o - 1)}
                    hitSlop={12}
                    className="active:opacity-60"
                  >
                    <Icon
                      name="chevron-left"
                      size={16}
                      colorVar="--color-muted-foreground"
                    />
                  </Pressable>
                  <Text className="text-foreground text-base font-medium">
                    {formatDateLong(selectedDay)}
                  </Text>
                  <Pressable
                    onPress={() => setDayOffset((o) => o + 1)}
                    hitSlop={12}
                    className="active:opacity-60"
                  >
                    <Icon
                      name="chevron-right"
                      size={16}
                      colorVar="--color-muted-foreground"
                    />
                  </Pressable>
                </View>
                <Text className="text-muted-foreground text-xs">
                  {relativeDayLabel(dayOffset)}
                </Text>
              </>
            ) : (
              <>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => setWeekOffset((o) => o - 1)}
                    hitSlop={12}
                    className="active:opacity-60"
                  >
                    <Icon
                      name="chevron-left"
                      size={16}
                      colorVar="--color-muted-foreground"
                    />
                  </Pressable>
                  <Text className="text-foreground text-base font-medium">
                    {formatWeekRange(weekStart, weekEnd)}
                  </Text>
                  <Pressable
                    onPress={() => setWeekOffset((o) => o + 1)}
                    hitSlop={12}
                    className="active:opacity-60"
                  >
                    <Icon
                      name="chevron-right"
                      size={16}
                      colorVar="--color-muted-foreground"
                    />
                  </Pressable>
                </View>
                <Text className="text-muted-foreground text-xs">
                  {relativeWeekLabel(weekOffset)}
                </Text>
              </>
            )}
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
            {sessions.length} {sessions.length === 1 ? "activity" : "activities"}
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
                <Pressable
                  key={i}
                  onPress={() => adjustSuggestion(s)}
                  onLongPress={() => setSuggestionTarget(s)}
                  delayLongPress={250}
                  style={{ width: 280 }}
                  className="active:opacity-80"
                >
                  <SuggestionCard suggestion={s} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="px-6 mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-foreground text-base font-semibold">
              {scope === "today"
                ? dayOffset === 0
                  ? "Today's Activities"
                  : dayOffset === -1
                    ? "Yesterday's Activities"
                    : dayOffset === 1
                      ? "Tomorrow's Activities"
                      : "Activities"
                : relativeWeekLabel(weekOffset)}
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/new-session",
                  params: scope === "today" ? { date: selectedDay } : undefined,
                })
              }
              hitSlop={12}
              className="h-7 w-7 rounded-full bg-primary items-center justify-center"
            >
              <Icon name="plus" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
          {sessions.length > 0 && (
            <Text className="text-muted-foreground text-xs mb-3">
              Tap an activity to mark it complete · tap + to add another
            </Text>
          )}
          {sessions.length === 0 ? (
            <View className="bg-card border border-border rounded-2xl px-4 py-6 items-center">
              <Text className="text-muted-foreground text-sm">
                No activities scheduled
              </Text>
            </View>
          ) : sessionsByDay ? (
            <View className="gap-4">
              {sessionsByDay.map((group) => (
                <View key={group.date}>
                  <Text className="text-muted-foreground text-xs font-semibold mb-2 tracking-wide">
                    {group.date === today ? "TODAY · " : ""}
                    {formatDateShort(group.date).toUpperCase()}
                  </Text>
                  <View className="bg-card border border-border rounded-2xl px-4 py-1">
                    {group.items.map((s, i) => (
                      <View
                        key={s.id}
                        className={i > 0 ? "border-t border-border" : ""}
                      >
                        <SessionCard
                          session={s}
                          onToggleStatus={() => toggleSession(s)}
                          onLongPress={() => setActionTarget(s)}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-card border border-border rounded-2xl px-4 py-1">
              {sessions.map((s, i) => (
                <View
                  key={s.id}
                  className={i > 0 ? "border-t border-border" : ""}
                >
                  <SessionCard
                    session={s}
                    onToggleStatus={() => toggleSession(s)}
                    onLongPress={() => setActionTarget(s)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {progress && (
          <View className="px-6 mb-2">
            <View className="bg-info-bg rounded-2xl p-4">
              <Text className="text-info text-xs font-semibold mb-3">
                {scope === "today"
                  ? dayOffset === 0
                    ? "Today's Progress"
                    : dayOffset === -1
                      ? "Yesterday's Progress"
                      : dayOffset === 1
                        ? "Tomorrow's Progress"
                        : `Progress · ${relativeDayLabel(dayOffset)}`
                  : weekOffset === 0
                    ? "This Week's Progress"
                    : `Progress · ${relativeWeekLabel(weekOffset)}`}
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
                  {progress.avgSpacingDays} days between repeats · {progress.currentStreakDays}-day streak
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <ActionSheet
        visible={actionTarget !== null}
        title={actionTarget?.title}
        subtitle={
          actionTarget
            ? `${actionTarget.startTime} · ${actionTarget.duration} min`
            : undefined
        }
        onClose={() => setActionTarget(null)}
        items={
          actionTarget
            ? [
                {
                  key: "complete",
                  label: "Mark complete",
                  icon: "check",
                  disabled: actionTarget.status === "completed",
                  onPress: () =>
                    setStatus(actionTarget, "completed", "Marked complete"),
                },
                {
                  key: "skip",
                  label: "Mark skipped",
                  icon: "x",
                  disabled: actionTarget.status === "skipped",
                  onPress: () =>
                    setStatus(actionTarget, "skipped", "Marked skipped"),
                },
                {
                  key: "reset",
                  label: "Reset to scheduled",
                  icon: "rotate-ccw",
                  disabled: actionTarget.status === "scheduled",
                  onPress: () =>
                    setStatus(actionTarget, "scheduled", "Reset to scheduled"),
                },
                {
                  key: "delete",
                  label: "Delete",
                  icon: "trash-2",
                  destructive: true,
                  onPress: () => {
                    const id = actionTarget.id;
                    const title = actionTarget.title;
                    deleteSession.mutate(id, {
                      onSuccess: () =>
                        toast("Deleted", { description: title }),
                    });
                  },
                },
              ]
            : []
        }
      />

      <ActionSheet
        visible={suggestionTarget !== null}
        title={suggestionTarget?.sessionType.name}
        subtitle={
          suggestionTarget
            ? `${suggestionTarget.date} · ${suggestionTarget.startTime}`
            : undefined
        }
        onClose={() => setSuggestionTarget(null)}
        items={
          suggestionTarget
            ? [
                {
                  key: "accept",
                  label: "Accept this slot",
                  icon: "check",
                  onPress: () => acceptSuggestion(suggestionTarget),
                },
                {
                  key: "adjust",
                  label: "Adjust…",
                  icon: "pencil",
                  onPress: () => adjustSuggestion(suggestionTarget),
                },
              ]
            : []
        }
      />

      <NotificationsSheet
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </View>
  );
}
