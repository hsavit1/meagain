import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/icon";

type Props = {
  title: string;
  subtitle?: string;
  rightAction?: { icon: string; onPress: () => void };
  onBack?: () => void;
};

export function ScreenHeader({ title, subtitle, rightAction, onBack }: Props) {
  return (
    <View className="px-6 pt-2 pb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          {onBack && (
            <Pressable
              onPress={onBack}
              hitSlop={12}
              className="h-9 w-9 rounded-full bg-card border border-border items-center justify-center active:opacity-70"
            >
              <Icon name="arrow-left" size={18} colorVar="--color-foreground" />
            </Pressable>
          )}
          <View className="flex-1">
            <Text
              className="text-foreground text-3xl"
              style={{ fontWeight: "300", letterSpacing: -0.5 }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text className="text-muted-foreground text-xs mt-0.5">
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {rightAction && (
          <Pressable
            onPress={rightAction.onPress}
            className="h-9 w-9 rounded-full bg-primary items-center justify-center active:opacity-80"
          >
            <Icon name={rightAction.icon} size={18} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
