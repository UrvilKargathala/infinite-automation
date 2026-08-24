"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/users/RoleBadge";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function UserMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  function handleSignOut() {
    localStorage.removeItem("ia_logged_in");
    router.push("/login");
  }

  function goTo(href: string) {
    router.push(href);
    onClose();
  }

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
    { label: "Profile", icon: User, href: "/profile" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ] as const;

  return (
    <div
      ref={ref}
      className="absolute mt-2 right-0 w-[260px] rounded-2xl bg-white shadow-dropdown p-2 z-50"
    >
      <div className="px-3 py-3 border-b border-border mb-2">
        <div className="flex items-center gap-3">
          <Avatar name={user.fullName} size="md" />
          <div>
            <div className="text-sm text-text-primary">{user.fullName}</div>
            <div className="text-xs text-text-muted">{user.email}</div>
          </div>
        </div>
        <div className="mt-2">
          <RoleBadge role={user.role} />
        </div>
      </div>

      {items.map(({ label, icon: Icon, href }) => (
        <button
          key={label}
          onClick={() => goTo(href)}
          className="w-full px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-[#F9FAFB] flex items-center gap-2"
        >
          <Icon size={16} />
          {label}
        </button>
      ))}

      <div className="my-2 border-t border-border" />

      <button
        onClick={handleSignOut}
        className="w-full px-3 py-2 rounded-lg text-sm text-danger hover:bg-[#F9FAFB] flex items-center gap-2"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}
