import type { LabTestStatus } from "@prisma/client";
import type { Lang } from "@/lib/i18n";

const LAB_BADGE: Record<LabTestStatus, string> = {
  REQUESTED: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  IN_PROGRESS:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  COMPLETED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const LAB_LABELS: Record<Lang, Record<LabTestStatus, string>> = {
  fr: {
    REQUESTED: "Demandée",
    IN_PROGRESS: "En cours",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
  },
  en: {
    REQUESTED: "Requested",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  },
};

/** Returns status → { label, badge } for the given language. */
export function getLabStatusMeta(
  lang: Lang
): Record<LabTestStatus, { label: string; badge: string }> {
  const out = {} as Record<LabTestStatus, { label: string; badge: string }>;
  (Object.keys(LAB_BADGE) as LabTestStatus[]).forEach((k) => {
    out[k] = { label: LAB_LABELS[lang][k], badge: LAB_BADGE[k] };
  });
  return out;
}
