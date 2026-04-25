import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { toast } from "sonner-native";
import { Icon } from "@/components/icon";
import { useCreateSession, useSessionTypes } from "@/hooks/use-api";
import { ApiError } from "@/lib/api";
import {
  addMinutes,
  formatDateLong,
  formatTime12h,
  todayISO,
} from "@/lib/time";
import type { ConflictRow } from "@/lib/types";

const DURATIONS = [30, 60, 90, 120];

export default function NewSession() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    typeId?: string;
    date?: string;
    startTime?: string;
    duration?: string;
  }>();

  const { data: types = [] } = useSessionTypes();
  const createSession = useCreateSession();

  const [typeId, setTypeId] = useState(params.typeId ?? "");
  const [date, setDate] = useState(params.date ?? todayISO());
  const [startTime, setStartTime] = useState(params.startTime ?? "09:00");
  const [duration, setDuration] = useState(
    params.duration ? Number(params.duration) : 60,
  );
  const [notes, setNotes] = useState("");
  const [conflicts, setConflicts] = useState<ConflictRow[]>([]);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  useEffect(() => {
    if (!typeId && types.length > 0) setTypeId(types[0].id);
  }, [types, typeId]);

  const idsBeforeCreateRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    const known = idsBeforeCreateRef.current;
    if (!known) return;
    const fresh = types.find((t) => !known.has(t.id));
    if (fresh) {
      setTypeId(fresh.id);
      idsBeforeCreateRef.current = null;
    }
  }, [types]);

  const selectedType = types.find((t) => t.id === typeId);

  function handleSave(force = false) {
    if (!typeId) return;
    const title = selectedType?.name ?? "Activity";
    setConflicts([]);
    createSession.mutate(
      {
        sessionTypeId: typeId,
        title,
        date,
        startTime,
        duration,
        notes: notes.trim() || undefined,
        force,
      },
      {
        onSuccess: () => {
          toast.success("Activity saved", {
            description: `${title} on ${formatDateLong(date)} at ${formatTime12h(startTime)}`,
          });
          router.back();
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409 && err.conflicts) {
            setConflicts(err.conflicts);
            toast.error("Time conflict", {
              description: "This activity overlaps with an existing one.",
            });
          } else {
            toast.error("Could not save", { description: err.message });
          }
        },
      },
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <View className="items-center pt-3">
        <View className="bg-border rounded-full" style={{ width: 36, height: 4 }} />
      </View>
      <View className="flex-row items-center justify-between px-6 py-3">
        <Text className="text-foreground text-2xl font-medium">New Activity</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-muted-foreground text-base">Cancel</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-6 gap-5">
        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">
            Activity Type
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  idsBeforeCreateRef.current = new Set(types.map((t) => t.id));
                  router.push("/new-session-type");
                }}
                className="rounded-full h-9 w-9 items-center justify-center bg-card active:opacity-70"
                style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
              >
                <Icon name="plus" size={16} colorVar="--color-primary" />
              </Pressable>
              {types.map((t) => {
                const active = t.id === typeId;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setTypeId(t.id)}
                    className="rounded-full h-9 px-4 flex-row items-center gap-2"
                    style={{
                      backgroundColor: active ? "#1E3A5F" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: active ? "#1E3A5F" : "#E5E7EB",
                    }}
                  >
                    <View
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <Text
                      style={{
                        color: active ? "#FFFFFF" : "#111827",
                        fontSize: 13,
                        fontWeight: active ? "500" : "400",
                      }}
                    >
                      {t.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">Date</Text>
          <Pressable
            onPress={() => setShowDate(true)}
            className="bg-card border border-border rounded-xl h-12 flex-row items-center justify-between px-4 active:opacity-80"
          >
            <Text className="text-foreground text-base">{formatDateLong(date)}</Text>
            <Icon name="calendar" size={18} colorVar="--color-muted-foreground" />
          </Pressable>
          {showDate && (
            <DateTimePicker
              value={new Date(date + "T00:00:00")}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(_, d) => {
                setShowDate(Platform.OS === "ios");
                if (d) setDate(d.toISOString().slice(0, 10));
              }}
            />
          )}
        </View>

        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">Start Time</Text>
          <Pressable
            onPress={() => setShowTime(true)}
            className="bg-card border border-border rounded-xl h-12 flex-row items-center justify-between px-4 active:opacity-80"
          >
            <Text className="text-foreground text-base">
              {formatTime12h(startTime)}
            </Text>
            <Icon name="timer" size={18} colorVar="--color-muted-foreground" />
          </Pressable>
          {showTime && Platform.OS === "ios" && (
            <Modal
              transparent
              animationType="slide"
              visible
              onRequestClose={() => setShowTime(false)}
            >
              <View
                className="flex-1 justify-end"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              >
                <Pressable
                  onPress={() => setShowTime(false)}
                  className="flex-1"
                />
                <View className="bg-card pb-safe-or-4">
                  <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
                    <Text className="text-muted-foreground text-sm">
                      Start time
                    </Text>
                    <Pressable onPress={() => setShowTime(false)} hitSlop={12}>
                      <Text className="text-primary text-base font-semibold">
                        Done
                      </Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={(() => {
                      const [h, m] = startTime.split(":").map(Number);
                      const d = new Date();
                      d.setHours(h, m, 0, 0);
                      return d;
                    })()}
                    mode="time"
                    display="spinner"
                    onChange={(_, d) => {
                      if (d) {
                        const hh = String(d.getHours()).padStart(2, "0");
                        const mm = String(d.getMinutes()).padStart(2, "0");
                        setStartTime(`${hh}:${mm}`);
                      }
                    }}
                  />
                </View>
              </View>
            </Modal>
          )}
          {showTime && Platform.OS !== "ios" && (
            <DateTimePicker
              value={(() => {
                const [h, m] = startTime.split(":").map(Number);
                const d = new Date();
                d.setHours(h, m, 0, 0);
                return d;
              })()}
              mode="time"
              display="default"
              onChange={(_, d) => {
                setShowTime(false);
                if (d) {
                  const hh = String(d.getHours()).padStart(2, "0");
                  const mm = String(d.getMinutes()).padStart(2, "0");
                  setStartTime(`${hh}:${mm}`);
                }
              }}
            />
          )}
        </View>

        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">Duration</Text>
          <View className="flex-row gap-2">
            {DURATIONS.map((d) => {
              const active = duration === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDuration(d)}
                  className="rounded-full h-9 px-4 items-center justify-center"
                  style={{
                    backgroundColor: active ? "#1E3A5F" : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: active ? "#1E3A5F" : "#E5E7EB",
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#FFFFFF" : "#9CA3AF",
                      fontSize: 13,
                      fontWeight: active ? "500" : "400",
                    }}
                  >
                    {d} min
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-foreground text-sm font-semibold">
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this activity..."
            placeholderTextColorClassName="accent-muted-foreground"
            multiline
            numberOfLines={3}
            className="bg-card border border-border rounded-xl p-4 text-foreground text-base"
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
        </View>

        {conflicts.length > 0 && (
          <View className="bg-warning-bg border border-warning-border rounded-xl p-4 flex-row gap-3">
            <Icon name="triangle-alert" size={18} colorVar="--color-warning" />
            <View className="flex-1">
              <Text className="text-warning text-sm font-semibold">
                Time conflict
              </Text>
              {conflicts.map((c) => (
                <Text key={c.id} className="text-warning text-xs mt-0.5">
                  Overlaps with {c.title} ({formatTime12h(c.startTime)}–
                  {formatTime12h(c.endTime)})
                </Text>
              ))}
              <Pressable
                onPress={() => handleSave(true)}
                className="mt-2 self-start"
              >
                <Text className="text-warning text-xs font-semibold underline">
                  Save anyway
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <Pressable
          onPress={() => handleSave(false)}
          disabled={createSession.isPending || !typeId}
          className="bg-primary rounded-2xl h-13 items-center justify-center active:opacity-90 disabled:opacity-50"
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
            {createSession.isPending ? "Saving..." : "Save Activity"}
          </Text>
        </Pressable>

        {selectedType && (
          <Text className="text-muted-foreground text-xs text-center">
            Ends at {formatTime12h(addMinutes(startTime, duration))}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
