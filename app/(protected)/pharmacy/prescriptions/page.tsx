import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Search, User, Stethoscope } from "lucide-react";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/permissions";
import {
  getPrescriptions,
  getPrescriptionStats,
} from "@/utils/services/prescription";
import { formatNumber } from "@/utils";
import { getRxStatusMeta } from "@/components/pharmacy/prescription-status";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    title: "Ordonnances",
    summary: (total: number, toDispense: number) =>
      `${formatNumber(total)} au total · ${toDispense} à délivrer`,
    all: "Toutes",
    toDispense: "À dispenser",
    partial: "Partielles",
    dispensed: "Délivrées",
    cancelled: "Annulées",
    searchPlaceholder: "Rechercher (référence, patient, médecin)…",
    filter: "Filtrer",
    empty: "Aucune ordonnance.",
    reference: "Référence",
    patient: "Patient",
    doctor: "Médecin",
    lines: "Lignes",
    date: "Date",
    status: "Statut",
    pageOf: (cur: number, tot: number) => `Page ${cur} / ${tot}`,
  },
  en: {
    title: "Prescriptions",
    summary: (total: number, toDispense: number) =>
      `${formatNumber(total)} in total · ${toDispense} to dispense`,
    all: "All",
    toDispense: "To dispense",
    partial: "Partial",
    dispensed: "Dispensed",
    cancelled: "Cancelled",
    searchPlaceholder: "Search (reference, patient, doctor)…",
    filter: "Filter",
    empty: "No prescription.",
    reference: "Reference",
    patient: "Patient",
    doctor: "Doctor",
    lines: "Lines",
    date: "Date",
    status: "Status",
    pageOf: (cur: number, tot: number) => `Page ${cur} / ${tot}`,
  },
} as const;

const ALLOWED: Role[] = [Role.ADMIN, Role.PHARMACIST];

export default async function PrescriptionsPage({
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
      getPrescriptions({ page: sp.page ?? "1", search, status }),
      getPrescriptionStats(),
    ]);

  const lang = await getLang();
  const t = STR[lang];
  const RX_STATUS_META = getRxStatusMeta(lang);

  const filters = [
    { key: "", label: t.all },
    { key: "PENDING", label: t.toDispense },
    { key: "PARTIALLY_DISPENSED", label: t.partial },
    { key: "DISPENSED", label: t.dispensed },
    { key: "CANCELLED", label: t.cancelled },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t.title}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t.summary(total, stats.toDispense)}
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
          const href = `/pharmacy/prescriptions${
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
        action="/pharmacy/prescriptions"
        className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3"
      >
        {status && <input type="hidden" name="status" value={status} />}
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
                  <th className="text-left px-4 py-3">{t.doctor}</th>
                  <th className="text-center px-4 py-3">{t.lines}</th>
                  <th className="text-left px-4 py-3">{t.date}</th>
                  <th className="text-center px-4 py-3">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((rx) => {
                  const meta = RX_STATUS_META[rx.status];
                  return (
                    <tr
                      key={rx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/pharmacy/prescriptions/${rx.id}`}
                          className="font-mono text-[12px] text-sky-600 hover:underline"
                        >
                          {rx.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-200">
                            {rx.patient.first_name} {rx.patient.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span className="text-xs">{rx.doctor_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {rx._count.items}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {rx.created_at.toLocaleDateString("fr-FR", {
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
