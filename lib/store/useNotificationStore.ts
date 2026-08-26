import { create } from "zustand";

export interface AppNotification {
  id: string;
  text: string;
  color: string;
  time: string;
  read: boolean;
}

let seq = 0;
function nextId() {
  seq += 1;
  return `n${seq}`;
}

const seedNotifications: AppNotification[] = [
  { id: nextId(), text: "New quote sent to Chen Holdings", color: "#44BE4A", time: "2h ago", read: false },
  { id: nextId(), text: "Kapoor Villas quote accepted", color: "#10B981", time: "5h ago", read: false },
  { id: nextId(), text: "New lead: Wilson Farms", color: "#3A90C3", time: "1d ago", read: true },
  { id: nextId(), text: "Product catalog updated", color: "#94A3B8", time: "2d ago", read: true },
];

interface NotificationStore {
  notifications: AppNotification[];
  add: (text: string, color?: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: seedNotifications,
  add: (text, color = "#3A90C3") =>
    set((s) => ({
      notifications: [{ id: nextId(), text, color, time: "Just now", read: false }, ...s.notifications],
    })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
}));
