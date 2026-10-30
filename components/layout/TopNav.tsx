"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Bell, Menu, X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { SearchPanel } from "@/components/layout/SearchPanel";
import { HeaderClock } from "@/components/layout/HeaderClock";
import { NavLinks, useNavItems } from "@/components/layout/NavLinks";
import { useSidebarStore } from "@/lib/store/useSidebarStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useAuditUnreadCount } from "@/lib/hooks/useAuditUnreadCount";
import { initials } from "@/lib/utils/initials";

export function TopNav() {
  const myName = useAuthStore((s) => s.user?.fullName ?? "");
  const navItems = useNavItems();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const [mobileNav, setMobileNav] = useState(false);
  const [openPanel, setOpenPanel] = useState<"search" | "notifications" | "user" | null>(null);
  const menuOpen = openPanel === "user";
  const searchOpen = openPanel === "search";
  const notifOpen = openPanel === "notifications";
  function togglePanel(panel: "search" | "notifications" | "user") {
    setOpenPanel((p) => (p === panel ? null : panel));
  }
  const { unreadCount } = useNotifications();
  const { count: auditUnread } = useAuditUnreadCount();

  return (
    // Mobile: sticky glass bar. Desktop: the action strip floats top-right, level with the page title.
    <nav
      className={`sticky top-0 z-30 w-full px-4 pt-3 sm:px-6 print:hidden lg:absolute lg:inset-x-0 lg:top-0 lg:px-0 lg:pt-0 lg:pointer-events-none transition-[padding] duration-200 ${
        collapsed ? "lg:pl-[88px]" : "lg:pl-[260px]"
      }`}
    >
      <div className="h-[60px] px-3 sm:px-4 flex items-center justify-between rounded-2xl glass lg:h-auto lg:max-w-[1860px] lg:mx-auto lg:px-6 lg:pt-4 lg:rounded-none lg:bg-none lg:border-0 lg:shadow-none lg:backdrop-blur-none">
        {/* LEFT — hamburger + logo (mobile only; desktop has the sidebar) */}
        <div className="flex items-center gap-2 sm:gap-3 lg:hidden">
          <button
            className="p-1.5 rounded-lg text-text-secondary hover:bg-white/70"
            onClick={() => setMobileNav(!mobileNav)}
            aria-label="Toggle menu"
          >
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Image src="/logo.png" alt="Infinite Automation" width={36} height={36} className="rounded-xl w-8 h-8" />
          <span className="text-sm text-text-primary whitespace-nowrap hidden sm:block">Infinite Automation</span>
        </div>

        {/* RIGHT — Actions */}
        <div className="flex items-center gap-1 sm:gap-2 lg:ml-auto lg:pointer-events-auto">
          <HeaderClock />
          <div className="relative">
            <IconButton icon={Search} ariaLabel="Search" onClick={() => togglePanel("search")} />
            {searchOpen && <SearchPanel onClose={() => setOpenPanel(null)} />}
          </div>
          <div className="relative">
            <IconButton icon={Bell} ariaLabel="Notifications" indicator={unreadCount > 0 || auditUnread > 0} onClick={() => togglePanel("notifications")} />
            {notifOpen && <NotificationPanel onClose={() => setOpenPanel(null)} />}
          </div>
          <div className="relative">
            <button
              onClick={() => togglePanel("user")}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-normal shadow-[0_6px_14px_-4px_rgba(58,144,195,0.55)]"
            >
              {myName ? initials(myName) : ""}
            </button>
            {menuOpen && <UserMenu onClose={() => setOpenPanel(null)} />}
          </div>
        </div>
      </div>

      {/* Mobile nav — same dark glass panel as the desktop sidebar */}
      {mobileNav && (
        <div className="lg:hidden mt-2 rounded-[24px] bg-sidebar-gradient backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-sidebar text-white px-3 pt-4 pb-1 max-h-[75vh] overflow-y-auto">
          <NavLinks items={navItems} onNavigate={() => setMobileNav(false)} />
        </div>
      )}
    </nav>
  );
}
