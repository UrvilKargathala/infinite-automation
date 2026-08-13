import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import { TopNav } from "@/components/layout/TopNav";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "Infinite Automation Dashboard",
  description: "Internal operations dashboard for Infinite Automation",
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
        <main className="max-w-[1860px] mx-auto px-8 py-8">{children}</main>
      </body>
    </html>
  );
}
