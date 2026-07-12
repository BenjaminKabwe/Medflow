import Link from "next/link";
import { Boxes, Search, CalendarClock, AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getStockList } from "@/utils/services/pharmacy";
import { formatNumber } from "@/utils";
import { AddStockDialog } from "@/components/pharmacy/add-stock-dialog";
import db from "@/lib/db";
import { getLang } from "@/lib/i18n-server";
import { Role } from "@prisma/client";

const ALLOWED: Role[] = [Role.ADMIN, Role.PHARMACIST];

const STR = {
  fr: {
    title: "Inventaire — Lots de stock",
    batchCount: (n: number) =>
      `${formatNumber(n)} lot${n > 1 ? "s" : ""} référencé${n > 1 ? "s" : ""}`,
    searchPlaceholder: "Rechercher (médicament, DCI, lot)…",
    filter: "Filtrer",
    empty: "Aucun lot en stock.",
    colMedication: "Médicament",
    colBatch: "Lot",
    colQuantity: "Quantité",
    colSellingPrice: "Prix vente",
    colSupplier: "Fournisseur",
    colExpiry: "Péremption",
    expired: "Périmé",
    daysShort: (n: number) => `${n}j`,
    pageLabel: (cur: number, tot: number) => `Page ${cur} / ${tot}`,
  },
  en: {
    title: "Inventory — Stock batches",
    batchCount: (n: number) =>
      `${formatNumber(n)} batch${n > 1 ? "es" : ""} listed`,
    searchPlaceholder: "Search (medication, INN, batch)…",
    filter: "Filter",
    empty: "No batch in stock.",
    colMedication: "Medication",
    colBatch: "Batch",
    colQuantity: "Quantity",
    colSellingPrice: "Selling price",
    colSupplier: "Supplier",
    colExpiry: "Expiry",
    expired: "Expired",
    daysShort: (n: number) => `${n}d`,
    pageLabel: (cur: number, tot: number) => `Page ${cur} / ${tot}`,
  },
} as const;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const t = STR[await getLang()];
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const sp = await searchParams;
  const search = sp.q ?? "";
  const page = sp.page ?? "1";

  const [{ data, total, totalPages, page: currentPage }, medications, suppliers] =
    await Promise.all([
      getStockList({ page, search }),
      db.medication.findMany({
        where: { is_active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, dosage: true, unit: true },
      }),
      db.supplier.findMany({
        where: { is_active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t.title}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t.batchCount(total)}
            </p>
          </div>
        </div>
        <AddStockDialog medications={medications} suppliers={suppliers} />
      </div>

      <form
        action="/pharmacy/inventory"
        className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3"
      >
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        <button
          type="submit"
          className="text-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg px-4 py-2 font-medium"
        >
          {t.filter}
        </button>
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {data.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.empty}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">{t.colMedication}</th>
                  <th className="text-left px-4 py-3">{t.colBatch}</th>
                  <th className="text-right px-4 py-3">{t.colQuantity}</th>
                  <th className="text-right px-4 py-3">{t.colSellingPrice}</th>
                  <th className="text-left px-4 py-3">{t.colSupplier}</th>
                  <th className="text-left px-4 py-3">{t.colExpiry}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((s) => {
                  const daysLeft = Math.floor(
                    (s.expiry_date.getTime() - now) / day
                  );
                  const expired = daysLeft < 0;
                  const soon = !expired && daysLeft <= 90;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {s.medication.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {s.medication.dci} · {s.medication.dosage}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[12px]">
                        {s.batch_number}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                        {formatNumber(s.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                        {formatNumber(s.selling_price)} FC
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {s.supplier?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {expired ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                              <AlertTriangle className="w-3 h-3" />
                              Périmé
                            </span>
                          ) : soon ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              <CalendarClock className="w-3 h-3" />
                              {daysLeft}j
                            </span>
                          ) : null}
                          <span className="text-xs text-slate-500">
                            {s.expiry_date.toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-sm">
            <span className="text-slate-500">
              Page {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`?q=${search}&page=${currentPage - 1}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  ←
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`?q=${search}&page=${currentPage + 1}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
