"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Ban, CheckCircle2, Clock, MessageSquareWarning, Plus, Search } from "lucide-react";
import { CrmTabs } from "@/components/layout/CrmTabs";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TablePageSkeleton } from "@/components/ui/TablePageSkeleton";
import { ComplaintModal } from "./ComplaintModal";
import { ComplaintPanel } from "./ComplaintPanel";
import { useComplaints } from "@/lib/hooks/useComplaints";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { AGE_TONE_CLASS, COMPLAINT_STATUS_COLOR, complaintAge } from "@/lib/utils/complaints";
import { can } from "@/lib/utils/permissions";
import type { Complaint, ComplaintStatus } from "@/types";
import { StatCard } from "@/components/ui/StatCard";

const FILTERS: { key: ComplaintStatus | "All"; label: string }[] = [
  { key: "All", label: "All" },
  { key: "Pending", label: "Pending" },
  { key: "Completed", label: "Completed" },
  { key: "Cancelled", label: "Cancelled" },
];

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

export function ComplaintsPageClient() {
  const me = useAuthStore((s) => s.user);
  const isAdmin = !!me && can(me.role, "manageComplaints");
  const { complaints, isLoading } = useComplaints();
  const [status, setStatus] = useState<ComplaintStatus | "All">("Pending");
  const [search, setSearch] = useState("");
  const [engineer, setEngineer] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [modal, setModal] = useState<{ open: boolean; complaint: Complaint | null }>({ open: false, complaint: null });

  // Notifications link here as /complaints?open=<id> — watched so it also works when already on this page.
  const searchParams = useSearchParams();
  // ?new=1 (Dashboard "New complaint") opens the form for admins.
  useEffect(() => {
    const id = Number(searchParams.get("open"));
    if (id) {
      setOpenId(id);
      setStatus("All");
    } else if (searchParams.get("new") === "1" && isAdmin) {
      setModal({ open: true, complaint: null });
    } else return;
    window.history.replaceState(null, "", "/complaints");
  }, [searchParams, isAdmin]);

  const engineers = useMemo(
    () => [...new Map(complaints.filter((c) => c.engineerId).map((c) => [c.engineerId, c.engineerName ?? ""])).entries()],
    [complaints]
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter(
      (c) =>
        // "All" is the live list — cancelled complaints have their own tab.
        (status === "All" ? c.status !== "Cancelled" : c.status === status) &&
        (!engineer || String(c.engineerId) === engineer) &&
        (!q || [c.number, c.customerName, c.phone, c.siteAddress, c.remarks].some((v) => v.toLowerCase().includes(q)))
    );
  }, [complaints, status, engineer, search]);

  const pending = complaints.filter((c) => c.status === "Pending").length;
  const completed = complaints.filter((c) => c.status === "Completed").length;
  const cancelled = complaints.filter((c) => c.status === "Cancelled").length;
  const open = complaints.find((c) => c.id === openId) ?? null;

  if (isLoading || !me) return <TablePageSkeleton statCards={4} />;

  // Each card is also a shortcut to its tab. Total leaves out cancelled ones.
  const tiles: { label: string; value: number; icon: typeof Clock; filter: ComplaintStatus | "All" }[] = [
    { label: "Pending", value: pending, icon: Clock, filter: "Pending" },
    { label: "Completed", value: completed, icon: CheckCircle2, filter: "Completed" },
    { label: "Cancelled", value: cancelled, icon: Ban, filter: "Cancelled" },
    { label: isAdmin ? "Total complaints" : "Assigned to you", value: pending + completed, icon: MessageSquareWarning, filter: "All" },
  ];
  const control = "glass-control border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors";

  return (
    <div>
      <CrmTabs />
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-normal text-text-primary">Complaints</h1>
          <p className="text-sm text-text-secondary mt-1">
            {isAdmin ? "Raise a complaint, assign an engineer, and track it to completion" : "Complaints assigned to you — mark them completed when fixed"}
          </p>
        </div>
        {isAdmin && <Button icon={Plus} onClick={() => setModal({ open: true, complaint: null })}>New complaint</Button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
        {tiles.map(({ label, value, icon, filter }) => (
          <StatCard key={label} label={label} value={value} icon={icon} active={status === filter} onClick={() => setStatus(filter)} />
        ))}
      </div>

      <div className="glass rounded-3xl overflow-hidden mt-6">
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="inline-flex gap-1 p-1 rounded-full bg-white/50 border border-white/70">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-sm transition-colors ${status === f.key ? "bg-white shadow-card text-text-primary" : "text-text-secondary hover:text-text-primary"}`}
              >
                {f.label}
                {f.key === "Pending" && pending > 0 && <span className="ml-1.5 text-xs text-warning font-numeric">{pending}</span>}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 pointer-events-none text-text-secondary" />
            <input className={`${control} w-full pl-9`} placeholder="Search name, phone, remarks…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {isAdmin && engineers.length > 1 && (
            <Select className={control} value={engineer} onChange={(e) => setEngineer(e.target.value)}>
              <option value="">All engineers</option>
              {engineers.map(([id, name]) => <option key={String(id)} value={String(id)}>{name}</option>)}
            </Select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-white/35 text-left text-xs uppercase tracking-wider text-text-muted">
                {["No.", "Name", "Phone Number", "Remarks", "Engineer", "Status", "Raised"].map((h) => (
                  <th key={h} className="px-4 py-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-text-muted py-14 text-sm">
                  {complaints.length === 0
                    ? isAdmin ? "No complaints yet — raise the first one with “New complaint”." : "Nothing assigned to you yet."
                    : status === "Pending" && !search.trim() && !engineer ? "No pending complaints 🎉"
                    : status === "Cancelled" && !search.trim() && !engineer ? "No cancelled complaints."
                    : "No complaints match these filters."}
                </td></tr>
              ) : rows.map((c) => (
                <tr key={c.id} onClick={() => setOpenId(c.id)} className="border-t border-border/60 hover:bg-white/50 cursor-pointer transition-colors text-sm">
                  <td className="px-4 py-3 font-numeric tabular-nums text-xs text-brand-blue">{c.number}</td>
                  <td className="px-4 py-3 text-text-primary">
                    {c.customerName}
                    {c.siteAddress && <div className="text-xs text-text-muted font-normal max-w-[220px] truncate" title={c.siteAddress}>{c.siteAddress}</div>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary font-numeric tabular-nums">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-text-secondary max-w-[280px] truncate" title={c.remarks}>{c.remarks}</td>
                  <td className="px-4 py-3">
                    {c.engineerName ? <span className="inline-flex items-center gap-2 text-text-primary"><Avatar name={c.engineerName} size="xs" />{c.engineerName}</span> : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3"><Badge color={COMPLAINT_STATUS_COLOR[c.status]}>{c.status}</Badge></td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {shortDate(c.createdAt)}
                    {(() => { const age = complaintAge(c); return age && <div className={AGE_TONE_CLASS[age.tone]}>{age.label}</div>; })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ComplaintPanel complaint={open} onClose={() => setOpenId(null)} onEdit={(c) => setModal({ open: true, complaint: c })} />
      <ComplaintModal open={modal.open} complaint={modal.complaint} onClose={() => setModal({ open: false, complaint: null })} />
    </div>
  );
}
