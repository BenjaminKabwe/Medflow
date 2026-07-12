import Link from "next/link";
import { Pill, Search, User, Receipt } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getDispensations } from "@/utils/services/pharmacy";
import { formatNumber } from "@/utils";
import { Role } from "@prisma/client";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    title: "Dispensations",
    recorded: (n: number) =>
      `${formatNumber(n)} délivrance${n > 1 ? "s" : ""} enregistrée${
        n > 1 ? "s" : ""
      }`,
    newDispensation: "Nouvelle dispensation",
    searchPlaceholder: "Rechercher (référence, patient)…",
    filter: "Filtrer",
    empty: "Aucune dispensation.",
    reference: "Référence",
    patient: "Patient",
    medications: "Médicaments",
    total: "Total",
    date: "Date",
    status: "Statut",
    articles: (n: number) => `${n} article${n > 1 ? "s" : ""} — `,
    pageOf: (cur: number, tot: number) => `Page ${cur} / ${tot}`,
  },
  en: {
    title: "Dispensations",
    recorded: (n: number) =>
      `${formatNumber(n)} dispensation${n > 1 ? "s" : ""} recorded`,
    newDispensation: "New dispensation",
    searchPlaceholder: "Search (reference, patient)…",
    filter: "Filter",
    empty: "No dispensation.",
    reference: "Reference",
    patient: "Patient",
    medications: "Medications",
    total: "Total",
    date: "Date",
    status: "Status",
    articles: (n: number) => `${n} item${n > 1 ? "s" : ""} — `,
    pageOf: (cur: number, tot: number) => `Page ${cur} / ${tot}`,
  },
} as const;

const ALLOWED: Role[] = [Role.ADMIN, Role.PHARMACIST, Role.NURSE];

export default async function DispensationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const sp = await searchParams;
  const search = sp.q ?? "";
  const page = sp.page ?? "1";

  const { data, total, totalPages, page: currentPage } = await getDispensations({
    page,
    search,
  });

  const t = STR[await getLang()];

  return (
    <div className="flex flex-col gap-5">
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
              {t.recorded(total)}
            </p>
          </div>
        </div>
        <Link
          href="/pharmacy/dispensation/new"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Pill className="w-4 h-4" /> {t.newDispensation}
        </Link>
      </div>

      <form
        action="/pharmacy/dispensation"
        className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3"
      >
        <div className="flex items-center gap-2 flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5">
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
                  <th className="text-left px-4 py-3">{t.reference}</th>
                  <th className="text-left px-4 py-3">{t.patient}</th>
                  <th className="text-left px-4 py-3">{t.medications}</th>
                  <th className="text-right px-4 py-3">{t.total}</th>
                  <th className="text-left px-4 py-3">{t.date}</th>
                  <th className="text-center px-4 py-3">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-700 dark:text-slate-200">
                      {d.reference}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <span className="text-slate-700 dark:text-slate-200">
                          {d.patient.first_name} {d.patient.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="text-xs">
                        {t.articles(d.items.length)}
                        {d.items
                          .map((i) => i.medication.name)
                          .slice(0, 2)
                          .join(", ")}
                        {d.items.length > 2 ? ", …" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                      {formatNumber(d.total_amount)} FC
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {d.dispensed_at.toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          d.status === "DISPENSED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : d.status === "CANCELLED"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
                  href={`?q=${search}&page=${currentPage - 1}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  ←
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`?q=${search}&page=${currentPage + 1}`}
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
