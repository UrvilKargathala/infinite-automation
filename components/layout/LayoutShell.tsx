"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "./TopNav";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) return <>{children}</>;

  return (
    <>
      <TopNav />
      <main className="max-w-[1860px] mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </>
  );
}
