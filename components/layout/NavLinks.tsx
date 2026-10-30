"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Briefcase,
  Users,
  FileText,
  Database,
  Package,
  UserCog,
  History,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { useProductStore } from "@/lib/store/useProductStore";
import { can } from "@/lib/utils/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  group: "Workspace" | "Catalogue" | "Admin";
  activeMatch?: string[];
  count?: number;
};

const NAV_GROUPS = ["Workspace", "Catalogue", "Admin"] as const;

function isNavActive(item: NavItem, pathname: string) {
  return (item.activeMatch ?? [item.href]).some((p) => pathname.startsWith(p));
}

/** Role-filtered nav items with live counts — shared by the desktop sidebar and the mobile menu. */
export function useNavItems(): NavItem[] {
  const role = useAuthStore((s) => s.user?.role ?? "Purchase");
  // Same rule as the Projects page "Total active" card, so the badge and the page always agree.
  const activeProjects = useProjectStore((s) => s.projects.filter((p) => p.stage !== "Cancelled").length);
  const activeQuotes = useQuoteStore((s) => s.quotes.filter((q) => q.status === "Draft" || q.status === "Sent").length);
  const customers = useCustomerStore((s) => s.customers.length);
  const products = useProductStore((s) => s.products.length);

  const items: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid, group: "Workspace" },
    { label: "CRM", href: "/crm", icon: Briefcase, group: "Workspace", activeMatch: ["/tickets", "/crm", "/complaints"], count: activeProjects },
    { label: "Customers", href: "/customers", icon: Users, group: "Workspace", count: customers },
    { label: "Quote", href: "/quote", icon: FileText, group: "Workspace", count: activeQuotes },
    { label: "Master File", href: "/master", icon: Database, group: "Catalogue", count: products },
    { label: "Procurement", href: "/procurement", icon: Package, group: "Catalogue" },
    { label: "Users", href: "/users", icon: UserCog, group: "Admin" },
    { label: "Audit Log", href: "/audit", icon: History, group: "Admin" },
  ];

  return items.filter((item) => {
    if (item.href === "/users") return can(role, "viewUsers");
    if (item.href === "/audit") return can(role, "viewAuditLog");
    return true;
  });
}

export function NavLinks({
  items,
  collapsed = false,
  onNavigate,
}: {
  items: NavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      {NAV_GROUPS.map((group) => {
        const groupItems = items.filter((i) => i.group === group);
        if (groupItems.length === 0) return null;
        return (
          <div key={group} className="mb-4">
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-white/15" />
            ) : (
              <div className="px-2.5 pb-1.5 text-[11px] uppercase tracking-[0.12em] text-white/40">{group}</div>
            )}
            <div className="flex flex-col gap-0.5">
              {groupItems.map((item) => {
                const active = isNavActive(item, pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex items-center h-10 rounded-xl text-sm transition-colors ${
                      collapsed ? "justify-center px-0" : "gap-3 px-3"
                    } ${
                      active
                        ? "bg-white text-[#0E2533] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5)]"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        active ? "bg-brand-gradient text-white" : "bg-white/10"
                      }`}
                    >
                      <Icon size={15} strokeWidth={1.75} />
                    </span>
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && !!item.count && (
                      <span
                        className={`min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-numeric flex items-center justify-center ${
                          active ? "bg-[#0E2533]/10 text-[#0E2533]" : "bg-white/15 text-white"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                    {collapsed && !!item.count && (
                      <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-brand-green" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
