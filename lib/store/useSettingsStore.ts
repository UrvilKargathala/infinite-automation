import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationSettings {
  leadAlerts: boolean;
  quoteAlerts: boolean;
}

interface SettingsStore extends NotificationSettings {
  setSetting: (key: keyof NotificationSettings, value: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      leadAlerts: true,
      quoteAlerts: false,
      setSetting: (key, value) => set({ [key]: value }),
    }),
    { name: "ia_notification_settings" }
  )
);
