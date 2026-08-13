"use client";

import { useMemo } from "react";
import {
  DollarSign, Users, FileText, TrendingUp, TrendingDown,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { useLeadStore } from "@/lib/store/useLeadStore";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useProductStore } from "@/lib/store/useProductStore";
import { IconTile } from "@/components/ui/IconTile";
import { formatINR } from "@/lib/utils/format";
import { calcQuoteTotal } from "@/lib/utils/quote";
import type { Quote } from "@/types";

const CHART_COLORS = ["#3A90C3", "#44BE4A", "#8B5CF6", "#F59E0B", "#EF4444", "#64748B"];
const SEGMENT_COLORS: Record<string, string> = {
  Residential: "#3A90C3",
  Commercial: "#44BE4A",
  "Short Term Rentals": "#8B5CF6",
  Agriculture: "#F59E0B",
};

const MONTHS_DATA = [
  { month: "Mar", quotes: 8, revenue: 420000 },
  { month: "Apr", quotes: 12, revenue: 580000 },
  { month: "May", quotes: 10, revenue: 510000 },
  { month: "Jun", quotes: 15, revenue: 720000 },
  { month: "Jul", quotes: 18, revenue: 890000 },
  { month: "Aug", quotes: 22, revenue: 1050000 },
];

const ACTIVITIES = [
  { text: "New quote sent to Chen Holdings", color: "#44BE4A", time: "2h ago" },
  { text: "Kapoor Villas quote accepted", color: "#10B981", time: "5h ago" },
  { text: "New lead: Wilson Farms", color: "#3A90C3", time: "1d ago" },
  { text: "Product catalog updated", color: "#94A3B8", time: "2d ago" },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-dropdown p-3 text-xs text-text-primary" style={{ border: "none" }}>
      <div className="text-text-muted mb-1">{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}: {entry.name === "Revenue" ? formatINR(entry.value) : entry.value}</span>
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
      <div>{payload[0].value} leads</div>
    </div>
  );
}

export default function DashboardPage() {
  const leads = useLeadStore((s) => s.leads);
  const quotes = useQuoteStore((s) => s.quotes);

  const pipelineRevenue = useMemo(
    () => leads.filter((l) => l.stage !== "Won" && l.stage !== "Lost").reduce((s, l) => s + l.value, 0),
    [leads]
  );
  const activeLeads = useMemo(
    () => leads.filter((l) => l.stage !== "Won" && l.stage !== "Lost").length,
    [leads]
  );
  const activeQuotes = useMemo(
    () => quotes.filter((q) => q.status === "Draft" || q.status === "Sent").length,
    [quotes]
  );
  const wonValue = useMemo(
    () => leads.filter((l) => l.stage === "Won").reduce((s, l) => s + l.value, 0),
    [leads]
  );

  const segmentData = useMemo(() => {
    const map: Record<string, number> = {};
    leads
      .filter((l) => l.stage !== "Won" && l.stage !== "Lost")
      .forEach((l) => { map[l.segment] = (map[l.segment] || 0) + l.value; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const stageData = useMemo(() => {
    const stages = ["New", "Qualified", "Quoted", "Won", "Lost"];
    return stages.map((stage) => ({
      stage,
      count: leads.filter((l) => l.stage === stage).length,
    }));
  }, [leads]);

  const kpis = [
    { label: "Revenue Pipeline", value: formatINR(pipelineRevenue), delta: "+18.2%", up: true, icon: DollarSign, bg: "bg-[#3A90C308]", accent: "#3A90C3" },
    { label: "Active Leads", value: activeLeads, delta: "+3", up: true, icon: Users, bg: "bg-[#8B5CF608]", accent: "#8B5CF6" },
    { label: "Active Quotes", value: activeQuotes, delta: "+2", up: true, icon: FileText, bg: "bg-[#44BE4A08]", accent: "#44BE4A" },
    { label: "Won This Month", value: formatINR(wonValue), delta: "-4.1%", up: false, icon: TrendingUp, bg: "bg-[#F59E0B08]", accent: "#F59E0B" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-light text-text-primary">Dashboard</h1>
      <p className="text-sm text-text-secondary mt-1">Overview of your business operations</p>

      {/* Row 1 — KPI cards */}
      <div className="grid grid-cols-4 gap-4 mt-8 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-2xl shadow-card p-5 flex items-start justify-between ${k.bg}`} style={{ borderLeft: `3px solid ${k.accent}` }}>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted">{k.label}</div>
              <div className="text-3xl font-light text-text-primary mt-1">{k.value}</div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                {k.up ? (
                  <TrendingUp size={14} className="text-success" />
                ) : (
                  <TrendingDown size={14} className="text-danger" />
                )}
                <span className={k.up ? "text-success" : "text-danger"}>{k.delta}</span>
                <span className="text-text-muted">vs last month</span>
              </div>
            </div>
            <IconTile icon={k.icon} />
          </div>
        ))}
      </div>

      {/* Row 2 — Line chart + Donut */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-text-primary">Quotes and revenue</h2>
            <span className="text-xs text-text-muted">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={MONTHS_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}L`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#64748B" }} iconType="circle" />
              <Line yAxisId="left" type="monotone" dataKey="quotes" name="Quotes" stroke="#3A90C3" strokeWidth={2.5} dot={{ r: 4, fill: "#3A90C3" }} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#44BE4A" strokeWidth={2.5} dot={{ r: 4, fill: "#44BE4A" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-1 bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg text-text-primary mb-4">Pipeline by segment</h2>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={segmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                {segmentData.map((entry, i) => (
                  <Cell key={entry.name} fill={SEGMENT_COLORS[entry.name] || CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0];
                  return (
                    <div className="bg-white rounded-xl shadow-dropdown p-3 text-xs text-text-primary" style={{ border: "none" }}>
                      <div>{String(d.name)}: {formatINR(d.value as number)}</div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {segmentData.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[s.name] || "#64748B" }} />
                  <span className="text-xs text-text-secondary">{s.name}</span>
                </div>
                <span className="text-xs text-text-primary">{formatINR(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 — Bar chart + Activity */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg text-text-primary mb-4">Leads by stage</h2>
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="stage" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="count" fill="#3A90C3" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-1 bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg text-text-primary mb-4">Recent activity</h2>
          <div className="space-y-4">
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: a.color }} />
                <div>
                  <div className="text-sm text-text-primary">{a.text}</div>
                  <div className="text-xs text-text-muted mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
