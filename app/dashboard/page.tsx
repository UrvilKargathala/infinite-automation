"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Ticket as TicketIcon, AlertTriangle, FileText, CheckCircle2, TrendingUp, TrendingDown, Plus,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { useTicketStore } from "@/lib/store/useTicketStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useProductStore } from "@/lib/store/useProductStore";
import { IconTile } from "@/components/ui/IconTile";
import { Button } from "@/components/ui/Button";
import { INR } from "@/components/ui/INR";
import { Num } from "@/components/ui/Num";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { QuoteExpiryAlerts } from "@/components/dashboard/QuoteExpiryAlerts";
import { TeamWorkload } from "@/components/dashboard/TeamWorkload";
import { ProjectsByStage } from "@/components/dashboard/ProjectsByStage";
import { AiSummary } from "@/components/dashboard/AiSummary";
import { computeMonthlyMetrics, computeMonthlySeries } from "@/lib/utils/dashboardMetrics";
import { timeAgo } from "@/lib/utils/timeAgo";

const CHART_COLORS = ["#3A90C3", "#44BE4A", "#8B5CF6", "#F59E0B", "#EF4444", "#64748B"];
const CATEGORY_COLORS: Record<string, string> = {
  Installation: "#3A90C3",
  Repair: "#EF4444",
  Maintenance: "#F59E0B",
  General: "#64748B",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-dropdown p-3 text-xs text-text-primary" style={{ border: "none" }}>
      <div className="text-text-muted mb-1">{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}: {entry.name === "Revenue" ? <INR value={entry.value} /> : <Num>{entry.value}</Num>}</span>
        </div>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-dropdown p-3 text-xs text-text-primary" style={{ border: "none" }}>
      <div className="text-text-muted mb-1">{label}</div>
      <div><Num>{payload[0].value}</Num> tickets</div>
    </div>
  );
}

