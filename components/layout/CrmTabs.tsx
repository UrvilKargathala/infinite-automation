"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Tickets", href: "/tickets" },
  { label: "Projects", href: "/projects" },
];

export function CrmTabs() {
  const pathname = usePathname();
  return (
    <div className="inline-flex items-center gap-1 bg-surface-alt rounded-full p-1 mb-4">
      {tabs.map(({ label, href }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-1.5 rounded-full text-sm font-normal transition-colors ${
              active ? "bg-white shadow-card text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
