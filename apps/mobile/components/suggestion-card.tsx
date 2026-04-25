import { Pressable, Text, View } from "react-native";
import { formatDateShort, formatTime12h } from "@/lib/time";
import type { Suggestion } from "@/lib/types";

type Props = {
  suggestion: Suggestion;
  onAccept?: () => void;
  onAdjust?: () => void;
};

export function SuggestionCard({ suggestion, onAccept, onAdjust }: Props) {
  return (
    <View className="bg-suggestion rounded-2xl p-4 gap-3">
      <View className="gap-1">
        <View className="flex-row items-center gap-2">
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: suggestion.sessionType.color }}
          />
          <Text
            className="text-suggestion-accent text-sm font-semibold flex-1"
            numberOfLines={1}
          >
            {suggestion.sessionType.name}
          </Text>
        </View>
        <Text
          className="text-suggestion-secondary text-xs"
          numberOfLines={1}
        >
          {formatDateShort(suggestion.date)} ·{" "}
          {formatTime12h(suggestion.startTime)}–
          {formatTime12h(suggestion.endTime)}
        </Text>
      </View>
      <Text className="text-suggestion-foreground text-sm leading-5">
        {suggestion.reason}
      </Text>
      {(onAccept || onAdjust) && (
        <View className="flex-row gap-2">
          {onAccept && (
            <Pressable
              onPress={onAccept}
              className="bg-suggestion-accent rounded-full px-5 py-2 active:opacity-80"
            >
              <Text className="text-white text-sm font-semibold">Accept</Text>
            </Pressable>
          )}
          {onAdjust && (
            <Pressable
              onPress={onAdjust}
              className="rounded-full px-5 py-2 border-2 border-suggestion-secondary active:opacity-70"
            >
              <Text className="text-suggestion-secondary text-sm font-medium">
                Adjust
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
