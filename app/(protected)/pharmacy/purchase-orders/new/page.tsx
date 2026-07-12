import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/permissions";
import { getSuppliers, getMedications } from "@/utils/services/pharmacy";
import { NewPurchaseOrderForm } from "@/components/pharmacy/new-purchase-order-form";
import { getLang } from "@/lib/i18n-server";

const ALLOWED: Role[] = [Role.ADMIN, Role.PHARMACIST];

const STR = {
  fr: {
    title: "Nouveau bon de commande",
    subtitle: "Commander des médicaments auprès d'un fournisseur.",
  },
  en: {
    title: "New purchase order",
    subtitle: "Order medications from a supplier.",
  },
};

export default async function NewPurchaseOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const t = STR[await getLang()];

  const [suppliersRes, medsRes] = await Promise.all([
    getSuppliers({ activeOnly: true, limit: 500 }),
    getMedications({ activeOnly: true, limit: 1000 }),
  ]);

  const suppliers = suppliersRes.data.map((s) => ({ id: s.id, name: s.name }));
  const medications = medsRes.data.map((m) => ({
    id: m.id,
    name: m.name,
    dosage: m.dosage,
    form: m.form,
  }));

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Link
          href="/pharmacy/purchase-orders"
          className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t.title}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t.subtitle}
            </p>
          </div>
        </div>
      </div>

      <NewPurchaseOrderForm suppliers={suppliers} medications={medications} />
    </div>
  );
}
