import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Uniwind, useUniwind } from "uniwind";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme-preference";

function isThemePreference(v: unknown): v is ThemePreference {
  return v === "system" || v === "light" || v === "dark";
}

let loaded = false;
let cached: ThemePreference = "system";

export async function loadInitialThemePreference(): Promise<ThemePreference> {
  if (loaded) return cached;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    cached = isThemePreference(stored) ? stored : "system";
  } catch {
    cached = "system";
  }
  loaded = true;
  Uniwind.setTheme(cached);
  return cached;
}

export function useThemePreference() {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const [preference, setPreferenceState] = useState<ThemePreference>(cached);

  useEffect(() => {
    if (!loaded) loadInitialThemePreference().then(setPreferenceState);
  }, []);

  const setPreference = useCallback(async (next: ThemePreference) => {
    cached = next;
    setPreferenceState(next);
    Uniwind.setTheme(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Best-effort persistence; in-memory cache still updated.
    }
  }, []);

  const activeTheme: ThemePreference = hasAdaptiveThemes
    ? "system"
    : theme === "dark"
      ? "dark"
      : "light";

  return { preference, activeTheme, setPreference };
}
