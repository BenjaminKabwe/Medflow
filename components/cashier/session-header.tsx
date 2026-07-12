"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, DollarSign } from "lucide-react";
import { OpenSessionDialog } from "./open-session-dialog";
import { CloseSessionDialog } from "./close-session-dialog";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    cashSession: "Session de caisse",
    noActiveSession: "Aucune session active",
    noActiveHint: "Ouvrez une session pour commencer à encaisser des paiements.",
    opening: "Ouverture",
    initialFund: "Fond initial",
    atOpening: "à l'ouverture",
    collections: "Encaissements",
    payments: (n: number) => `${n} paiement${n !== 1 ? "s" : ""}`,
    sessionNo: (n: number) => `Session #${n}`,
    active: "Active",
    currentSession: "Session en cours",
  },
  en: {
    cashSession: "Cash session",
    noActiveSession: "No active session",
    noActiveHint: "Open a session to start collecting payments.",
    opening: "Opening",
    initialFund: "Initial float",
    atOpening: "at opening",
    collections: "Collections",
    payments: (n: number) => `${n} payment${n !== 1 ? "s" : ""}`,
    sessionNo: (n: number) => `Session #${n}`,
    active: "Active",
    currentSession: "Current session",
  },
} as const;

interface SessionHeaderProps {
  session: {
    id: number;
    opened_at: Date;
    opening_amount: number;
    payments: { amount_paid: number; payment_method: string }[];
  } | null;
}

export function SessionHeader({ session }: SessionHeaderProps) {
  const { lang } = useLanguage();
  const t = STR[lang];
  if (!session) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              {t.cashSession}
            </p>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {t.noActiveSession}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t.noActiveHint}
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
      label: t.opening,
      value: format(new Date(session.opened_at), "HH:mm", { locale: fr }),
      sub: format(new Date(session.opened_at), "d MMM", { locale: fr }),
      icon: Clock,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/40",
    },
    {
      label: t.initialFund,
      value: `${session.opening_amount.toLocaleString("fr-CD")} USD`,
      sub: t.atOpening,
      icon: DollarSign,
      color: "text-slate-600 dark:text-slate-300",
      bg: "bg-slate-100 dark:bg-slate-800/50",
    },
    {
      label: t.collections,
      value: `${totalCollected.toLocaleString("fr-CD")} USD`,
      sub: t.payments(session.payments.length),
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
              {t.sessionNo(session.id)}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t.active}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t.currentSession}
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
