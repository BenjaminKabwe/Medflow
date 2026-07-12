import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  User,
  Stethoscope,
  Calendar,
  Pill,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/permissions";
import { getPrescriptionById } from "@/utils/services/prescription";
import { formatNumber } from "@/utils";
import { getRxStatusMeta } from "@/components/pharmacy/prescription-status";
import { PrescriptionCancelButton } from "@/components/pharmacy/prescription-cancel-button";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    statusLabel: "Statut :",
    dispense: "Dispenser",
    prescribedMeds: "Médicaments prescrits",
    dispensed: "délivré",
    relatedDispensations: "Dispensations liées",
  },
  en: {
    statusLabel: "Status:",
    dispense: "Dispense",
    prescribedMeds: "Prescribed medications",
    dispensed: "dispensed",
    relatedDispensations: "Related dispensations",
  },
} as const;

const ALLOWED: Role[] = [Role.ADMIN, Role.PHARMACIST];

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const { id } = await params;
  const rxId = Number(id);
  if (!Number.isInteger(rxId) || rxId <= 0) notFound();

  const rx = await getPrescriptionById(rxId);
  if (!rx) notFound();

  const lang = await getLang();
  const t = STR[lang];
  const meta = getRxStatusMeta(lang)[rx.status];
  const canDispense =
    rx.status === "PENDING" || rx.status === "PARTIALLY_DISPENSED";

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      <div className="flex items-start gap-3">
        <Link
          href="/pharmacy/prescriptions"
          className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">
              {rx.reference}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {rx.patient.first_name}{" "}
                {rx.patient.last_name}
              </span>
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" /> {rx.doctor_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />{" "}
                {rx.created_at.toLocaleDateString("fr-FR", {
                  dateStyle: "medium",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">{t.statusLabel}</span>
          <span
            className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${meta.badge}`}
          >
            {meta.label}
          </span>
        </div>
        {canDispense && (
          <div className="flex items-center gap-2">
            <PrescriptionCancelButton id={rx.id} />
            <Link
              href={`/pharmacy/dispensation/new?prescription=${rx.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-sm font-semibold transition-colors"
            >
              <Pill className="w-4 h-4" /> {t.dispense}
            </Link>
          </div>
        )}
      </div>

      {rx.notes && (
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-3 text-sm text-slate-600 dark:text-slate-300">
          {rx.notes}
        </div>
      )}

      {/* Médicaments prescrits */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t.prescribedMeds}
          </h2>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rx.items.map((it) => {
            const done = it.quantity_dispensed >= it.quantity_prescribed;
            return (
              <li key={it.id} className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <Pill className="w-4 h-4 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {it.medication.name}{" "}
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {it.medication.dosage} · {it.medication.form}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {it.dosage}
                    {it.duration ? ` — ${it.duration}` : ""}
                  </p>
                  {it.instructions && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {it.instructions}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-sm font-semibold flex items-center gap-1 justify-end ${
                      done ? "text-emerald-600" : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {done && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {it.quantity_dispensed}/{it.quantity_prescribed}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.dispensed}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Historique des dispensations */}
      {rx.dispensations.length > 0 && (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
            {t.relatedDispensations}
          </h2>
          <ul className="space-y-2">
            {rx.dispensations.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between text-sm rounded-lg bg-slate-50 dark:bg-slate-800/40 px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                    {d.reference}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    · {d.dispensed_by_name}
                  </span>
                </span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {formatNumber(d.total_amount)} FC
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
