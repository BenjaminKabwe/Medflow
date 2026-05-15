import { CreditCard, Banknote, CheckCircle } from "lucide-react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

const PAYMENT_METHODS = [
  {
    id: "CASH",
    label: "Espèces",
    description: "Paiement en liquide à la caisse de l'établissement.",
    icon: Banknote,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900/50",
  },
  {
    id: "CARD",
    label: "Carte bancaire",
    description: "Paiement par carte de crédit ou de débit (Visa, Mastercard).",
    icon: CreditCard,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900/50",
  },
] as const;

export const PaymentSettings = () => {
  return (
    <>
      <CardHeader>
        <CardTitle className="capitalize">Modes de paiement</CardTitle>
        <CardDescription>
          Modes de paiement acceptés par l'établissement.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {PAYMENT_METHODS.map(({ id, label, description, icon: Icon, color, bg, border }) => (
          <div
            key={id}
            className={`flex items-start gap-4 p-4 rounded-xl border ${border} ${bg}`}
          >
            <div className={`mt-0.5 p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {label}
                </p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400`}>
                  <CheckCircle className="w-2.5 h-2.5" />
                  Actif
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-600 self-center">
              {id}
            </span>
          </div>
        ))}

        <p className="text-xs text-slate-400 dark:text-slate-600 pt-2">
          Les modes de paiement sont définis au niveau du système. Contactez votre administrateur technique pour en ajouter de nouveaux.
        </p>
      </CardContent>
    </>
  );
};
