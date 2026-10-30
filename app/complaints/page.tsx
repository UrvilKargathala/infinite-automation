import dynamic from "next/dynamic";

const ComplaintsPageClient = dynamic(
  () => import("@/components/complaints/ComplaintsPageClient").then((m) => m.ComplaintsPageClient),
  { ssr: false }
);

export default function ComplaintsPage() {
  return <ComplaintsPageClient />;
}
