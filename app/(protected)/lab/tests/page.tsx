import Link from "next/link";
import { redirect } from "next/navigation";
import { FlaskConical, Search, User, Stethoscope } from "lucide-react";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/permissions";
import { getLabTests, getLabStats } from "@/utils/services/lab";
import { formatNumber } from "@/utils";
import { getLabStatusMeta } from "@/components/lab/lab-status";
import { LabTestActions } from "@/components/lab/lab-test-actions";
import { getLang } from "@/lib/i18n-server";

const ALLOWED: Role[] = [Role.ADMIN, Role.LAB_TECHNICIAN];

const STR = {
  fr: {
    filterAll: "Toutes",
    filterRequested: "Demandées",
    filterInProgress: "En cours",
    filterCompleted: "Terminées",
    filterCancelled: "Annulées",
    title: "Analyses de laboratoire",
    subtitle: (total: string, pending: number) =>
      `${total} au total · ${pending} à traiter`,
    searchPh: "Rechercher (analyse, patient, médecin)…",
    filter: "Filtrer",
    empty: "Aucune analyse.",
    colTest: "Analyse",
    colPatient: "Patient",
    colRequestedBy: "Demandée par",
    colDate: "Date",
    colStatus: "Statut",
    colAction: "Action",
    page: "Page",
    dateLocale: "fr-FR",
  },
  en: {
    filterAll: "All",
    filterRequested: "Requested",
    filterInProgress: "In progress",
    filterCompleted: "Completed",
    filterCancelled: "Cancelled",
    title: "Laboratory tests",
    subtitle: (total: string, pending: number) =>
      `${total} in total · ${pending} to process`,
    searchPh: "Search (test, patient, doctor)…",
    filter: "Filter",
    empty: "No test.",
    colTest: "Test",
    colPatient: "Patient",
    colRequestedBy: "Requested by",
    colDate: "Date",
    colStatus: "Status",
    colAction: "Action",
    page: "Page",
    dateLocale: "en-GB",
  },
};

export default async function LabTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const lang = await getLang();
  const t = STR[lang];
  const LAB_STATUS_META = getLabStatusMeta(lang);

  const sp = await searchParams;
  const search = sp.q ?? "";
  const status = sp.status ?? "";

  const [{ data, total, totalPages, page: currentPage }, stats] =
    await Promise.all([
      getLabTests({ page: sp.page ?? "1", search, status }),
      getLabStats(),
    ]);

  const filters = [
    { key: "", label: t.filterAll },
    { key: "REQUESTED", label: t.filterRequested },
    { key: "IN_PROGRESS", label: t.filterInProgress },
    { key: "COMPLETED", label: t.filterCompleted },
    { key: "CANCELLED", label: t.filterCancelled },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t.title}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t.subtitle(formatNumber(total), stats.pending)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = status === f.key;
          const params = new URLSearchParams();
          if (f.key) params.set("status", f.key);
          if (search) params.set("q", search);
          const href = `/lab/tests${params.toString() ? `?${params}` : ""}`;
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
        action="/lab/tests"
        className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <div className="flex items-center gap-2 flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
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
                  <th className="text-left px-4 py-3">{t.colTest}</th>
                  <th className="text-left px-4 py-3">{t.colPatient}</th>
                  <th className="text-left px-4 py-3">{t.colRequestedBy}</th>
                  <th className="text-left px-4 py-3">{t.colDate}</th>
                  <th className="text-center px-4 py-3">{t.colStatus}</th>
                  <th className="text-right px-4 py-3">{t.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((lt) => {
                  const meta = LAB_STATUS_META[lt.status];
                  const patientName = `${lt.medical_record.patient.first_name} ${lt.medical_record.patient.last_name}`;
                  return (
                    <tr
                      key={lt.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {lt.services.service_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-200">
                            {patientName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span className="text-xs">
                            {lt.requested_by_name ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {lt.created_at.toLocaleDateString(t.dateLocale, {
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
                      <td className="px-4 py-3">
                        <LabTestActions
                          id={lt.id}
                          status={lt.status}
                          serviceName={lt.services.service_name}
                          patientName={patientName}
                          result={lt.result}
                          notes={lt.notes}
                        />
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
              {t.page} {currentPage} / {totalPages}
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
