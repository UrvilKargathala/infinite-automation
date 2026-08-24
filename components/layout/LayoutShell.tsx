"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TopNav } from "./TopNav";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("ia_logged_in") === "true";
    if (!loggedIn && !isLogin) {
      router.replace("/login");
    } else if (loggedIn && isLogin) {
      router.replace("/dashboard");
    } else {
      setReady(true);
    }
  }, [isLogin, pathname, router]);

  if (!ready) return null;

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
