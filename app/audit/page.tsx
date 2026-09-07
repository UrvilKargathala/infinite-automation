import dynamic from "next/dynamic";

const AuditPageClient = dynamic(
  () => import("@/components/audit/AuditPageClient").then((m) => m.AuditPageClient),
  { ssr: false }
);

export default function AuditPage() {
  return <AuditPageClient />;
}
