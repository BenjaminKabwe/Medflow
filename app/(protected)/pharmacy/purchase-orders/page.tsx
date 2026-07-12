import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, Search, Plus, Truck } from "lucide-react";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/permissions";
import {
  getPurchaseOrders,
  getPurchaseOrderStats,
} from "@/utils/services/pharmacy";
import { formatNumber } from "@/utils";
import { getPoStatusMeta } from "@/components/pharmacy/purchase-order-status";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    title: "Bons de commande",
    summary: (total: number, pending: number) =>
      `${formatNumber(total)} commande${
        total > 1 ? "s" : ""
      } · ${pending} en attente de réception`,
    newOrder: "Nouveau bon",
    all: "Toutes",
    drafts: "Brouillons",
    ordered: "Commandées",
    partial: "Partielles",
    received: "Reçues",
    searchPlaceholder: "Rechercher (référence, fournisseur)…",
    filter: "Filtrer",
    empty: "Aucune commande.",
    reference: "Référence",
    supplier: "Fournisseur",
    lines: "Lignes",
    amount: "Montant",
    date: "Date",
    status: "Statut",
    pageOf: (cur: number, tot: number) => `Page ${cur} / ${tot}`,
  },
  en: {
    title: "Purchase orders",
    summary: (total: number, pending: number) =>
      `${formatNumber(total)} order${
        total > 1 ? "s" : ""
      } · ${pending} awaiting receipt`,
    newOrder: "New order",
    all: "All",
    drafts: "Drafts",
    ordered: "Ordered",
    partial: "Partial",
    received: "Received",
    searchPlaceholder: "Search (reference, supplier)…",
    filter: "Filter",
    empty: "No order.",
    reference: "Reference",
    supplier: "Supplier",
    lines: "Lines",
    amount: "Amount",
    date: "Date",
    status: "Status",
    pageOf: (cur: number, tot: number) => `Page ${cur} / ${tot}`,
  },
} as const;

const ALLOWED: Role[] = [Role.ADMIN, Role.PHARMACIST];

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const sp = await searchParams;
  const search = sp.q ?? "";
  const status = sp.status ?? "";

  const [{ data, total, totalPages, page: currentPage }, stats] =
    await Promise.all([
      getPurchaseOrders({ page: sp.page ?? "1", search, status }),
      getPurchaseOrderStats(),
    ]);

  const lang = await getLang();
  const t = STR[lang];
  const STATUS_META = getPoStatusMeta(lang);

  const filters = [
    { key: "", label: t.all },
    { key: "DRAFT", label: t.drafts },
    { key: "ORDERED", label: t.ordered },
    { key: "PARTIALLY_RECEIVED", label: t.partial },
    { key: "RECEIVED", label: t.received },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t.title}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t.summary(total, stats.pending)}
            </p>
          </div>
        </div>
        <Link
          href="/pharmacy/purchase-orders/new"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.newOrder}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = status === f.key;
          const params = new URLSearchParams();
          if (f.key) params.set("status", f.key);
          if (search) params.set("q", search);
          const href = `/pharmacy/purchase-orders${
            params.toString() ? `?${params}` : ""
          }`;
          return (
            <Link
              key={f.key || "all"}
              href={href}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                active
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <form
        action="/pharmacy/purchase-orders"
        className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <div className="flex items-center gap-2 flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-400" />
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
          <div className="p-12 text-center text-sm text-slate-400">
            {t.empty}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">{t.reference}</th>
                  <th className="text-left px-4 py-3">{t.supplier}</th>
                  <th className="text-center px-4 py-3">{t.lines}</th>
                  <th className="text-right px-4 py-3">{t.amount}</th>
                  <th className="text-left px-4 py-3">{t.date}</th>
                  <th className="text-center px-4 py-3">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((o) => {
                  const meta = STATUS_META[o.status];
                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/pharmacy/purchase-orders/${o.id}`}
                          className="font-mono text-[12px] text-sky-600 hover:underline"
                        >
                          {o.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-200">
                            {o.supplier.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {o._count.items}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                        {formatNumber(o.total_amount)} FC
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {o.order_date.toLocaleDateString("fr-FR", {
                          dateStyle: "medium",
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
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
              {t.pageOf(currentPage, totalPages)}
            </span>
            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`?q=${search}&status=${status}&page=${currentPage - 1}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  ←
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`?q=${search}&status=${status}&page=${currentPage + 1}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800"
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
