"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AppNotification } from "@/types";

async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await fetch("/api/notifications");
  if (!res.ok) return [];
  return res.json();
}

/** Polls the current user's real, DB-backed notifications. Shared by TopNav (bell dot) and NotificationPanel (list). */
export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 20000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    },
    onSuccess: (_void, id) => {
      queryClient.setQueryData<AppNotification[]>(["notifications"], (prev = []) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.setQueryData<AppNotification[]>(["notifications"], (prev = []) => prev.map((n) => ({ ...n, read: true })));
    },
  });

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  };
}
