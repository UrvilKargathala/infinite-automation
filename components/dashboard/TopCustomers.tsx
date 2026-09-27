import { Avatar } from "@/components/ui/Avatar";
import { Price } from "@/components/ui/Price";
import { Num } from "@/components/ui/Num";
import type { Customer } from "@/types";

interface Entry {
  customer: Customer;
  revenue: number;
  ticketCount: number;
}

export function TopCustomers({ entries, totalCustomers, inactiveCount }: { entries: Entry[]; totalCustomers: number; inactiveCount: number }) {
  const maxRevenue = entries[0]?.revenue ?? 1;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-text-primary">Top customers</h2>
        <span className="text-xs text-text-muted">
          <Num>{totalCustomers}</Num> total{inactiveCount > 0 ? <> · <Num>{inactiveCount}</Num> with no activity yet</> : null}
        </span>
      </div>
      {entries.length === 0 ? (
        <div className="text-center text-text-muted text-sm py-8">No accepted quotes linked to a customer yet</div>
      ) : (
        <div className="space-y-4">
          {entries.map(({ customer, revenue, ticketCount }, i) => (
            <div key={customer.id} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-4 shrink-0"><Num>{i + 1}</Num></span>
              <Avatar name={customer.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-text-primary truncate">{customer.name}</span>
                  <Price value={revenue} currency="INR" className="text-xs shrink-0" />
                </div>
                <div className="h-1.5 rounded-full bg-surface-alt mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-gradient"
                    style={{ width: `${Math.max(6, (revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {customer.segment} · <Num>{ticketCount}</Num> ticket{ticketCount === 1 ? "" : "s"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
