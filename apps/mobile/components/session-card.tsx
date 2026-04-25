import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/icon";
import { formatTimeRange } from "@/lib/time";
import type { Session } from "@/lib/types";

type Props = {
  session: Session;
  onToggleStatus?: () => void;
};

export function SessionCard({ session, onToggleStatus }: Props) {
  const isComplete = session.status === "completed";
  return (
    <Pressable
      onPress={onToggleStatus}
      className="flex-row items-center py-3 active:opacity-70"
    >
      <View
        className="h-3 w-3 rounded-full mr-3"
        style={{ backgroundColor: session.sessionType.color }}
      />
      <View className="flex-1">
        <Text className="text-foreground text-base font-medium">
          {session.title}
        </Text>
        <Text className="text-muted-foreground text-xs mt-0.5">
          {formatTimeRange(session.startTime, session.duration)} ·{" "}
          {session.duration} min
        </Text>
      </View>
      <View
        className="h-6 w-6 rounded-full items-center justify-center"
        style={{
          backgroundColor: isComplete ? "#1E3A5F" : "transparent",
          borderWidth: isComplete ? 0 : 1.5,
          borderColor: "#9CA3AF",
        }}
      >
        {isComplete && <Icon name="check" size={14} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
}
