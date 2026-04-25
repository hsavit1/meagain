import { Text, View } from "react-native";
import { Icon } from "@/components/icon";

type Props = {
  icon?: string;
  title: string;
  message?: string;
};

export function EmptyState({ icon = "inbox", title, message }: Props) {
  return (
    <View className="items-center py-12 px-6">
      <View className="h-14 w-14 rounded-full bg-muted items-center justify-center mb-3">
        <Icon name={icon} size={24} colorVar="--color-muted-foreground" />
      </View>
      <Text className="text-foreground text-base font-medium">{title}</Text>
      {message && (
        <Text className="text-muted-foreground text-sm text-center mt-1">
          {message}
        </Text>
      )}
    </View>
  );
}
