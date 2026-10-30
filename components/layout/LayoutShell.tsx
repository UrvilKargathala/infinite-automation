"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { useSidebarStore } from "@/lib/store/useSidebarStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useProductStore } from "@/lib/store/useProductStore";
import { useTicketStore } from "@/lib/store/useTicketStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { useCustomerStore } from "@/lib/store/useCustomerStore";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/login");

  const { fetchMe, user: me, error: meError, loaded: meLoaded } = useAuthStore();
  const fetchProducts = useProductStore((s) => s.fetchAll);
  const fetchTickets = useTicketStore((s) => s.fetchAll);
  const fetchProjects = useProjectStore((s) => s.fetchAll);
  const fetchQuotes = useQuoteStore((s) => s.fetchAll);
  const fetchUsers = useUserStore((s) => s.fetchAll);
  const fetchCustomers = useCustomerStore((s) => s.fetchAll);
  const sidebarCollapsed = useSidebarStore((s) => s.collapsed);

  useEffect(() => {
    if (isAuthRoute) return;
    fetchMe();
    fetchProducts();
    fetchTickets();
    fetchProjects();
    fetchQuotes();
    fetchUsers();
    fetchCustomers();
  }, [isAuthRoute, fetchMe, fetchProducts, fetchTickets, fetchProjects, fetchQuotes, fetchUsers, fetchCustomers]);

  if (isAuthRoute) return <>{children}</>;

  if (!meLoaded) return null;

  if (meError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl text-text-primary mb-2">Access pending</h1>
          <p className="text-sm text-text-secondary">{meError}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app-aurora" aria-hidden />
      <Sidebar />
      <TopNav />
      <main className={`page-enter transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[260px]"}`}>
        <div className="max-w-[1860px] mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-6 lg:pt-5 lg:pb-8">{children}</div>
      </main>
    </>
  );
}
