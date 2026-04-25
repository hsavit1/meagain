import { Modal, Pressable, Text, View } from "react-native";
import { Icon } from "@/components/icon";

export type ActionSheetItem = {
  key: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  items: ActionSheetItem[];
  onClose: () => void;
};

export function ActionSheet({
  visible,
  title,
  subtitle,
  items,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      >
        <Pressable onPress={() => {}} className="pb-safe-or-6 px-3">
          <View className="bg-card rounded-2xl overflow-hidden">
            {(title || subtitle) && (
              <View className="px-5 py-3 border-b border-border">
                {title && (
                  <Text className="text-foreground text-sm font-semibold">
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    {subtitle}
                  </Text>
                )}
              </View>
            )}
            {items.map((item, i) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (item.disabled) return;
                  onClose();
                  item.onPress();
                }}
                className={`px-5 py-4 flex-row items-center gap-3 active:opacity-60 ${
                  i > 0 ? "border-t border-border" : ""
                }`}
                style={{ opacity: item.disabled ? 0.4 : 1 }}
              >
                {item.icon && (
                  <Icon
                    name={item.icon}
                    size={18}
                    color={item.destructive ? "#DC2626" : undefined}
                    colorVar="--color-foreground"
                  />
                )}
                <Text
                  className="text-base"
                  style={{
                    color: item.destructive
                      ? "#DC2626"
                      : undefined,
                    fontWeight: "500",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={onClose}
            className="bg-card rounded-2xl mt-2 px-5 py-4 items-center active:opacity-70"
          >
            <Text className="text-foreground text-base font-semibold">
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
