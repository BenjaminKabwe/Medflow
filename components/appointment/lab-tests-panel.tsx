import { FlaskConical } from "lucide-react";
import { getLabStatusMeta } from "../lab/lab-status";
import type { LabTestStatus } from "@prisma/client";
import type { Lang } from "@/lib/i18n";

const STR = {
  fr: {
    title: "Analyses de laboratoire",
    result: "Résultat",
    pendingMsg: "En attente de prise en charge au laboratoire.",
    inProgressMsg: "Analyse en cours au laboratoire.",
    cancelledMsg: "Analyse annulée.",
    requestedBy: (name: string) => `Demandé par ${name}`,
    resultOn: "Résultat le",
    dateLocale: "fr-FR",
  },
  en: {
    title: "Laboratory tests",
    result: "Result",
    pendingMsg: "Awaiting handling at the laboratory.",
    inProgressMsg: "Analysis in progress at the laboratory.",
    cancelledMsg: "Analysis cancelled.",
    requestedBy: (name: string) => `Requested by ${name}`,
    resultOn: "Result on",
    dateLocale: "en-GB",
  },
};

type LabTestRow = {
  id: number;
  status: LabTestStatus;
  result: string | null;
  notes: string | null;
  created_at: Date;
  completed_at: Date | null;
  requested_by_name: string | null;
  performed_by_name: string | null;
  services: { id: number; service_name: string; price: number };
};

export function LabTestsPanel({
  tests,
  lang = "fr",
}: {
  tests: LabTestRow[];
  lang?: Lang;
}) {
  if (tests.length === 0) return null;

  const tr = STR[lang];
  const LAB_STATUS_META = getLabStatusMeta(lang);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-violet-600" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {tr.title}
        </h3>
        <span className="text-xs text-slate-400">({tests.length})</span>
      </div>

      <div className="space-y-2">
        {tests.map((t) => {
          const meta = LAB_STATUS_META[t.status];
          return (
            <div
              key={t.id}
              className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {t.services.service_name}
                </p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${meta.badge}`}
                >
                  {meta.label}
                </span>
              </div>

              {t.status === "COMPLETED" && t.result ? (
                <div className="mt-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold mb-0.5">
                    {tr.result}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                    {t.result}
                  </p>
                  {t.notes && (
                    <p className="text-xs text-slate-400 mt-1">{t.notes}</p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  {t.status === "REQUESTED"
                    ? tr.pendingMsg
                    : t.status === "IN_PROGRESS"
                    ? tr.inProgressMsg
                    : tr.cancelledMsg}
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-400">
                {t.requested_by_name && (
                  <span>{tr.requestedBy(t.requested_by_name)}</span>
                )}
                {t.completed_at && (
                  <span>
                    {tr.resultOn}{" "}
                    {t.completed_at.toLocaleDateString(tr.dateLocale, {
                      dateStyle: "medium",
                    })}
                    {t.performed_by_name ? ` · ${t.performed_by_name}` : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
