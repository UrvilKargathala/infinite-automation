"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useAttention, type AttentionRow } from "@/lib/hooks/useAttention";
import { notificationModule, type NotificationModule } from "@/lib/utils/notifications";
import { relativeTime } from "@/lib/utils/relativeTime";

type Filter = "All" | "Unread" | NotificationModule;

const PILL: Record<AttentionRow["tone"], string> = { warn: "bg-warning/15 text-warning", danger: "bg-danger/15 text-danger", info: "bg-brand-blue/15 text-brand-blue" };

/** Bell panel: "Needs attention" (live counts per module, each a shortcut) above the notification feed, which can be filtered. */
export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const refreshing = useIsFetching() > 0;
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { rows, total, markAuditViewed } = useAttention();
  const [filter, setFilter] = useState<Filter>("All");

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

  function go(row: AttentionRow) {
    if (row.key === "audit") markAuditViewed();
    onClose();
    router.push(row.href);
  }

  // Chips: All, Unread, then only the modules that actually have notifications.
  const feed = useMemo(() => notifications.map((n) => ({ n, module: notificationModule(n) })), [notifications]);
  const chips = useMemo<Filter[]>(() => {
    const modules = [...new Set(feed.map((f) => f.module))].sort((a, b) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)));
    return ["All", "Unread", ...modules];
  }, [feed]);
  // A filter whose notifications have all gone (e.g. everything read, or the list refreshed) drops back to All.
  const active = chips.includes(filter) ? filter : "All";
  const shown = feed.filter((f) => (active === "All" ? true : active === "Unread" ? !f.n.read : f.module === active));

  return (
    <div ref={ref} className="absolute mt-2 right-0 w-[340px] max-w-[calc(100vw-2rem)] max-h-[min(640px,calc(100vh-96px))] flex flex-col rounded-2xl glass-pop p-2 z-50">
      <div className="shrink-0">
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <div className="min-w-0">
            <div className="text-sm text-text-primary">Needs attention</div>
            <div className="text-xs text-text-muted">{total > 0 ? `${total} ${total === 1 ? "item" : "items"} waiting on you` : "Nothing is waiting on you"}</div>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries()}
            aria-label="Refresh"
            title="Refresh"
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-text-secondary hover:bg-[#F3F5F7] hover:text-text-primary transition-colors"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="space-y-0.5">
          {rows.map((row) => (
            <button key={row.key} onClick={() => go(row)} className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-xl hover:bg-[#F3F5F7] transition-colors">
              <span className="w-9 h-9 rounded-xl bg-text-primary/[0.05] text-text-secondary flex items-center justify-center shrink-0">
                <row.icon size={17} strokeWidth={1.75} />
              </span>
              <span className="flex-1 min-w-0 text-sm text-text-primary truncate">{row.label}</span>
              {row.loading ? (
                <span className="text-xs text-text-muted">…</span>
              ) : row.count > 0 ? (
                <span className={`min-w-[26px] px-2 py-0.5 rounded-full text-xs text-center font-numeric tabular-nums ${PILL[row.tone]}`}>{row.count > 99 ? "99+" : row.count}</span>
              ) : (
                <span className="text-xs text-text-muted px-2">–</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 mt-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-sm text-text-primary">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={() => markAllRead()} className="text-xs text-brand-blue hover:underline">Mark all as read</button>
          )}
        </div>
        {chips.length > 2 && (
          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${active === c ? "bg-brand-gradient text-white" : "bg-text-primary/[0.05] text-text-secondary hover:text-text-primary"}`}
              >
                {c}
                {c === "Unread" && unreadCount > 0 && <span className="ml-1 font-numeric">{unreadCount}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-y-auto min-h-[96px]">
        {shown.length === 0 ? (
          <div className="text-center text-text-muted text-sm py-8">{notifications.length === 0 ? "No notifications" : "Nothing here"}</div>
        ) : (
          shown.map(({ n, module }) => (
            <button
              key={n.id}
              onClick={() => { markRead(n.id); if (n.href) { onClose(); router.push(n.href); } }}
              className={`w-full flex gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-[#F9FAFB] transition-colors ${n.read ? "" : "bg-[#3A90C308]"}`}
            >
              <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: n.read ? "#D1D5DB" : n.color }} />
              <div className="min-w-0">
                <div className={`text-sm ${n.read ? "text-text-secondary" : "text-text-primary"}`}>{n.text}</div>
                <div className="text-xs text-text-muted mt-0.5">{module !== "Other" && <>{module} · </>}{relativeTime(n.createdAt)}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
