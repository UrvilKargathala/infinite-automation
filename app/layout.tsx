import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { Toaster } from "sonner";
import { ConfirmHost } from "@/components/ui/ConfirmDialog";
import "./globals.css";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";

// Urbanist is a variable font; we load only 400 on purpose so the whole app keeps one even weight for text and numbers.
const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-urbanist",
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
    <html lang="en" className={urbanist.variable}>
      <body>
        <ReactQueryProvider>
          <LayoutShell>{children}</LayoutShell>
        </ReactQueryProvider>
        <ConfirmHost />
        <Toaster
          position="top-right"
          richColors
          // Frosted-glass toasts: sonner styles toasts through these variables, so translucent values + .glass-pop's blur give the glass look.
          style={
            {
              "--normal-bg": "rgba(255, 255, 255, 0.82)",
              "--normal-border": "rgba(255, 255, 255, 0.95)",
              "--normal-text": "#0F172A",
              "--success-bg": "rgba(236, 253, 245, 0.85)",
              "--success-border": "rgba(167, 243, 208, 0.9)",
              "--success-text": "#047857",
              "--error-bg": "rgba(254, 242, 242, 0.88)",
              "--error-border": "rgba(254, 202, 202, 0.9)",
              "--error-text": "#B91C1C",
              "--warning-bg": "rgba(255, 251, 235, 0.88)",
              "--warning-border": "rgba(253, 230, 138, 0.9)",
              "--warning-text": "#B45309",
              "--info-bg": "rgba(239, 246, 255, 0.88)",
              "--info-border": "rgba(191, 219, 254, 0.9)",
              "--info-text": "#1D4ED8",
              "--border-radius": "16px",
            } as React.CSSProperties
          }
          toastOptions={{
            classNames: {
              toast: "!font-sans glass-pop !shadow-[0_24px_48px_-16px_rgba(10,70,96,0.3),inset_0_1px_0_#fff]",
            },
          }}
        />
      </body>
    </html>
  );
}
