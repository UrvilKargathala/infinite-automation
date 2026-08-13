import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import { TopNav } from "@/components/layout/TopNav";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "Infinite Automation Dashboard",
  description: "Internal operations dashboard for Infinite Automation",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={barlow.variable}>
      <body>
        <TopNav />
        <main className="max-w-[1860px] mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
      </body>
    </html>
  );
}