export default function DashboardPage() {
  const tickets = useTicketStore((s) => s.tickets);
  const projects = useProjectStore((s) => s.projects);
  const quotes = useQuoteStore((s) => s.quotes);
  const products = useProductStore((s) => s.products);
  const ticketsLoaded = useTicketStore((s) => s.loaded);
  const projectsLoaded = useProjectStore((s) => s.loaded);
  const quotesLoaded = useQuoteStore((s) => s.loaded);
  const productsLoaded = useProductStore((s) => s.loaded);
  const loading = !ticketsLoaded || !projectsLoaded || !quotesLoaded || !productsLoaded;

  const metrics = useMemo(() => computeMonthlyMetrics(tickets, quotes), [tickets, quotes]);
  const openCount = metrics.openTickets.length;
  const urgentCount = metrics.urgentTickets.length;
  const activeQuotes = useMemo(
    () => quotes.filter((q) => q.status === "Draft" || q.status === "Sent").length,
    [quotes]
  );
  const resolvedThisMonthCount = metrics.resolvedThisMonth.length;

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    metrics.openTickets.forEach((t) => { map[t.category] = (map[t.category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [metrics.openTickets]);

  const statusData = useMemo(() => {
    const statuses = ["Open", "In Progress", "On Hold", "Resolved", "Closed"];
    return statuses.map((status) => ({
      status,
      count: tickets.filter((t) => t.status === status).length,
    }));
  }, [tickets]);

  const chartData = useMemo(() => computeMonthlySeries(quotes), [quotes]);
  const activity = useMemo(() => {
    const ticketEvents = tickets.map((t) => ({
      text: t.status === "Resolved" ? `${t.subject} resolved` : t.status === "Closed" ? `${t.subject} closed` : `${t.subject} — ${t.status}`,
      color: t.status === "Resolved" ? "#10B981" : t.status === "Closed" ? "#64748B" : "#3A90C3",
      date: t.lastContact,
    }));
    const quoteEvents = quotes.map((q) => ({
      text: `Quote ${q.number} for ${q.client} — ${q.status}`,
      color: q.status === "Accepted" ? "#10B981" : q.status === "Rejected" ? "#EF4444" : "#94A3B8",
      date: q.date,
    }));
    return [...ticketEvents, ...quoteEvents]
      .filter((e) => e.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 4);
  }, [tickets, quotes]);

  const pctLabel = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);
  const countLabel = (v: number) => (v > 0 ? `+${v}` : `${v}`);

  const kpis = [
    { label: "Open Tickets", value: <Num>{openCount}</Num>, delta: countLabel(metrics.openDeltaCount), up: metrics.openDeltaCount >= 0, icon: TicketIcon, bg: "bg-[#3A90C318]", accent: "#3A90C3" },
    { label: "Urgent Tickets", value: <Num>{urgentCount}</Num>, delta: countLabel(metrics.urgentDeltaCount), up: metrics.urgentDeltaCount <= 0, icon: AlertTriangle, bg: "bg-[#EF444418]", accent: "#EF4444" },
    { label: "Active Quotes", value: <Num>{activeQuotes}</Num>, delta: countLabel(metrics.activeQuotesDeltaCount), up: metrics.activeQuotesDeltaCount >= 0, icon: FileText, bg: "bg-[#44BE4A18]", accent: "#44BE4A" },
    { label: "Resolved This Month", value: <Num>{resolvedThisMonthCount}</Num>, delta: pctLabel(metrics.resolvedDeltaPct), up: (metrics.resolvedDeltaPct ?? 0) >= 0, icon: CheckCircle2, bg: "bg-[#F59E0B18]", accent: "#F59E0B" },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">Overview of your business operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tickets?new=1">
            <Button variant="secondary" icon={TicketIcon}>New ticket</Button>
          </Link>
          <Link href="/quote?new=1">
            <Button icon={Plus}>New quote</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <AiSummary tickets={tickets} quotes={quotes} products={products} />
      </div>

      {/* Row 1 — KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-2xl shadow-card backdrop-blur-xl border border-white/40 p-5 flex items-start justify-between ${k.bg}`} style={{ borderLeft: `3px solid ${k.accent}` }}>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted">{k.label}</div>
              <div className="text-2xl font-light text-text-primary mt-1">{k.value}</div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                {k.up ? (
                  <TrendingUp size={14} className="text-success" />
                ) : (
                  <TrendingDown size={14} className="text-danger" />
                )}
                <Num className={k.up ? "text-success" : "text-danger"}>{k.delta}</Num>
                <span className="text-text-muted">vs last month</span>
              </div>
            </div>
            <IconTile icon={k.icon} />
          </div>
        ))}
      </div>

      {/* Row 2 — Line chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-text-primary">Quotes and revenue</h2>
            <span className="text-xs text-text-muted">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "#94A3B8", fontSize: 12, fontFamily: "var(--font-montserrat), ui-monospace, system-ui, sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94A3B8", fontSize: 12, fontFamily: "var(--font-montserrat), ui-monospace, system-ui, sans-serif" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}L`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#64748B" }} iconType="circle" />
              <Line yAxisId="left" type="monotone" dataKey="quotes" name="Quotes" stroke="#3A90C3" strokeWidth={2.5} dot={{ r: 4, fill: "#3A90C3" }} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#44BE4A" strokeWidth={2.5} dot={{ r: 4, fill: "#44BE4A" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
          <h2 className="text-lg text-text-primary mb-4">Open tickets by category</h2>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                {categoryData.map((entry, i) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0];
                  return (
                    <div className="bg-white rounded-xl shadow-dropdown p-3 text-xs text-text-primary" style={{ border: "none" }}>
                      <div>{String(d.name)}: <Num>{d.value as number}</Num></div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.name] || "#64748B" }} />
                  <span className="text-xs text-text-secondary">{c.name}</span>
                </div>
                <Num className="text-xs">{c.value}</Num>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 — Bar chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
          <h2 className="text-lg text-text-primary mb-4">Tickets by status</h2>
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="status" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 12, fontFamily: "var(--font-montserrat), ui-monospace, system-ui, sans-serif" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="count" fill="#3A90C3" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
          <h2 className="text-lg text-text-primary mb-4">Recent activity</h2>
          {activity.length === 0 ? (
            <div className="text-sm text-text-muted text-center py-6">No activity yet</div>
          ) : (
            <div className="space-y-4">
              {activity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: a.color }} />
                  <div>
                    <div className="text-sm text-text-primary">{a.text}</div>
                    <div className="text-xs text-text-muted mt-0.5">{timeAgo(a.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4 — Quote expiry alerts + Team workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <QuoteExpiryAlerts quotes={quotes} />
        <TeamWorkload tickets={tickets} />
      </div>

      {/* Row 5 — Projects by stage */}
      <div className="mt-4">
        <ProjectsByStage projects={projects} />
      </div>
    </div>
  );
}
