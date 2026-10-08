"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Ticket as TicketIcon, Plus } from "lucide-react";
import { useTicketStore } from "@/lib/store/useTicketStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useProductStore } from "@/lib/store/useProductStore";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { KpiCards, type Kpi } from "@/components/dashboard/KpiCards";
import { RevenueOverview } from "@/components/dashboard/RevenueOverview";
import { ProjectProgress } from "@/components/dashboard/ProjectProgress";
import { CurrencyPipeline } from "@/components/dashboard/CurrencyPipeline";
import { TicketsByStatus, TicketsByCategory } from "@/components/dashboard/TicketCharts";
import { QuoteExpiryAlerts } from "@/components/dashboard/QuoteExpiryAlerts";
import { TeamWorkload } from "@/components/dashboard/TeamWorkload";
import { ProjectsByStage } from "@/components/dashboard/ProjectsByStage";
import { RevenueBySegment } from "@/components/dashboard/RevenueBySegment";
import { TopCustomers } from "@/components/dashboard/TopCustomers";
import { AiSummary } from "@/components/dashboard/AiSummary";
import { computeMonthlyMetrics, computeMonthlySeries, computeRevenueBySegment, computeTopCustomers, countInactiveCustomers } from "@/lib/utils/dashboardMetrics";
import { useAuthStore } from "@/lib/store/useAuthStore";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName.split(" ")[0] ?? "";

  const tickets = useTicketStore((s) => s.tickets);
  const projects = useProjectStore((s) => s.projects);
  const quotes = useQuoteStore((s) => s.quotes);
  const products = useProductStore((s) => s.products);
  const customers = useCustomerStore((s) => s.customers);
  const ticketsLoaded = useTicketStore((s) => s.loaded);
  const projectsLoaded = useProjectStore((s) => s.loaded);
  const quotesLoaded = useQuoteStore((s) => s.loaded);
  const productsLoaded = useProductStore((s) => s.loaded);
  const customersLoaded = useCustomerStore((s) => s.loaded);
  const loading = !ticketsLoaded || !projectsLoaded || !quotesLoaded || !productsLoaded || !customersLoaded;

  const metrics = useMemo(() => computeMonthlyMetrics(tickets, quotes), [tickets, quotes]);
  const activeQuotes = useMemo(() => quotes.filter((q) => q.status === "Draft" || q.status === "Sent").length, [quotes]);
  const chartData = useMemo(() => computeMonthlySeries(quotes), [quotes]);
  const revenueBySegment = useMemo(() => computeRevenueBySegment(quotes, customers), [quotes, customers]);
  const topCustomers = useMemo(() => computeTopCustomers(quotes, tickets, customers), [quotes, tickets, customers]);
  const inactiveCustomers = useMemo(() => countInactiveCustomers(customers, tickets, projects, quotes), [customers, tickets, projects, quotes]);

  const pctLabel = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);
  const countLabel = (v: number) => (v > 0 ? `+${v}` : `${v}`);

  const kpis: Kpi[] = [
    { label: "Open Tickets", value: <Num>{metrics.openTickets.length}</Num>, delta: countLabel(metrics.openDeltaCount), up: metrics.openDeltaCount >= 0, href: "/tickets" },
    { label: "Urgent Tickets", value: <Num>{metrics.urgentTickets.length}</Num>, delta: countLabel(metrics.urgentDeltaCount), up: metrics.urgentDeltaCount <= 0, href: "/tickets" },
    { label: "Active Quotes", value: <Num>{activeQuotes}</Num>, delta: countLabel(metrics.activeQuotesDeltaCount), up: metrics.activeQuotesDeltaCount >= 0, href: "/quote" },
    { label: "Resolved This Month", value: <Num>{metrics.resolvedThisMonth.length}</Num>, delta: pctLabel(metrics.resolvedDeltaPct), up: (metrics.resolvedDeltaPct ?? 0) >= 0, href: "/tickets" },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <div>
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-light text-text-primary">
            {greeting()}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-text-secondary mt-1">Here&apos;s what&apos;s moving across tickets, quotes and projects.</p>
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

      <KpiCards kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <RevenueOverview data={chartData} />
        <ProjectProgress projects={projects} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <CurrencyPipeline quotes={quotes} />
        <QuoteExpiryAlerts quotes={quotes} />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <TicketsByStatus tickets={tickets} />
        <TicketsByCategory openTickets={metrics.openTickets} />
        <TeamWorkload tickets={tickets} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectsByStage projects={projects} />
        <div className="flex flex-col gap-4">
          <RevenueBySegment data={revenueBySegment} />
          <TopCustomers entries={topCustomers} totalCustomers={customers.length} inactiveCount={inactiveCustomers} />
        </div>
      </div>
    </div>
  );
}
