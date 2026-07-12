import type { PrescriptionStatus } from "@prisma/client";
import type { Lang } from "@/lib/i18n";

const RX_BADGE: Record<PrescriptionStatus, string> = {
  PENDING: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  PARTIALLY_DISPENSED:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  DISPENSED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const RX_LABELS: Record<Lang, Record<PrescriptionStatus, string>> = {
  fr: {
    PENDING: "À dispenser",
    PARTIALLY_DISPENSED: "Partiellement délivrée",
    DISPENSED: "Délivrée",
    CANCELLED: "Annulée",
  },
  en: {
    PENDING: "To dispense",
    PARTIALLY_DISPENSED: "Partially dispensed",
    DISPENSED: "Dispensed",
    CANCELLED: "Cancelled",
  },
};

/** Returns status → { label, badge } for the given language. */
export function getRxStatusMeta(
  lang: Lang
): Record<PrescriptionStatus, { label: string; badge: string }> {
  const out = {} as Record<
    PrescriptionStatus,
    { label: string; badge: string }
  >;
  (Object.keys(RX_BADGE) as PrescriptionStatus[]).forEach((k) => {
    out[k] = { label: RX_LABELS[lang][k], badge: RX_BADGE[k] };
  });
  return out;
}
