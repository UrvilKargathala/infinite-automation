import type { Metadata } from "next";
import { Fredoka, Montserrat } from "next/font/google";
import { TopNav } from "@/components/layout/TopNav";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-fredoka",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-montserrat",
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
    <html lang="en" className={`${fredoka.variable} ${montserrat.variable}`}>
      <body>
        <TopNav />
        <main className="max-w-[1860px] mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
      </body>
    </html>
  );
}
