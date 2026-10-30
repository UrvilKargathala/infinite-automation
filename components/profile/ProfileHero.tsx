"use client";

import Link from "next/link";
import { Briefcase, MessageCircle, MessageSquareWarning, Mail, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Num } from "@/components/ui/Num";
import { RoleBadge } from "@/components/users/RoleBadge";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useComplaints } from "@/lib/hooks/useComplaints";
import { useProjectUnread } from "@/lib/hooks/useProjectUnread";
import { CANCELLED } from "@/lib/utils/pipeline";
import type { Role } from "@/types";

/** Banner + identity, with the three things waiting on this person (each links to where it lives). */
export function ProfileHero({ user }: { user: { id: number; fullName: string; email: string; role: Role } }) {
  const projects = useProjectStore((s) => s.projects);
  const { complaints } = useComplaints();
  const unread = useProjectUnread();

  const me = user.fullName.trim().toLowerCase();
  const stats: { label: string; value: number; icon: LucideIcon; href: string }[] = [
    { label: "CRM records assigned", value: projects.filter((p) => p.stage !== CANCELLED && p.assigned.trim().toLowerCase() === me).length, icon: Briefcase, href: "/crm" },
    { label: "Pending complaints", value: complaints.filter((c) => c.status === "Pending" && c.engineerId === user.id).length, icon: MessageSquareWarning, href: "/complaints" },
    { label: "Unread chats", value: Object.values(unread).reduce((a, b) => a + b, 0), icon: MessageCircle, href: "/crm" },
  ];

  return (
    <div className="glass rounded-3xl overflow-hidden">
      <div className="h-28 sm:h-32 bg-sidebar-gradient relative">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(60%_120%_at_85%_0%,rgba(68,190,74,0.5),transparent_60%)]" />
      </div>
      <div className="px-5 sm:px-8 pb-6">
        {/* Only the avatar overlaps the banner; name and stats sit on the light card for contrast. */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            <div className="rounded-full p-1.5 bg-white shadow-card shrink-0 -mt-10 sm:-mt-12 relative">
              <Avatar name={user.fullName} size="xl" />
            </div>
            <div className="min-w-0 pt-3">
              <h2 className="text-2xl text-text-primary truncate">{user.fullName}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary min-w-0">
                  <Mail size={14} className="text-text-muted shrink-0" /> <span className="truncate">{user.email}</span>
                </span>
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:ml-auto lg:w-[460px] lg:mt-4">
            {stats.map(({ label, value, icon: Icon, href }) => (
              <Link key={label} href={href} className="glass-tile rounded-2xl px-3 py-3 sm:px-4 hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center justify-between gap-2">
                  <Num className="text-2xl text-text-primary">{value}</Num>
                  <span className="w-8 h-8 rounded-lg bg-brand-gradient-tint text-brand-blue flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs text-text-muted mt-1 leading-tight">{label}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
