import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Price } from "@/components/ui/Price";
import { Num } from "@/components/ui/Num";
import { AXIS_TEXT, AXIS_NUM, hatchPattern, brandGradient, compactINR, ChartTooltipBox, LegendSwatch } from "./chartBits";

interface Point { month: string; quotes: number; revenue: number; pipeline: number }

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: Point }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <ChartTooltipBox>
      <div className="text-text-muted mb-1">{label}</div>
      <div>Accepted: <Price value={Math.round(p.revenue)} currency="INR" /></div>
      <div>Pipeline: <Price value={Math.round(p.pipeline)} currency="INR" /></div>
      <div className="text-text-muted mt-1"><Num>{p.quotes}</Num> quotes created</div>
    </ChartTooltipBox>
  );
}

/** Hero chart — accepted revenue (solid gradient) next to open pipeline (hatched), last 6 months. */
export function RevenueOverview({ data }: { data: Point[] }) {
  const accepted = Math.round(data.reduce((s, d) => s + d.revenue, 0));
  const pipeline = Math.round(data.reduce((s, d) => s + d.pipeline, 0));

  return (
    <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg text-text-primary">Revenue overview</h2>
          <p className="text-xs text-text-muted mt-0.5">Accepted vs open pipeline · last 6 months</p>
        </div>
        <div className="flex items-center gap-4">
          <LegendSwatch kind="solid" label="Accepted" />
          <LegendSwatch kind="hatch" label="Pipeline" />
        </div>
      </div>

      <div className="flex items-end gap-6 mt-4 flex-wrap">
        <div>
          <div className="text-xs text-text-muted">Accepted</div>
          <Price value={accepted} currency="INR" className="text-3xl text-text-primary" />
        </div>
        <div>
          <div className="text-xs text-text-muted">Open pipeline</div>
          <Price value={pipeline} currency="INR" className="text-xl text-text-secondary" />
        </div>
      </div>

      <div className="mt-4">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4} barCategoryGap="18%">
            <defs>
              {brandGradient("revAccepted")}
              {hatchPattern("revPipeline")}
            </defs>
            <CartesianGrid vertical={false} stroke="#EEF2F6" />
            <XAxis dataKey="month" tick={AXIS_TEXT} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_NUM} axisLine={false} tickLine={false} tickFormatter={compactINR} width={44} />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: "#3A90C30D", radius: 12 }} />
            <Bar dataKey="revenue" name="Accepted" fill="url(#revAccepted)" radius={10} maxBarSize={36} />
            <Bar dataKey="pipeline" name="Pipeline" fill="url(#revPipeline)" radius={10} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
