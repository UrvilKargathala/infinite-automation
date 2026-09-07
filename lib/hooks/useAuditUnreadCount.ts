"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { can } from "@/lib/utils/permissions";

function lastViewedKey(userId: number): string {
  return `ia_audit_last_viewed_${userId}`;
}

/** Polls unread audit-log count since the user's last /audit visit. Shared by TopNav (bell dot) and NotificationPanel (count row). */
export function useAuditUnreadCount() {
  const user = useAuthStore((s) => s.user);
  const canView = user ? can(user.role, "viewAuditLog") : false;

  const [lastViewed, setLastViewed] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    try {
      setLastViewed(localStorage.getItem(lastViewedKey(user.id)) ?? new Date(0).toISOString());
    } catch {
      setLastViewed(new Date(0).toISOString());
    }
  }, [user]);

  const { data } = useQuery({
    queryKey: ["audit-unread-count", lastViewed],
    queryFn: async () => {
      const res = await fetch(`/api/audit/unread-count?since=${encodeURIComponent(lastViewed!)}`);
      if (!res.ok) return { count: 0 };
      return res.json() as Promise<{ count: number }>;
    },
    enabled: canView && !!lastViewed,
    refetchInterval: 60000,
  });

  function markViewed() {
    if (!user) return;
    try {
      localStorage.setItem(lastViewedKey(user.id), new Date().toISOString());
      setLastViewed(new Date().toISOString());
    } catch {
      // ignore storage failures
    }
  }

  return { count: data?.count ?? 0, canView, markViewed };
}
