import dynamic from "next/dynamic";

const CrmPageClient = dynamic(
  () => import("@/components/crm/CrmPageClient").then((m) => m.CrmPageClient),
  { ssr: false }
);

export default function CrmPage() {
  return <CrmPageClient />;
}
