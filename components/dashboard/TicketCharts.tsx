import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie } from "recharts";
import { Num } from "@/components/ui/Num";
import { AXIS_TEXT, AXIS_NUM, hatchPattern, brandGradient, ChartTooltipBox, LegendSwatch } from "./chartBits";
import type { Ticket } from "@/types";

const STATUSES = ["Open", "In Progress", "On Hold", "Resolved", "Closed"] as const;
const DONE = new Set(["Resolved", "Closed"]);
const CATEGORY_COLORS: Record<string, string> = {
  Installation: "#3A90C3", Repair: "#EF4444", Maintenance: "#F59E0B", General: "#64748B",
};
const cardClass = "bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6";

/** Pill bars per status — active work solid, finished work hatched. */
export function TicketsByStatus({ tickets }: { tickets: Ticket[] }) {
  const data = STATUSES.map((status) => ({ status, count: tickets.filter((t) => t.status === status).length }));

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h2 className="text-lg text-text-primary">Tickets by status</h2>
        <div className="flex items-center gap-3">
          <LegendSwatch kind="solid" label="Active" />
          <LegendSwatch kind="hatch" label="Done" />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220} className="mt-4">
        <BarChart data={data} barCategoryGap="22%">
          <defs>
            {brandGradient("statusActive")}
            {hatchPattern("statusDone")}
          </defs>
          <XAxis dataKey="status" tick={{ ...AXIS_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
          <YAxis hide allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "#3A90C30D", radius: 12 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <ChartTooltipBox>
                  <div className="text-text-muted mb-1">{label}</div>
                  <div><Num>{payload[0].value as number}</Num> tickets</div>
                </ChartTooltipBox>
              ) : null
            }
          />
          <Bar dataKey="count" radius={999} maxBarSize={44} label={{ position: "top", ...AXIS_NUM, fill: "#64748B" }}>
            {data.map((d) => <Cell key={d.status} fill={DONE.has(d.status) ? "url(#statusDone)" : "url(#statusActive)"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut of open tickets by category. */
export function TicketsByCategory({ openTickets }: { openTickets: Ticket[] }) {
  const map: Record<string, number> = {};
  openTickets.forEach((t) => { map[t.category] = (map[t.category] || 0) + 1; });
  const data = Object.entries(map).map(([name, value]) => ({ name, value }));

  return (
    <div className={cardClass}>
      <h2 className="text-lg text-text-primary">Open tickets by category</h2>
      {data.length === 0 ? (
        <div className="text-center text-text-muted text-sm py-10">No open tickets</div>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} cornerRadius={6} stroke="none">
                  {data.map((d) => <Cell key={d.name} fill={CATEGORY_COLORS[d.name] ?? "#64748B"} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <Num className="text-2xl text-text-primary">{openTickets.length}</Num>
              <span className="text-xs text-text-muted">open</span>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {data.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.name] ?? "#64748B" }} />
                  <span className="text-xs text-text-secondary">{c.name}</span>
                </div>
                <Num className="text-xs">{c.value}</Num>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
