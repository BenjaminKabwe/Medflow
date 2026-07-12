import type { PurchaseOrderStatus } from "@prisma/client";
import type { Lang } from "@/lib/i18n";

const PO_BADGE: Record<PurchaseOrderStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  ORDERED: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  PARTIALLY_RECEIVED:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  RECEIVED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const PO_LABELS: Record<Lang, Record<PurchaseOrderStatus, string>> = {
  fr: {
    DRAFT: "Brouillon",
    ORDERED: "Commandée",
    PARTIALLY_RECEIVED: "Partiellement reçue",
    RECEIVED: "Reçue",
    CANCELLED: "Annulée",
  },
  en: {
    DRAFT: "Draft",
    ORDERED: "Ordered",
    PARTIALLY_RECEIVED: "Partially received",
    RECEIVED: "Received",
    CANCELLED: "Cancelled",
  },
};

/** Returns status → { label, badge } for the given language. */
export function getPoStatusMeta(
  lang: Lang
): Record<PurchaseOrderStatus, { label: string; badge: string }> {
  const out = {} as Record<
    PurchaseOrderStatus,
    { label: string; badge: string }
  >;
  (Object.keys(PO_BADGE) as PurchaseOrderStatus[]).forEach((k) => {
    out[k] = { label: PO_LABELS[lang][k], badge: PO_BADGE[k] };
  });
  return out;
}
