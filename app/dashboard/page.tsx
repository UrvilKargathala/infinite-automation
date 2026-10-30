"use client";

import { useMemo } from "react";
import { MessageSquareWarning, Briefcase, FileText, PackageCheck } from "lucide-react";
import { useTicketStore } from "@/lib/store/useTicketStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useProductStore } from "@/lib/store/useProductStore";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { Num } from "@/components/ui/Num";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { KpiCards, type Kpi } from "@/components/dashboard/KpiCards";
import { RevenueOverview } from "@/components/dashboard/RevenueOverview";
import { CrmPipelineCard } from "@/components/dashboard/CrmPipelineCard";
import { ComplaintsCard } from "@/components/dashboard/ComplaintsCard";
import { CurrencyPipeline } from "@/components/dashboard/CurrencyPipeline";
import { QuoteExpiryAlerts } from "@/components/dashboard/QuoteExpiryAlerts";
import { TeamWorkload } from "@/components/dashboard/TeamWorkload";
import { StockAlerts } from "@/components/dashboard/StockAlerts";
import { RevenueBySegment } from "@/components/dashboard/RevenueBySegment";
import { TopCustomers } from "@/components/dashboard/TopCustomers";
import { AiSummary } from "@/components/dashboard/AiSummary";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { computeHeadline, computeMonthlySeries, computeRevenueBySegment, computeTopCustomers, countInactiveCustomers } from "@/lib/utils/dashboardMetrics";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { useComplaints } from "@/lib/hooks/useComplaints";
import { usePipelineStages } from "@/lib/hooks/usePipelineStages";

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
  const users = useUserStore((s) => s.users);
  const { complaints, isLoading: complaintsLoading } = useComplaints();
  const { stages, isLoading: stagesLoading } = usePipelineStages();
  const loading = !ticketsLoaded || !projectsLoaded || !quotesLoaded || !productsLoaded || !customersLoaded || complaintsLoading || stagesLoading;

  const head = useMemo(() => computeHeadline(projects, quotes, complaints, stages), [projects, quotes, complaints, stages]);
  // Money widgets only add up quotes in the user's Settings currency — amounts in different currencies are never summed.
  const currency = useCurrency();
  const moneyQuotes = useMemo(() => quotes.filter((q) => (q.currency ?? "INR") === currency), [quotes, currency]);
  const chartData = useMemo(() => computeMonthlySeries(moneyQuotes), [moneyQuotes]);
  const revenueBySegment = useMemo(() => computeRevenueBySegment(moneyQuotes, customers), [moneyQuotes, customers]);
  const topCustomers = useMemo(() => computeTopCustomers(moneyQuotes, tickets, customers), [moneyQuotes, tickets, customers]);
  const inactiveCustomers = useMemo(() => countInactiveCustomers(customers, tickets, projects, quotes), [customers, tickets, projects, quotes]);

  const kpis: Kpi[] = [
    { label: "Pending Complaints", icon: MessageSquareWarning, value: <Num>{head.pendingComplaints}</Num>, trend: head.complaintsRaised, trendLabel: "raised", higherIsGood: false, href: "/complaints" },
    { label: "Active CRM Records", icon: Briefcase, value: <Num>{head.activeRecords}</Num>, trend: head.recordsCreated, trendLabel: "new", higherIsGood: true, href: "/crm" },
    { label: "Active Quotes", icon: FileText, value: <Num>{head.activeQuotes}</Num>, trend: head.quotesCreated, trendLabel: "created", higherIsGood: true, href: "/quote" },
    { icon: PackageCheck, label: head.lastStage === "Install" ? "Installed This Month" : `${head.lastStage} This Month`, value: <Num>{head.installed.cur}</Num>, trend: head.installed, trendLabel: "", higherIsGood: true, href: "/crm" },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <div>
      <div>
        <div>
          <h1 className="text-3xl font-light text-text-primary">
            {greeting()}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-text-secondary mt-1">Here&apos;s what&apos;s moving across CRM, complaints and quotes.</p>
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <AiSummary
          projects={projects} stages={stages} complaints={complaints} quotes={quotes} products={products} currency={currency}
        />
      </div>

      <KpiCards kpis={kpis} />

      {/* Needs action */}
      <div className={`grid grid-cols-1 gap-4 mb-4 ${users.length ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        <QuoteExpiryAlerts quotes={quotes} />
        <ComplaintsCard complaints={complaints} />
        {users.length > 0 && <TeamWorkload users={users} projects={projects} complaints={complaints} stages={stages} />}
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <RevenueOverview data={chartData} currency={currency} />
        <CrmPipelineCard projects={projects} stages={stages} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <CurrencyPipeline quotes={quotes} primary={currency} />
        <StockAlerts />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueBySegment data={revenueBySegment} currency={currency} />
        <TopCustomers entries={topCustomers} totalCustomers={customers.length} inactiveCount={inactiveCustomers} currency={currency} />
      </div>
    </div>
  );
}
