import { OrderSlip } from "@/components/projects/OrderSlip";

export default function OrderSlipPage({ params }: { params: { id: string } }) {
  return <OrderSlip projectId={Number(params.id)} />;
}
