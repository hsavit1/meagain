import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { toast } from "sonner-native";
import { Icon } from "@/components/icon";
import { ScreenHeader } from "@/components/screen-header";
import { usePersonas, useSeedPersona } from "@/hooks/use-api";
import type { Persona } from "@/lib/types";

export default function Profile() {
  const router = useRouter();
  const personasQ = usePersonas();
  const seedMut = useSeedPersona();
  const [confirming, setConfirming] = useState<Persona | null>(null);

  function runSeed(persona: Persona) {
    seedMut.mutate(persona, {
      onSuccess: (res) => {
        toast.success("Reseeded", {
          description: `${persona} · ${res.types} types · ${res.sessions} sessions`,
        });
        setConfirming(null);
      },
      onError: (err) =>
        toast.error("Seed failed", { description: err.message }),
    });
  }

  return (
    <View className="flex-1 bg-background pt-safe">
      <ScreenHeader title="Profile" onBack={() => router.back()} />

      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        <View className="px-6 pb-5 items-center">
          <View className="h-20 w-20 rounded-full bg-primary items-center justify-center mb-3">
            <Icon name="user" size={36} color="#FFFFFF" />
          </View>
          <Text className="text-foreground text-xl font-medium">You</Text>
          <Text className="text-muted-foreground text-xs mt-0.5">
            Smart Session Planner
          </Text>
        </View>

        <Text className="px-6 text-muted-foreground text-xs font-semibold tracking-wide pb-2">
          DEVELOPER
        </Text>
        <View className="px-4 pb-4">
          <View className="bg-card border border-border rounded-2xl px-4 py-3 mb-3 flex-row gap-3 items-start">
            <Icon name="flask-conical" size={18} colorVar="--color-info" />
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">
                Demo personas
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5 leading-4">
                Tap a persona to wipe the database and reseed with a different
                kind of user. Useful for showing how the app behaves with
                various history shapes.
              </Text>
            </View>
          </View>

          <View className="gap-2">
            {(personasQ.data ?? []).map((p) => {
              const isConfirming = confirming === p.key;
              const pending = seedMut.isPending && seedMut.variables === p.key;
              return (
                <View
                  key={p.key}
                  className="bg-card border border-border rounded-2xl"
                >
                  <Pressable
                    onPress={() =>
                      setConfirming((c) => (c === p.key ? null : p.key))
                    }
                    className="px-4 py-3 flex-row items-center gap-3 active:opacity-70"
                  >
                    <View className="flex-1">
                      <Text className="text-foreground text-base font-medium">
                        {p.label}
                      </Text>
                      <Text className="text-muted-foreground text-xs mt-0.5 leading-4">
                        {p.description}
                      </Text>
                    </View>
                    <Icon
                      name={isConfirming ? "chevron-down" : "chevron-right"}
                      size={18}
                      colorVar="--color-muted-foreground"
                    />
                  </Pressable>
                  {isConfirming && (
                    <View className="px-4 pb-3 pt-1 border-t border-border">
                      <Text className="text-warning text-xs mb-2">
                        This deletes all current session types, sessions, and
                        availability.
                      </Text>
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => runSeed(p.key)}
                          disabled={pending}
                          className="bg-primary rounded-full px-4 py-2 active:opacity-80"
                          style={{ opacity: pending ? 0.5 : 1 }}
                        >
                          <Text className="text-white text-xs font-semibold">
                            {pending ? "Reseeding…" : `Reseed as ${p.label}`}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setConfirming(null)}
                          className="bg-card border border-border rounded-full px-4 py-2 active:opacity-70"
                        >
                          <Text className="text-foreground text-xs font-semibold">
                            Cancel
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
            {personasQ.isLoading && (
              <Text className="text-muted-foreground text-sm text-center py-4">
                Loading personas…
              </Text>
            )}
            {personasQ.isError && (
              <Text className="text-warning text-sm text-center py-4">
                Could not load personas. Is the API running?
              </Text>
            )}
          </View>
        </View>

        <Text className="px-6 text-muted-foreground text-xs font-semibold tracking-wide pb-2 pt-2">
          ABOUT
        </Text>
        <View className="px-4">
          <View className="bg-card border border-border rounded-2xl px-4 py-3">
            <Text className="text-muted-foreground text-xs leading-5">
              Smart Session Planner — take-home interview project. Logs
              sessions, tracks completion, and suggests time slots based on
              availability and spacing heuristics.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
