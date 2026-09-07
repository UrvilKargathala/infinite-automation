"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search, Download, RefreshCw, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { can } from "@/lib/utils/permissions";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/users/RoleBadge";
import { Num } from "@/components/ui/Num";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { AuditPageSkeleton } from "./AuditPageSkeleton";
import { AuditDetailModal } from "./AuditDetailModal";
import { moduleColors, actionMeta, formatShortTimestamp, formatFullTimestamp } from "./auditMeta";
import type { AuditLog, AuditModule, AuditAction } from "@/types";
import type { AuditStats } from "@/lib/api/audit";

const MODULES: AuditModule[] = ["Master", "CRM", "Quote", "Projects", "User Management", "Auth"];
const ACTIONS: AuditAction[] = [
  "create", "update", "delete", "import", "export", "status_change", "stage_change", "login", "logout", "role_change",
];
const ENTITY_LINKS: Record<string, string> = {
  product: "/master",
  ticket: "/tickets",
  quote: "/quote",
  user: "/users",
  project: "/projects",
};

interface Filters {
  from: string;
  to: string;
  module: AuditModule | "";
  action: AuditAction | "";
  userId: string;
  search: string;
}

function defaultFilters(): Filters {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  return { from, to, module: "", action: "", userId: "", search: "" };
}

function buildParams(filters: Filters, extra?: Record<string, string>): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.module) p.set("module", filters.module);
  if (filters.action) p.set("action", filters.action);
  if (filters.userId) p.set("userId", filters.userId);
  if (filters.search.trim()) p.set("search", filters.search.trim());
  if (extra) for (const [k, v] of Object.entries(extra)) p.set(k, v);
  return p;
}

async function fetchAuditPage(filters: Filters, cursor: string | null): Promise<{ rows: AuditLog[]; nextCursor: string | null }> {
  const params = buildParams(filters, cursor ? { cursor } : undefined);
  const res = await fetch(`/api/audit?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load audit log");
  return res.json();
}

async function fetchStats(): Promise<AuditStats> {
  const res = await fetch("/api/audit/stats");
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

export function AuditPageClient() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role ?? "Staff");
  const canExport = can(role, "exportAuditLog");
  const users = useUserStore((s) => s.users);

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["audit-stats"], queryFn: fetchStats });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } = useInfiniteQuery({
    queryKey: ["audit-logs", filters],
    queryFn: ({ pageParam }) => fetchAuditPage(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const rows = useMemo(() => data?.pages.flatMap((p) => p.rows) ?? [], [data]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = buildParams(filters);
      const res = await fetch(`/api/audit/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export");
      const allRows = (await res.json()) as AuditLog[];
      const data = allRows.map((r) => ({
        Timestamp: formatFullTimestamp(r.timestamp),
        User: r.userName,
        Role: r.userRole,
        Module: r.module,
        Action: r.action,
        "Entity Type": r.entityType,
        "Entity ID": r.entityId ?? "",
        "Entity Name": r.entityName ?? "",
        Summary: r.summary,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${allRows.length} audit log entries`);
    } catch {
      toast.error("Failed to export audit log");
    } finally {
      setExporting(false);
    }
  }

  function entityHref(log: AuditLog): string | null {
    const base = ENTITY_LINKS[log.entityType];
    return base && log.entityId ? base : null;
  }

  const inputClass =
    "bg-white border border-border rounded-lg py-2 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors";
  const thClass = "px-4 py-3 text-xs uppercase tracking-wider text-text-muted font-normal text-left";
  const tdClass = "px-4 py-3 text-sm align-top";

  if (statsLoading && isLoading) return <AuditPageSkeleton />;

  return (
    <div>
      <h1 className="text-3xl font-light text-text-primary">Audit Log</h1>
      <p className="text-sm text-text-secondary mt-1">Complete activity trail across all modules</p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-6">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="text-xs uppercase tracking-wider text-text-muted">Total events</div>
          <div className="text-2xl font-light text-text-primary mt-1"><Num>{stats?.total ?? 0}</Num></div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="text-xs uppercase tracking-wider text-text-muted">Today</div>
          <div className="text-2xl font-light text-brand-blue mt-1"><Num>{stats?.today ?? 0}</Num></div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="text-xs uppercase tracking-wider text-text-muted">This week</div>
          <div className="text-2xl font-light text-text-primary mt-1"><Num>{stats?.thisWeek ?? 0}</Num></div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="text-xs uppercase tracking-wider text-text-muted">Modules active</div>
          <div className="text-2xl font-light text-text-primary mt-1"><Num>{stats?.modulesActiveToday ?? 0}</Num></div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4 flex items-center gap-3 flex-wrap">
        <input type="date" value={filters.from} onChange={(e) => updateFilter("from", e.target.value)} className={inputClass} aria-label="From date" />
        <input type="date" value={filters.to} onChange={(e) => updateFilter("to", e.target.value)} className={inputClass} aria-label="To date" />
        <select value={filters.module} onChange={(e) => updateFilter("module", e.target.value as AuditModule | "")} className={inputClass}>
          <option value="">All modules</option>
          {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filters.action} onChange={(e) => updateFilter("action", e.target.value as AuditAction | "")} className={inputClass}>
          <option value="">All actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filters.userId} onChange={(e) => updateFilter("userId", e.target.value)} className={inputClass}>
          <option value="">All users</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>)}
        </select>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search summary, entity, user..."
            className={`${inputClass} w-64 pl-9`}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {canExport && (
            <Button variant="secondary" icon={Download} onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          )}
          <IconButton icon={RefreshCw} ariaLabel="Refresh" onClick={() => refetch()} className={isRefetching ? "animate-spin" : ""} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-surface-alt">
                <th className={thClass}>Timestamp</th>
                <th className={thClass}>User</th>
                <th className={thClass}>Module</th>
                <th className={thClass}>Action</th>
                <th className={thClass}>Summary</th>
                <th className={thClass}>Entity</th>
                <th className={`${thClass} text-right`}>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center text-text-muted py-12">
                    No activity found for the selected filters
                  </td>
                </tr>
              ) : (
                rows.map((log) => {
                  const action = actionMeta[log.action];
                  const href = entityHref(log);
                  return (
                    <tr key={log.id} className="border-t border-border hover:bg-[#F9FAFB]/60">
                      <td className={tdClass} title={formatFullTimestamp(log.timestamp)}>
                        <Num className="text-xs text-text-secondary">{formatShortTimestamp(log.timestamp)}</Num>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          <Avatar name={log.userName} size="xs" />
                          <div>
                            <div className="text-sm text-text-primary">{log.userName}</div>
                            <RoleBadge role={log.userRole} />
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <span
                          className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: moduleColors[log.module] + "18", color: moduleColors[log.module] }}
                        >
                          {log.module}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <span className="flex items-center gap-1.5 text-sm whitespace-nowrap" style={{ color: action.color }}>
                          <action.icon size={14} /> {log.action}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <div className="text-sm text-text-primary truncate max-w-[280px]" title={log.summary}>
                          {log.summary}
                        </div>
                      </td>
                      <td className={tdClass}>
                        {href ? (
                          <button onClick={() => router.push(href)} className="text-sm text-brand-blue underline">
                            {log.entityName || log.entityType}
                          </button>
                        ) : (
                          <span className="text-sm text-text-secondary">{log.entityName || "—"}</span>
                        )}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <IconButton icon={ChevronRight} ariaLabel="View details" onClick={() => setSelectedLog(log)} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {hasNextPage && (
          <div className="p-4 border-t border-border flex justify-center">
            <Button variant="secondary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </div>

      <AuditDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
