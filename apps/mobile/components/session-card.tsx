import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/icon";
import { formatTimeRange } from "@/lib/time";
import type { Session } from "@/lib/types";

type Props = {
  session: Session;
  onToggleStatus?: () => void;
  onLongPress?: () => void;
};

export function SessionCard({ session, onToggleStatus, onLongPress }: Props) {
  const isComplete = session.status === "completed";
  const isSkipped = session.status === "skipped";
  const isCancelled = session.status === "cancelled";
  const isInactive = isSkipped || isCancelled;
  return (
    <Pressable
      onPress={onToggleStatus}
      onLongPress={onLongPress}
      delayLongPress={250}
      className="flex-row items-center py-3 active:opacity-70"
    >
      <View
        className="h-3 w-3 rounded-full mr-3"
        style={{
          backgroundColor: session.sessionType.color,
          opacity: isInactive ? 0.4 : 1,
        }}
      />
      <View className="flex-1">
        <Text
          className="text-foreground text-base font-medium"
          style={{
            opacity: isInactive ? 0.55 : 1,
            textDecorationLine: isInactive ? "line-through" : "none",
          }}
        >
          {session.title}
        </Text>
        <Text
          className="text-muted-foreground text-xs mt-0.5"
          style={{ opacity: isInactive ? 0.7 : 1 }}
        >
          {formatTimeRange(session.startTime, session.duration)} ·{" "}
          {session.duration} min
          {isSkipped ? " · skipped" : ""}
          {isCancelled ? " · cancelled" : ""}
        </Text>
      </View>
      <View
        className="h-6 w-6 rounded-full items-center justify-center"
        style={{
          backgroundColor: isComplete
            ? "#1E3A5F"
            : isSkipped
              ? "#9CA3AF"
              : "transparent",
          borderWidth: isComplete || isSkipped ? 0 : 1.5,
          borderColor: "#9CA3AF",
        }}
      >
        {isComplete && <Icon name="check" size={14} color="#FFFFFF" />}
        {isSkipped && <Icon name="x" size={14} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
}
