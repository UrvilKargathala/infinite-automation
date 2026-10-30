import dynamic from "next/dynamic";

const KitsPageClient = dynamic(() => import("@/components/master/KitsPageClient").then((m) => m.KitsPageClient), { ssr: false });

export default function KitsPage() {
  return <KitsPageClient />;
}
