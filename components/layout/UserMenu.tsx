"use client";

import { useEffect, useRef } from "react";
import { User, Settings, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/users/RoleBadge";

export function UserMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

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

  const items = [
    { label: "Profile", icon: User },
    { label: "Settings", icon: Settings },
  ] as const;

  return (
    <div
      ref={ref}
      className="absolute mt-2 right-0 w-[260px] rounded-2xl bg-white shadow-dropdown p-2 z-50"
    >
      <div className="px-3 py-3 border-b border-border mb-2">
        <div className="flex items-center gap-3">
          <Avatar name="Urvil" size="md" />
          <div>
            <div className="text-sm text-text-primary">Urvil</div>
            <div className="text-xs text-text-muted">
              urvil@infiniteautomation.com
            </div>
          </div>
        </div>
        <div className="mt-2">
          <RoleBadge role="Super Admin" />
        </div>
      </div>

      {items.map(({ label, icon: Icon }) => (
        <button
          key={label}
          className="w-full px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-[#F9FAFB] flex items-center gap-2"
        >
          <Icon size={16} />
          {label}
        </button>
      ))}

      <div className="my-2 border-t border-border" />

      <button className="w-full px-3 py-2 rounded-lg text-sm text-danger hover:bg-[#F9FAFB] flex items-center gap-2">
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}
