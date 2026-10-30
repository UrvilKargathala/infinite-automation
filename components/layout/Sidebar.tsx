"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { NavLinks, useNavItems } from "@/components/layout/NavLinks";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSidebarStore } from "@/lib/store/useSidebarStore";

export function Sidebar() {
  const items = useNavItems();
  const user = useAuthStore((s) => s.user);
  const { collapsed, toggle } = useSidebarStore();
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-3 top-3 bottom-3 z-40 rounded-[28px] bg-sidebar-gradient backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-sidebar text-white overflow-hidden transition-[width] duration-200 print:hidden ${
        collapsed ? "w-[76px]" : "w-[248px]"
      }`}
    >
      <div className={`flex items-center pt-5 pb-4 ${collapsed ? "flex-col gap-3 px-0" : "gap-1.5 pl-4 pr-2.5"}`}>
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 ${collapsed ? "mx-auto" : ""}`}>
            <Image src="/logo.png" alt="Infinite Automation" width={28} height={28} className="w-7 h-7" />
          </span>
          {!collapsed && (
            <span className="leading-tight min-w-0">
              <span className="block text-[15px]">Infinite</span>
              <span className="block text-xs text-white/55 truncate">Automation workspace</span>
            </span>
          )}
        </Link>
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <ToggleIcon size={17} strokeWidth={1.75} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2">
        <NavLinks items={items} collapsed={collapsed} />
      </nav>

      <div className="px-3 pb-3 pt-2 space-y-2">
        {collapsed ? (
          <Link
            href="/quote?new=1"
            title="New quote"
            className="mx-auto w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <Plus size={16} />
          </Link>
        ) : (
          <Link
            href="/quote?new=1"
            className="relative flex items-center justify-between rounded-2xl bg-white/10 border border-white/15 p-4 hover:bg-white/15 transition-colors"
          >
            <span>
              <span className="block text-sm">New quote</span>
              <span className="block text-xs text-white/60">Build and send in minutes</span>
            </span>
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Plus size={16} />
            </span>
          </Link>
        )}
        {user && (
          <Link
            href="/profile"
            title={collapsed ? `${user.fullName} · ${user.role}` : undefined}
            className={`flex items-center rounded-2xl transition-colors ${
              collapsed
                ? "justify-center py-1 hover:bg-white/10"
                : "gap-3 bg-white/10 border border-white/10 px-3 py-2.5 hover:bg-white/15"
            }`}
          >
            <Avatar name={user.fullName} size="md" />
            {!collapsed && (
              <span className="min-w-0 leading-tight">
                <span className="block text-sm truncate">{user.fullName}</span>
                <span className="block text-xs text-white/55">{user.role}</span>
              </span>
            )}
          </Link>
        )}
      </div>
    </aside>
  );
}
