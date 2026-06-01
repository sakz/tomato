import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Settings } from "../types";

interface SettingsState {
  settings: Settings;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    work_duration: 1500,
    short_break_duration: 300,
    long_break_duration: 900,
    intervals_before_long_break: 4,
  },
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const settings = await invoke<Settings>("get_settings");
      set({ settings });
    } finally {
      set({ loading: false });
    }
  },

  updateSettings: async (settings) => {
    await invoke("update_settings", { settings });
    set({ settings });
  },
}));
