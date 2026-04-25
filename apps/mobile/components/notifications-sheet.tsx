import { useRouter } from "expo-router";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { toast } from "sonner-native";
import { Icon } from "@/components/icon";
import { useSessions, useSuggestions, useUpdateSession } from "@/hooks/use-api";
import { addDaysISO, addMinutes, formatTime12h, todayISO } from "@/lib/time";
import type { Session } from "@/lib/types";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export function NotificationsSheet({ visible, onClose }: Props) {
  const router = useRouter();
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  const sessionsQ = useSessions({
    startDate: addDaysISO(today, -7),
    endDate: tomorrow,
  });
  const suggestionsQ = useSuggestions(1);
  const updateSession = useUpdateSession();

  const now = nowHHMM();
  const sessions = sessionsQ.data ?? [];

  const overdue: Session[] = sessions.filter((s) => {
    if (s.status !== "scheduled") return false;
    if (s.date < today) return true;
    if (s.date === today) {
      const end = addMinutes(s.startTime, s.duration);
      return end <= now;
    }
    return false;
  });

  const upcoming: Session[] = sessions
    .filter((s) => {
      if (s.status !== "scheduled") return false;
      if (s.date !== today) return false;
      const end = addMinutes(s.startTime, s.duration);
      return end > now;
    })
    .slice(0, 3);

  const topSuggestion = suggestionsQ.data?.[0];

  function setStatus(s: Session, status: Session["status"], label: string) {
    updateSession.mutate(
      { id: s.id, data: { status } },
      { onSuccess: () => toast(label, { description: s.title }) },
    );
  }

  const empty =
    overdue.length === 0 && upcoming.length === 0 && !topSuggestion;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <Pressable onPress={() => {}} className="bg-background rounded-t-3xl pb-safe-or-6">
          <View className="items-center pt-3 pb-2">
            <View
              className="bg-border rounded-full"
              style={{ width: 36, height: 4 }}
            />
          </View>
          <View className="flex-row items-center justify-between px-6 pb-3">
            <View className="flex-row items-center gap-2">
              <Icon name="bell" size={18} colorVar="--color-foreground" />
              <Text className="text-foreground text-xl font-medium">
                Notifications
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-muted-foreground text-base">Done</Text>
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 520 }} contentContainerClassName="px-6 pb-4 gap-5">
            {empty && (
              <View className="bg-card border border-border rounded-2xl p-6 items-center">
                <Icon
                  name="check"
                  size={24}
                  colorVar="--color-success"
                />
                <Text className="text-foreground text-base font-medium mt-2">
                  All caught up
                </Text>
                <Text className="text-muted-foreground text-xs mt-1 text-center">
                  No overdue or upcoming activities right now.
                </Text>
              </View>
            )}

            {overdue.length > 0 && (
              <View>
                <Text className="text-muted-foreground text-xs font-semibold tracking-wide mb-2">
                  PAST DUE · {overdue.length}
                </Text>
                <View className="gap-2">
                  {overdue.map((s) => (
                    <View
                      key={s.id}
                      className="bg-warning-bg border border-warning-border rounded-2xl p-4"
                    >
                      <View className="flex-row items-center gap-2 mb-1">
                        <View
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: s.sessionType.color }}
                        />
                        <Text className="text-warning text-sm font-semibold flex-1">
                          {s.title}
                        </Text>
                      </View>
                      <Text className="text-warning text-xs">
                        {s.date === today ? "Today" : s.date} ·{" "}
                        {formatTime12h(s.startTime)}–
                        {formatTime12h(addMinutes(s.startTime, s.duration))}
                      </Text>
                      <View className="flex-row gap-2 mt-3">
                        <Pressable
                          onPress={() =>
                            setStatus(s, "completed", "Marked complete")
                          }
                          className="bg-primary rounded-full px-3 py-1.5 active:opacity-80"
                        >
                          <Text className="text-white text-xs font-semibold">
                            Mark complete
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            setStatus(s, "skipped", "Marked skipped")
                          }
                          className="bg-card border border-border rounded-full px-3 py-1.5 active:opacity-70"
                        >
                          <Text className="text-foreground text-xs font-semibold">
                            Skip
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {upcoming.length > 0 && (
              <View>
                <Text className="text-muted-foreground text-xs font-semibold tracking-wide mb-2">
                  UPCOMING TODAY
                </Text>
                <View className="bg-card border border-border rounded-2xl px-4 py-1">
                  {upcoming.map((s, i) => (
                    <View
                      key={s.id}
                      className={`py-3 flex-row items-center gap-3 ${
                        i > 0 ? "border-t border-border" : ""
                      }`}
                    >
                      <View
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: s.sessionType.color }}
                      />
                      <View className="flex-1">
                        <Text className="text-foreground text-sm font-medium">
                          {s.title}
                        </Text>
                        <Text className="text-muted-foreground text-xs mt-0.5">
                          {formatTime12h(s.startTime)} · {s.duration} min
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {topSuggestion && (
              <View>
                <Text className="text-muted-foreground text-xs font-semibold tracking-wide mb-2">
                  SUGGESTED
                </Text>
                <Pressable
                  onPress={() => {
                    onClose();
                    router.push("/suggestions");
                  }}
                  className="bg-suggestion rounded-2xl p-4 active:opacity-80"
                >
                  <View className="flex-row items-center gap-2 mb-1">
                    <View
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: topSuggestion.sessionType.color }}
                    />
                    <Text className="text-suggestion-foreground text-sm font-semibold">
                      {topSuggestion.sessionType.name}
                    </Text>
                  </View>
                  <Text className="text-suggestion-foreground text-xs">
                    {topSuggestion.reason}
                  </Text>
                  <Text className="text-suggestion-foreground text-xs mt-1 font-semibold">
                    {topSuggestion.date} · {formatTime12h(topSuggestion.startTime)}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
