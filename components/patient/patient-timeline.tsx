import {
  CalendarDays,
  Activity,
  Stethoscope,
  FlaskConical,
  ScrollText,
  Pill,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import {
  getPatientTimeline,
  type TimelineEventType,
} from "@/utils/services/timeline";
import { formatNumber } from "@/utils";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    empty: "Aucun évènement pour ce patient.",
    dateLocale: "fr-FR",
    status: {
      PENDING: "En attente",
      SCHEDULED: "Programmé",
      COMPLETED: "Terminé",
      CANCELLED: "Annulé",
      REQUESTED: "Demandée",
      IN_PROGRESS: "En cours",
      PARTIALLY_DISPENSED: "Partielle",
      DISPENSED: "Délivrée",
      PAID: "Payé",
      UNPAID: "Impayé",
      PART: "Partiel",
      RETURNED: "Retournée",
    } as Record<string, string>,
  },
  en: {
    empty: "No event for this patient.",
    dateLocale: "en-GB",
    status: {
      PENDING: "Pending",
      SCHEDULED: "Scheduled",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      REQUESTED: "Requested",
      IN_PROGRESS: "In progress",
      PARTIALLY_DISPENSED: "Partial",
      DISPENSED: "Dispensed",
      PAID: "Paid",
      UNPAID: "Unpaid",
      PART: "Partial",
      RETURNED: "Returned",
    } as Record<string, string>,
  },
};

const TYPE_META: Record<
  TimelineEventType,
  { icon: LucideIcon; dot: string; ring: string; label: string }
> = {
  appointment: {
    icon: CalendarDays,
    dot: "bg-sky-500",
    ring: "bg-sky-500/10 text-sky-600",
    label: "Rendez-vous",
  },
  vitals: {
    icon: Activity,
    dot: "bg-rose-500",
    ring: "bg-rose-500/10 text-rose-600",
    label: "Constantes",
  },
  diagnosis: {
    icon: Stethoscope,
    dot: "bg-blue-600",
    ring: "bg-blue-600/10 text-blue-600",
    label: "Diagnostic",
  },
  lab: {
    icon: FlaskConical,
    dot: "bg-violet-500",
    ring: "bg-violet-500/10 text-violet-600",
    label: "Analyse",
  },
  prescription: {
    icon: ScrollText,
    dot: "bg-sky-500",
    ring: "bg-sky-500/10 text-sky-600",
    label: "Ordonnance",
  },
  dispensation: {
    icon: Pill,
    dot: "bg-emerald-500",
    ring: "bg-emerald-500/10 text-emerald-600",
    label: "Dispensation",
  },
  payment: {
    icon: Receipt,
    dot: "bg-amber-500",
    ring: "bg-amber-500/10 text-amber-600",
    label: "Facture",
  },
};

function statusBadge(status: string, statusLabels: Record<string, string>) {
  const positive = ["COMPLETED", "PAID", "DISPENSED", "SCHEDULED"].includes(
    status
  );
  const negative = ["CANCELLED", "UNPAID", "RETURNED"].includes(status);
  const cls = positive
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    : negative
    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return { label: statusLabels[status] ?? status, cls };
}

function formatDay(d: Date, locale: string) {
  return d.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function PatientTimeline({ patientId }: { patientId: string }) {
  const events = await getPatientTimeline(patientId);
  const t = STR[await getLang()];

  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center text-sm text-slate-400">
        {t.empty}
      </div>
    );
  }

  // Regroupe par jour (les évènements sont déjà triés du plus récent au plus ancien).
  const groups = new Map<string, typeof events>();
  for (const e of events) {
    const key = e.date.toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-6">
      {Array.from(groups.entries()).map(([key, dayEvents]) => (
        <div key={key}>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 capitalize">
            {formatDay(dayEvents[0].date, t.dateLocale)}
          </p>

          <div className="relative pl-6">
            <span className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-100 dark:bg-slate-800" />
            <div className="space-y-4">
              {dayEvents.map((e) => {
                const meta = TYPE_META[e.type];
                const Icon = meta.icon;
                return (
                  <div key={e.id} className="relative">
                    <span
                      className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${meta.dot}`}
                    />
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.ring}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {e.title}
                          </p>
                          {e.status && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                statusBadge(e.status, t.status).cls
                              }`}
                            >
                              {statusBadge(e.status, t.status).label}
                            </span>
                          )}
                          {typeof e.amount === "number" && (
                            <span className="text-[11px] text-amber-600 font-medium">
                              {formatNumber(e.amount)} FC
                            </span>
                          )}
                        </div>
                        {e.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 whitespace-pre-wrap">
                            {e.description}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {e.date.toLocaleTimeString(t.dateLocale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {e.by ? ` · ${e.by}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
