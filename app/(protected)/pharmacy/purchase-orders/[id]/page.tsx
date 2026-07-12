import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Truck, Calendar, ClipboardList } from "lucide-react";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/permissions";
import { getPurchaseOrderById } from "@/utils/services/pharmacy";
import { PurchaseOrderDetail } from "@/components/pharmacy/purchase-order-detail";

const ALLOWED: Role[] = [Role.ADMIN, Role.PHARMACIST];

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();

  const order = await getPurchaseOrderById(orderId);
  if (!order) notFound();

  const dto = {
    id: order.id,
    reference: order.reference,
    status: order.status,
    supplierName: order.supplier.name,
    totalAmount: order.total_amount,
    items: order.items.map((i) => ({
      id: i.id,
      medicationName: i.medication.name,
      medicationDosage: i.medication.dosage,
      quantityOrdered: i.quantity_ordered,
      quantityReceived: i.quantity_received,
      unitCost: i.unit_cost,
      totalCost: i.total_cost,
    })),
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      <div className="flex items-start gap-3">
        <Link
          href="/pharmacy/purchase-orders"
          className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">
              {order.reference}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> {order.supplier.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />{" "}
                {order.order_date.toLocaleDateString("fr-FR", {
                  dateStyle: "medium",
                })}
              </span>
              {order.expected_date && (
                <span className="flex items-center gap-1">
                  Prévue :{" "}
                  {order.expected_date.toLocaleDateString("fr-FR", {
                    dateStyle: "medium",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-3 text-sm text-slate-600 dark:text-slate-300">
          {order.notes}
        </div>
      )}

      <PurchaseOrderDetail order={dto} />
    </div>
  );
}
