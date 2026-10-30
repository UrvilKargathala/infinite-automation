import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Price } from "@/components/ui/Price";
import { Num } from "@/components/ui/Num";
import { AXIS_TEXT, AXIS_NUM, hatchPattern, brandGradient, ChartTooltipBox, LegendSwatch } from "./chartBits";
import { formatCompact, type CurrencyCode } from "@/lib/utils/currency";

interface Point { month: string; quotes: number; revenue: number; pipeline: number }

function RevenueTooltip({ active, payload, label, currency = "INR" }: { active?: boolean; payload?: Array<{ payload: Point }>; label?: string; currency?: CurrencyCode }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <ChartTooltipBox>
      <div className="text-text-muted mb-1">{label}</div>
      <div>Accepted: <Price value={Math.round(p.revenue)} currency={currency} /></div>
      <div>Pipeline: <Price value={Math.round(p.pipeline)} currency={currency} /></div>
      <div className="text-text-muted mt-1"><Num>{p.quotes}</Num> quotes created</div>
    </ChartTooltipBox>
  );
}

/** Hero chart — accepted revenue (solid gradient) next to open pipeline (hatched), last 6 months, for quotes in the user's currency. */
export function RevenueOverview({ data, currency }: { data: Point[]; currency: CurrencyCode }) {
  const accepted = Math.round(data.reduce((s, d) => s + d.revenue, 0));
  const pipeline = Math.round(data.reduce((s, d) => s + d.pipeline, 0));

  return (
    <div className="lg:col-span-2 glass lift rounded-3xl p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg text-text-primary">Revenue overview</h2>
          <p className="text-xs text-text-muted mt-0.5">Accepted vs open pipeline · last 6 months · {currency} quotes</p>
        </div>
        <div className="flex items-center gap-4">
          <LegendSwatch kind="solid" label="Accepted" />
          <LegendSwatch kind="hatch" label="Pipeline" />
        </div>
      </div>

      <div className="flex items-end gap-6 mt-4 flex-wrap">
        <div>
          <div className="text-xs text-text-muted">Accepted</div>
          <Price value={accepted} currency={currency} className="text-3xl text-text-primary" />
        </div>
        <div>
          <div className="text-xs text-text-muted">Open pipeline</div>
          <Price value={pipeline} currency={currency} className="text-xl text-text-secondary" />
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
            <YAxis tick={AXIS_NUM} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCompact(v, currency)} width={44} />
            <Tooltip content={<RevenueTooltip currency={currency} />} cursor={{ fill: "#3A90C30D", radius: 12 }} />
            <Bar dataKey="revenue" name="Accepted" fill="url(#revAccepted)" radius={10} maxBarSize={36} />
            <Bar dataKey="pipeline" name="Pipeline" fill="url(#revPipeline)" radius={10} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
