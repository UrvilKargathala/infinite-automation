import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Num } from "@/components/ui/Num";

/**
 * The app's KPI / stat card. Plain glass at rest; hover (or keyboard focus) fades in the brand gradient and turns
 * everything white. Used by the Dashboard KPI row and every page's stat row.
 *
 * Children rendered in `footer` can use `group-hover:` / `group-focus-visible:` to switch to white too.
 */
export function StatCard({ label, value, icon: Icon, href, onClick, active, valueClass, footer }: {
  label: string;
  /** A number is wrapped in <Num>; pass a node for anything else. */
  value: React.ReactNode;
  /** Icon tile beside the title. */
  icon?: LucideIcon;
  /** Makes the whole card a link. */
  href?: string;
  /** Makes the whole card a button (e.g. to filter the table below it). */
  onClick?: () => void;
  /** Marks the card as the current filter: keeps the hover fill on. */
  active?: boolean;
  /** Tint for the number at rest (e.g. text-success) — white on hover like the rest. */
  valueClass?: string;
  footer?: React.ReactNode;
}) {
  const body = (
    <>
      {/* Gradients can't transition, so the fill is its own layer that fades in. */}
      <span aria-hidden className="absolute inset-0 -z-10 bg-brand-gradient-diag opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-brand-gradient text-white shadow-icon transition-colors group-hover:bg-white group-hover:bg-none group-hover:text-brand-blue group-focus-visible:bg-white group-focus-visible:bg-none group-focus-visible:text-brand-blue">
              <Icon size={19} strokeWidth={1.75} />
            </span>
          )}
          <span className="text-base leading-snug">{label}</span>
        </div>
      </div>
      <div className={`text-4xl mt-4 transition-colors ${valueClass ?? ""} group-hover:text-white group-focus-visible:text-white`}>
        {typeof value === "number" ? <Num>{value}</Num> : value}
      </div>
      {footer}
    </>
  );

  const cls = "group lift glass relative isolate overflow-hidden rounded-3xl p-5 text-text-primary transition-colors hover:text-white";
  if (href) return <Link href={href} className={`${cls} focus-visible:text-white focus-visible:outline-none`}>{body}</Link>;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={`${cls} w-full text-left focus-visible:text-white focus-visible:outline-none ${active ? "ring-2 ring-brand-blue/50" : ""}`}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}
