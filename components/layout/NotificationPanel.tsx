"use client";

import { useEffect, useRef } from "react";
import { useNotificationStore } from "@/lib/store/useNotificationStore";

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute mt-2 right-0 w-[320px] max-h-[420px] flex flex-col rounded-2xl bg-white shadow-dropdown p-2 z-50"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm text-text-primary">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="text-xs text-brand-blue hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      <div className="overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center text-text-muted text-sm py-8">No notifications</div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`w-full flex gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-[#F9FAFB] transition-colors ${
                n.read ? "" : "bg-[#3A90C308]"
              }`}
            >
              <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: n.read ? "#D1D5DB" : n.color }} />
              <div>
                <div className={`text-sm ${n.read ? "text-text-secondary" : "text-text-primary"}`}>{n.text}</div>
                <div className="text-xs text-text-muted mt-0.5">{n.time}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
