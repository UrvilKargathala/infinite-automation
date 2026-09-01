import dynamic from "next/dynamic";

const TicketsPageClient = dynamic(
  () => import("@/components/tickets/TicketsPageClient").then((m) => m.TicketsPageClient),
  { ssr: false }
);

export default function TicketsPage() {
  return <TicketsPageClient />;
}
