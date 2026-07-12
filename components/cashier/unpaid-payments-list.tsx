import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileX, CalendarDays } from "lucide-react";
import { ProfileImage } from "@/components/profile-image";
import { CollectPaymentDialog } from "./collect-payment-dialog";
import { getUnpaidPayments } from "@/app/actions/cashier";
import { getActivePaymentMethods } from "@/app/actions/payment-methods";
import type { PaymentMethodConfigRow } from "@/types";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    noPending: "Aucun paiement en attente",
    allCollected: "Tous les paiements ont été encaissés.",
    pendingPayments: "Paiements en attente",
    unpaid: "Impayé",
  },
  en: {
    noPending: "No pending payments",
    allCollected: "All payments have been collected.",
    pendingPayments: "Pending payments",
    unpaid: "Unpaid",
  },
} as const;

interface UnpaidPaymentsListProps {
  hasActiveSession: boolean;
}

export async function UnpaidPaymentsList({
  hasActiveSession,
}: UnpaidPaymentsListProps) {
  const t = STR[await getLang()];
  const [payments, activeMethods] = await Promise.all([
    getUnpaidPayments(),
    getActivePaymentMethods() as unknown as Promise<PaymentMethodConfigRow[]>,
  ]);

  if (payments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-10 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <FileX className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t.noPending}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {t.allCollected}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {t.pendingPayments}
        </h3>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
          {payments.length}
        </span>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
        {payments.map((p) => {
          const name = `${p.patient.first_name} ${p.patient.last_name}`;
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CalendarDays className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {format(new Date(p.bill_date), "d MMM yyyy", { locale: fr })}
                    {p.appointment && (
                      <> · {p.appointment.type}</>
                    )}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 mr-2">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {p.total_amount.toLocaleString("fr-CD")} USD
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide">
                  {t.unpaid}
                </p>
              </div>
              <CollectPaymentDialog
                paymentId={p.id}
                patientName={name}
                totalAmount={p.total_amount}
                activeMethods={activeMethods}
                hasActiveSession={hasActiveSession}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
