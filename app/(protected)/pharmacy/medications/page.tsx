import Link from "next/link";
import { Pill, Search, PackageMinus } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getMedications, getMedicationCategories } from "@/utils/services/pharmacy";
import { formatNumber } from "@/utils";
import { AddMedicationDialog } from "@/components/pharmacy/add-medication-dialog";
import { getLang } from "@/lib/i18n-server";
import { Role } from "@prisma/client";

const ALLOWED: Role[] = [Role.ADMIN, Role.PHARMACIST, Role.DOCTOR];

const FORM_LABELS_FR: Record<string, string> = {
  COMPRIME: "Comprimé",
  GELULE: "Gélule",
  SIROP: "Sirop",
  SUSPENSION: "Suspension",
  INJECTION: "Injection",
  POMMADE: "Pommade",
  CREME: "Crème",
  GOUTTE: "Goutte",
  SUPPOSITOIRE: "Suppositoire",
  PATCH: "Patch",
  INHALATEUR: "Inhalateur",
  SACHET: "Sachet",
  AUTRE: "Autre",
};

const FORM_LABELS_EN: Record<string, string> = {
  COMPRIME: "Tablet",
  GELULE: "Capsule",
  SIROP: "Syrup",
  SUSPENSION: "Suspension",
  INJECTION: "Injection",
  POMMADE: "Ointment",
  CREME: "Cream",
  GOUTTE: "Drops",
  SUPPOSITOIRE: "Suppository",
  PATCH: "Patch",
  INHALATEUR: "Inhaler",
  SACHET: "Sachet",
  AUTRE: "Other",
};

const STR = {
  fr: {
    title: "Catalogue de médicaments",
    referenceCount: (n: number) =>
      `${formatNumber(n)} référence${n > 1 ? "s" : ""}`,
    searchPlaceholder: "Rechercher (nom, DCI, code-barres)…",
    allCategories: "Toutes catégories",
    filter: "Filtrer",
    empty: "Aucun médicament ne correspond à la recherche.",
    colName: "Nom",
    colDci: "DCI",
    colForm: "Forme",
    colDosage: "Dosage",
    colCategory: "Catégorie",
    colStock: "Stock",
    colPrice: "Prix",
    colStatus: "Statut",
    inactive: "inactif",
    prescription: "Ordonnance",
    otc: "Libre",
    pageLabel: (cur: number, tot: number) => `Page ${cur} / ${tot}`,
    formLabels: FORM_LABELS_FR,
  },
  en: {
    title: "Medication catalogue",
    referenceCount: (n: number) =>
      `${formatNumber(n)} reference${n > 1 ? "s" : ""}`,
    searchPlaceholder: "Search (name, INN, barcode)…",
    allCategories: "All categories",
    filter: "Filter",
    empty: "No medication matches the search.",
    colName: "Name",
    colDci: "INN",
    colForm: "Form",
    colDosage: "Dosage",
    colCategory: "Category",
    colStock: "Stock",
    colPrice: "Price",
    colStatus: "Status",
    inactive: "inactive",
    prescription: "Prescription",
    otc: "OTC",
    pageLabel: (cur: number, tot: number) => `Page ${cur} / ${tot}`,
    formLabels: FORM_LABELS_EN,
  },
} as const;

export default async function MedicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; cat?: string }>;
}) {
  const t = STR[await getLang()];
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const sp = await searchParams;
  const search = sp.q ?? "";
  const page = sp.page ?? "1";
  const category = sp.cat && sp.cat !== "all" ? sp.cat : undefined;

  const [{ data, total, totalPages, page: currentPage }, categories] =
    await Promise.all([
      getMedications({ page, search, category, activeOnly: false }),
      getMedicationCategories(),
    ]);

  const canManage = user.role === Role.ADMIN || user.role === Role.PHARMACIST;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Pill className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t.title}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t.referenceCount(total)}
            </p>
          </div>
        </div>
        {canManage && <AddMedicationDialog />}
      </div>

      {/* Filters */}
      <form
        action="/pharmacy/medications"
        className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3"
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
        <select
          name="cat"
          defaultValue={category ?? "all"}
          className="text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 border-0 outline-none"
        >
          <option value="all">{t.allCategories}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="text-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg px-4 py-2 font-medium"
        >
          {t.filter}
        </button>
      </form>

      {/* Table */}
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
                  <th className="text-left px-4 py-3">{t.colName}</th>
                  <th className="text-left px-4 py-3">{t.colDci}</th>
                  <th className="text-left px-4 py-3">{t.colForm}</th>
                  <th className="text-left px-4 py-3">{t.colDosage}</th>
                  <th className="text-left px-4 py-3">{t.colCategory}</th>
                  <th className="text-right px-4 py-3">{t.colStock}</th>
                  <th className="text-right px-4 py-3">{t.colPrice}</th>
                  <th className="text-center px-4 py-3">{t.colStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {m.name}
                      {!m.is_active && (
                        <span className="ml-2 text-[10px] uppercase text-slate-500 dark:text-slate-400">
                          {t.inactive}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {m.dci}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {t.formLabels[m.form] ?? m.form}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {m.dosage}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {m.category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          m.isLowStock ? "text-orange-600" : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {m.isLowStock && (
                          <PackageMinus className="w-3.5 h-3.5" />
                        )}
                        {formatNumber(m.totalStock)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                      {m.lastPrice != null
                        ? `${formatNumber(m.lastPrice)} FC`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.prescription_required ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          {t.prescription}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {t.otc}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-sm">
            <span className="text-slate-500">
              {t.pageLabel(currentPage, totalPages)}
            </span>
            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`?q=${search}&cat=${category ?? "all"}&page=${
                    currentPage - 1
                  }`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  ←
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`?q=${search}&cat=${category ?? "all"}&page=${
                    currentPage + 1
                  }`}
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
