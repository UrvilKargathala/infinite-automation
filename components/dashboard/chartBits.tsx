/** Shared SVG defs + axis styling for the dashboard's recharts cards. */

export const AXIS_TEXT = { fill: "#94A3B8", fontSize: 12 };
export const AXIS_NUM = { ...AXIS_TEXT, fontFamily: "var(--font-montserrat), ui-monospace, system-ui, sans-serif" };

/** Diagonal stripes — marks "not yet real" values (pipeline, pending, closed). Call inside a chart's <defs>. */
export function hatchPattern(id: string, stripe = "#CBD5E1", bg = "#F1F5F9") {
  return (
    <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="8" fill={bg} />
      <rect width="3" height="8" fill={stripe} />
    </pattern>
  );
}

/** Vertical brand gradient (blue top → green bottom) for bar fills. Call inside a chart's <defs>. */
export function brandGradient(id: string, horizontal = false) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={horizontal ? "1" : "0"} y2={horizontal ? "0" : "1"}>
      <stop offset="0%" stopColor="#3A90C3" />
      <stop offset="100%" stopColor="#44BE4A" />
    </linearGradient>
  );
}

/** ₹ axis ticks: 1.5L / 20k / 900. */
export function compactINR(v: number): string {
  if (v >= 100000) return `${+(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${+(v / 1000).toFixed(0)}k`;
  return `${v}`;
}

export function ChartTooltipBox({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl shadow-dropdown p-3 text-xs text-text-primary">{children}</div>;
}

export function LegendSwatch({ kind, label }: { kind: "solid" | "hatch"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
      <span
        className={`w-3 h-3 rounded-[4px] ${kind === "solid" ? "bg-brand-gradient-diag" : ""}`}
        style={kind === "hatch" ? { background: "repeating-linear-gradient(45deg, #CBD5E1 0 3px, #F1F5F9 3px 6px)" } : undefined}
      />
      {label}
    </span>
  );
}
