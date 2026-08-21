import type { Metadata } from "next";
import { Fredoka, Montserrat } from "next/font/google";
import "./globals.css";
import { LayoutShell } from "@/components/layout/LayoutShell";

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
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
