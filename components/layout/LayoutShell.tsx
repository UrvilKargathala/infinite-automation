"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { TopNav } from "./TopNav";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useProductStore } from "@/lib/store/useProductStore";
import { useTicketStore } from "@/lib/store/useTicketStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useUserStore } from "@/lib/store/useUserStore";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const { isLoaded, isSignedIn } = useUser();

  const { fetchMe, user: me, error: meError, loaded: meLoaded } = useAuthStore();
  const fetchProducts = useProductStore((s) => s.fetchAll);
  const fetchTickets = useTicketStore((s) => s.fetchAll);
  const fetchProjects = useProjectStore((s) => s.fetchAll);
  const fetchQuotes = useQuoteStore((s) => s.fetchAll);
  const fetchUsers = useUserStore((s) => s.fetchAll);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchMe();
      fetchProducts();
      fetchTickets();
      fetchProjects();
      fetchQuotes();
      fetchUsers();
    }
  }, [isLoaded, isSignedIn, fetchMe, fetchProducts, fetchTickets, fetchProjects, fetchQuotes, fetchUsers]);

  if (isAuthRoute) return <>{children}</>;

  if (!isLoaded || (isSignedIn && !meLoaded)) return null;

  if (isSignedIn && meError) {
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
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-full bg-brand-green/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[380px] h-[380px] rounded-full bg-purple/10 blur-3xl" />
      </div>
      <TopNav />
      <main className="max-w-[1860px] mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </>
  );
}
