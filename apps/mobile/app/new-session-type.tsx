import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { toast } from "sonner-native";
import { Icon } from "@/components/icon";
import {
  useCreateSessionType,
  useDeleteSessionType,
  useSessionTypes,
  useUpdateSessionType,
} from "@/hooks/use-api";

const COLORS = [
  "#A8C5A0",
  "#C4B5FD",
  "#FCA5A5",
  "#93C5FD",
  "#FCD34D",
  "#6EE7B7",
  "#F9A8D4",
  "#CBD5E1",
];

const ICONS = ["sun", "dumbbell", "book-open", "music", "brain", "coffee"];

const ICON_CATEGORY: Record<string, string> = {
  sun: "Wellness",
  dumbbell: "Health",
  "book-open": "Learning",
  music: "Creative",
  brain: "Focus",
  coffee: "Social",
};

export default function NewSessionType() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editing = !!params.id;

  const { data: types = [] } = useSessionTypes();
  const create = useCreateSessionType();
  const update = useUpdateSessionType();
  const remove = useDeleteSessionType();

  const [name, setName] = useState("");
  const [category, setCategory] = useState(ICON_CATEGORY[ICONS[0]]);
  const [priority, setPriority] = useState(3);
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);

  function selectIcon(next: string) {
    setIcon(next);
    const auto = ICON_CATEGORY[next];
    if (!auto) return;
    const trimmed = category.trim();
    const wasAuto =
      trimmed === "" || Object.values(ICON_CATEGORY).includes(trimmed);
    if (wasAuto) setCategory(auto);
  }

  useEffect(() => {
    if (!editing) return;
    const t = types.find((x) => x.id === params.id);
    if (t) {
      setName(t.name);
      setCategory(t.category);
      setPriority(t.priority);
      setColor(t.color);
      setIcon(t.icon);
    }
  }, [editing, params.id, types]);

  function handleSave() {
    if (!name.trim()) {
      toast.error("Name required", {
        description: "Please enter a name for this activity type.",
      });
      return;
    }
    const data = { name: name.trim(), category, priority, color, icon };
    const onSuccess = () => {
      toast.success(editing ? "Activity type updated" : "Activity type created", {
        description: data.name,
      });
      router.back();
    };
    const onError = (err: Error) =>
      toast.error("Could not save", { description: err.message });

    if (editing && params.id) {
      update.mutate({ id: params.id, data }, { onSuccess, onError });
    } else {
      create.mutate(data, { onSuccess, onError });
    }
  }

  function handleDelete() {
    if (!params.id) return;
    Alert.alert(
      "Delete activity type?",
      "This will also delete all activities of this type.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            remove.mutate(params.id!, {
              onSuccess: (res) => {
                toast.success("Activity type deleted", {
                  description:
                    res.deletedSessions > 0
                      ? `Also removed ${res.deletedSessions} ${res.deletedSessions === 1 ? "activity" : "activities"}`
                      : undefined,
                });
                router.back();
              },
              onError: (err) =>
                toast.error("Could not delete", { description: err.message }),
            }),
        },
      ],
    );
  }

  const isPending = create.isPending || update.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <View className="items-center pt-3">
        <View className="bg-border rounded-full" style={{ width: 36, height: 4 }} />
      </View>
      <View className="flex-row items-center justify-between px-6 py-3">
        <Text className="text-foreground text-2xl font-medium">
          {editing ? "Edit Activity Type" : "New Activity Type"}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-muted-foreground text-base">Cancel</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-6 gap-5">
        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning Run"
            placeholderTextColorClassName="accent-muted-foreground"
            className="bg-card border border-border rounded-xl h-12 px-4 text-foreground text-base"
          />
        </View>

        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">Category</Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Health"
            placeholderTextColorClassName="accent-muted-foreground"
            className="bg-card border border-border rounded-xl h-12 px-4 text-foreground text-base"
          />
        </View>

        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">Priority</Text>
          <View className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((p) => {
              const active = priority === p;
              const labels: Record<number, string> = {
                1: "Low",
                3: "Mid",
                5: "High",
              };
              return (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  className="flex-1 h-11 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: active ? "#1E3A5F" : "#FFFFFF",
                    borderWidth: active ? 0 : 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: active ? "#FFFFFF" : "#9CA3AF",
                    }}
                  >
                    {p}
                  </Text>
                  {labels[p] && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: active ? "#FFFFFF" : "#9CA3AF",
                      }}
                    >
                      {labels[p]}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">Color</Text>
          <View className="flex-row gap-2.5 flex-wrap">
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                className="h-8 w-8 rounded-full"
                style={{
                  backgroundColor: c,
                  borderWidth: color === c ? 2 : 0,
                  borderColor: "#1E3A5F",
                }}
              />
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">Icon</Text>
          <View className="flex-row gap-2 flex-wrap">
            {ICONS.map((i) => {
              const active = icon === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => selectIcon(i)}
                  className="h-11 w-11 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: active ? "#1E3A5F" : "#FFFFFF",
                    borderWidth: active ? 0 : 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <Icon
                    name={i}
                    size={20}
                    color={active ? "#FFFFFF" : "#9CA3AF"}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={isPending}
          className="bg-primary rounded-2xl items-center justify-center active:opacity-90"
          style={{
            height: 52,
            shadowColor: "#1E3A5F",
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <Text className="text-white text-base font-semibold">
            {isPending ? "Saving..." : "Save Activity Type"}
          </Text>
        </Pressable>

        {editing && (
          <Pressable
            onPress={handleDelete}
            className="rounded-2xl items-center justify-center border border-danger-border active:opacity-70 flex-row gap-2"
            style={{ height: 48 }}
          >
            <Icon name="trash-2" size={16} colorVar="--color-danger" />
            <Text className="text-danger text-base font-medium">
              Delete Activity Type
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
