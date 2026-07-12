import Link from "next/link";
import { Truck, Search, Phone, Mail } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getSuppliers } from "@/utils/services/pharmacy";
import { formatNumber } from "@/utils";
import { AddSupplierDialog } from "@/components/pharmacy/add-supplier-dialog";
import { Role } from "@prisma/client";
import { getLang } from "@/lib/i18n-server";

const ALLOWED: Role[] = [Role.ADMIN, Role.PHARMACIST];

const STR = {
  fr: {
    title: "Fournisseurs",
    count: (n: string, plural: boolean) => `${n} fournisseur${plural ? "s" : ""}`,
    searchPh: "Rechercher (nom, contact, téléphone)…",
    filter: "Filtrer",
    empty: "Aucun fournisseur.",
    inactive: "inactif",
    lots: "lots",
    orders: "commandes",
  },
  en: {
    title: "Suppliers",
    count: (n: string, plural: boolean) => `${n} supplier${plural ? "s" : ""}`,
    searchPh: "Search (name, contact, phone)…",
    filter: "Filter",
    empty: "No supplier.",
    inactive: "inactive",
    lots: "batches",
    orders: "orders",
  },
};

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const t = STR[await getLang()];
  const sp = await searchParams;
  const search = sp.q ?? "";
  const page = sp.page ?? "1";

  const { data, total, totalPages, page: currentPage } = await getSuppliers({
    page,
    search,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t.title}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t.count(formatNumber(total), total > 1)}
            </p>
          </div>
        </div>
        <AddSupplierDialog />
      </div>

      <form
        action="/pharmacy/suppliers"
        className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3"
      >
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder={t.searchPh}
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

      {data.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center text-sm text-slate-400">
          {t.empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                    {s.name}
                  </h3>
                  {s.contact_person && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.contact_person}
                    </p>
                  )}
                </div>
                {!s.is_active && (
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {t.inactive}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {s.phone}
                </div>
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
              </div>

              {s.address && (
                <p className="mt-3 text-[11px] text-slate-400 line-clamp-2">
                  {s.address}
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[11px] text-slate-500">
                <span>{s._count.stocks} {t.lots}</span>
                <span>{s._count.orders} {t.orders}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {currentPage > 1 && (
            <Link
              href={`?q=${search}&page=${currentPage - 1}`}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800"
            >
              ←
            </Link>
          )}
          <span className="text-slate-500">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`?q=${search}&page=${currentPage + 1}`}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800"
            >
              →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
