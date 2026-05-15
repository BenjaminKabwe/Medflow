"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, DollarSign } from "lucide-react";
import { OpenSessionDialog } from "./open-session-dialog";
import { CloseSessionDialog } from "./close-session-dialog";

interface SessionHeaderProps {
  session: {
    id: number;
    opened_at: Date;
    opening_amount: number;
    payments: { amount_paid: number; payment_method: string }[];
  } | null;
}

export function SessionHeader({ session }: SessionHeaderProps) {
  if (!session) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Session de caisse
            </p>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Aucune session active
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Ouvrez une session pour commencer à encaisser des paiements.
            </p>
          </div>
          <OpenSessionDialog />
        </div>
      </div>
    );
  }

  const totalCollected = session.payments.reduce(
    (sum, p) => sum + p.amount_paid,
    0
  );

  const stats = [
    {
      label: "Ouverture",
      value: format(new Date(session.opened_at), "HH:mm", { locale: fr }),
      sub: format(new Date(session.opened_at), "d MMM", { locale: fr }),
      icon: Clock,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/40",
    },
    {
      label: "Fond initial",
      value: `${session.opening_amount.toLocaleString("fr-CD")} USD`,
      sub: "à l'ouverture",
      icon: DollarSign,
      color: "text-slate-600 dark:text-slate-300",
      bg: "bg-slate-100 dark:bg-slate-800/50",
    },
    {
      label: "Encaissements",
      value: `${totalCollected.toLocaleString("fr-CD")} USD`,
      sub: `${session.payments.length} paiement${session.payments.length !== 1 ? "s" : ""}`,
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Session #{session.id}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Session en cours
          </h2>
        </div>
        <CloseSessionDialog sessionId={session.id} totalCollected={totalCollected} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-700/60 px-4 py-3"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 dark:text-slate-500">{s.label}</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {s.value}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
