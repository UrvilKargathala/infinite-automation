"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Search, Bell } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { UserMenu } from "@/components/layout/UserMenu";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "CRM", href: "/crm" },
  { label: "Quote", href: "/quote" },
  { label: "Master File", href: "/master" },
  { label: "Users", href: "/users" },
];

export function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 h-[72px] bg-white shadow-card w-full">
      <div className="max-w-[1860px] mx-auto px-8 h-full flex items-center justify-between">
        {/* LEFT — Logo */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Infinite Automation" width={36} height={36} className="rounded-xl" />
          <span className="text-base font-normal text-text-primary whitespace-nowrap">
            Infinite Automation
          </span>
        </div>

        {/* CENTER — Nav items */}
        <div className="flex items-center gap-1">
          {navItems.map(({ label, href }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-full text-sm font-normal transition-colors ${
                  active
                    ? "bg-brand-gradient text-white"
                    : "text-text-secondary hover:bg-[#F9FAFB] hover:text-text-primary"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* RIGHT — Actions */}
        <div className="flex items-center gap-2">
          <IconButton icon={Search} ariaLabel="Search" />
          <IconButton icon={Bell} ariaLabel="Notifications" indicator />
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-normal"
            >
              UR
            </button>
            {menuOpen && <UserMenu onClose={() => setMenuOpen(false)} />}
          </div>
        </div>
      </div>
    </nav>
  );
}
