import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { toast } from "sonner-native";
import { ScreenHeader } from "@/components/screen-header";
import { SuggestionCard } from "@/components/suggestion-card";
import { useCreateSession, useSuggestions } from "@/hooks/use-api";
import { formatDateLong, formatTime12h } from "@/lib/time";

export default function SuggestionsScreen() {
  const router = useRouter();
  const { data: suggestions = [], isLoading, refetch } = useSuggestions(8);
  const createSession = useCreateSession();

  function handleAccept(s: (typeof suggestions)[number]) {
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
            description: `${s.sessionType.name} on ${formatDateLong(s.date)} at ${formatTime12h(s.startTime)}`,
          });
          refetch();
          router.back();
        },
        onError: (err) =>
          toast.error("Could not save", { description: err.message }),
      },
    );
  }

  function handleAdjust(s: (typeof suggestions)[number]) {
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

  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Smart Suggestions" onBack={() => router.back()} />
      <Text className="px-6 text-muted-foreground text-sm pb-3">
        Times that fit your availability, history, and priorities. Tap Accept
        to schedule, or Adjust to tweak first.
      </Text>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6 gap-3">
        {suggestions.length === 0 && !isLoading && (
          <View className="bg-card border border-border rounded-2xl p-6 items-center mx-2 mt-4">
            <Text className="text-foreground text-base font-medium mb-1">
              No suggestions yet
            </Text>
            <Text className="text-muted-foreground text-sm text-center">
              Add activity types and enable some availability windows to get
              smart suggestions.
            </Text>
          </View>
        )}
        {suggestions.map((s, i) => (
          <Pressable
            key={`${s.sessionTypeId}-${s.date}-${s.startTime}-${i}`}
            className="mx-2"
          >
            <SuggestionCard
              suggestion={s}
              onAccept={() => handleAccept(s)}
              onAdjust={() => handleAdjust(s)}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
