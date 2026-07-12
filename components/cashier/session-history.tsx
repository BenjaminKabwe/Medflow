import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History, Banknote, CreditCard, Smartphone, Shield, Building2 } from "lucide-react";
import { ProfileImage } from "@/components/profile-image";
import { getSessionPayments } from "@/app/actions/cashier";
import { getLang } from "@/lib/i18n-server";

interface SessionHistoryProps {
  sessionId: number;
}

const STR = {
  fr: {
    methodLabels: {
      CASH: "Espèces",
      CARD: "Carte",
      MOBILE_MONEY: "Mobile Money",
      INSURANCE: "Assurance",
      BANK_TRANSFER: "Virement",
    } as Record<string, string>,
    subtotalLabels: {
      CASH: "Espèces",
      CARD: "Carte",
      MOBILE_MONEY: "Mobile",
      INSURANCE: "Assurance",
      BANK_TRANSFER: "Virement",
    } as Record<string, string>,
    noPayments: "Aucun encaissement pour cette session.",
    sessionHistory: "Historique de la session",
    collections: (n: number) => `${n} encaissement${n !== 1 ? "s" : ""}`,
  },
  en: {
    methodLabels: {
      CASH: "Cash",
      CARD: "Card",
      MOBILE_MONEY: "Mobile Money",
      INSURANCE: "Insurance",
      BANK_TRANSFER: "Transfer",
    } as Record<string, string>,
    subtotalLabels: {
      CASH: "Cash",
      CARD: "Card",
      MOBILE_MONEY: "Mobile",
      INSURANCE: "Insurance",
      BANK_TRANSFER: "Transfer",
    } as Record<string, string>,
    noPayments: "No collections for this session.",
    sessionHistory: "Session history",
    collections: (n: number) => `${n} collection${n !== 1 ? "s" : ""}`,
  },
} as const;

const METHOD_COLORS: Record<string, string> = {
  CASH:          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CARD:          "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  MOBILE_MONEY:  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  INSURANCE:     "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  BANK_TRANSFER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const SUBTOTAL_ICONS = [
  { key: "CASH",          Icon: Banknote,  color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  { key: "CARD",          Icon: CreditCard, color: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-50 dark:bg-sky-950/40" },
  { key: "MOBILE_MONEY",  Icon: Smartphone, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  { key: "INSURANCE",     Icon: Shield,     color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  { key: "BANK_TRANSFER", Icon: Building2,  color: "text-slate-600 dark:text-slate-400",   bg: "bg-slate-100 dark:bg-slate-800/50" },
];

export async function SessionHistory({ sessionId }: SessionHistoryProps) {
  const t = STR[await getLang()];
  const payments = await getSessionPayments(sessionId, "PAID");

  const subtotals = payments.reduce<Record<string, number>>((acc, p) => {
    const method = p.payment_method ?? "CASH";
    acc[method] = (acc[method] ?? 0) + p.amount_paid;
    return acc;
  }, {});

  if (payments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center gap-2 text-center">
        <History className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {t.noPayments}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Subtotals by method */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {SUBTOTAL_ICONS.filter((s) => (subtotals[s.key] ?? 0) > 0).map((s) => (
          <div
            key={s.key}
            className="rounded-xl border border-slate-100 dark:border-slate-700/60 px-3 py-2.5 flex items-center gap-2.5"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.Icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{t.subtotalLabels[s.key]}</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {(subtotals[s.key] ?? 0).toLocaleString("fr-CD")} USD
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Payments list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            {t.sessionHistory}
          </h3>
          <span className="text-xs text-slate-400">{t.collections(payments.length)}</span>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {payments.map((p) => {
            const name = `${p.patient.first_name} ${p.patient.last_name}`;
            const method = p.payment_method ?? "CASH";
            const methodColor = METHOD_COLORS[method] ?? METHOD_COLORS.CASH;
            const methodLabel = t.methodLabels[method] ?? t.methodLabels.CASH;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <ProfileImage
                  url={p.patient.img!}
                  name={name}
                  bgColor={p.patient.colorCode!}
                  textClassName="text-black"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate uppercase">
                    {name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {p.payment_date
                      ? format(new Date(p.payment_date), "HH:mm · d MMM", { locale: fr })
                      : "—"}
                    {p.receipt_number && (
                      <span className="ml-2 font-mono text-[10px]">{p.receipt_number}</span>
                    )}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${methodColor}`}>
                  {methodLabel}
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex-shrink-0 min-w-[6rem] text-right">
                  {p.amount_paid.toLocaleString("fr-CD")} USD
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
