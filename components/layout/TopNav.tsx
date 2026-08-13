"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Search, Bell, Menu, X } from "lucide-react";
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
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white shadow-card w-full">
      <div className="max-w-[1860px] mx-auto px-4 sm:px-6 lg:px-8 h-[60px] sm:h-[72px] flex items-center justify-between">
        {/* LEFT — Logo + hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:bg-[#F9FAFB]"
            onClick={() => setMobileNav(!mobileNav)}
            aria-label="Toggle menu"
          >
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Image src="/logo.png" alt="Infinite Automation" width={36} height={36} className="rounded-xl w-8 h-8 sm:w-9 sm:h-9" />
          <span className="text-sm sm:text-base font-normal text-text-primary whitespace-nowrap hidden sm:block">
            Infinite Automation
          </span>
        </div>

        {/* CENTER — Nav items (desktop) */}
        <div className="hidden lg:flex items-center gap-1">
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
        <div className="flex items-center gap-1 sm:gap-2">
          <IconButton icon={Search} ariaLabel="Search" />
          <IconButton icon={Bell} ariaLabel="Notifications" indicator />
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-normal"
            >
              UR
            </button>
            {menuOpen && <UserMenu onClose={() => setMenuOpen(false)} />}
          </div>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileNav && (
        <div className="lg:hidden border-t border-border bg-white px-4 py-3 space-y-1">
          {navItems.map(({ label, href }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileNav(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-normal transition-colors ${
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
      )}
    </nav>
  );
}
