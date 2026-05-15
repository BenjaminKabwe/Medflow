import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Banknote,
  Building2,
  CreditCard,
  Shield,
  Smartphone,
  LayoutList,
  Eye,
} from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getAllCashierSessions } from "@/app/actions/cashier";
import { SearchParamsProps } from "@/types";
import { Role } from "@prisma/client";
import { AdminCloseSessionButton } from "@/components/cashier/admin-close-session-button";

const STATUS_STYLE: Record<string, string> = {
  OPEN:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CLOSED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const METHOD_TOTALS = [
  { key: "total_cash",      label: "Espèces",     Icon: Banknote,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  { key: "total_card",      label: "Carte",       Icon: CreditCard, color: "text-sky-600 dark:text-sky-400",         bg: "bg-sky-50 dark:bg-sky-950/40" },
  { key: "total_mobile",    label: "Mobile",      Icon: Smartphone, color: "text-orange-600 dark:text-orange-400",   bg: "bg-orange-50 dark:bg-orange-950/40" },
  { key: "total_insurance", label: "Assurance",   Icon: Shield,     color: "text-violet-600 dark:text-violet-400",   bg: "bg-violet-50 dark:bg-violet-950/40" },
  { key: "total_transfer",  label: "Virement",    Icon: Building2,  color: "text-slate-600 dark:text-slate-400",     bg: "bg-slate-100 dark:bg-slate-800/50" },
];

type Session = Awaited<ReturnType<typeof getAllCashierSessions>>[number];

function SessionRow({ session }: { session: Session }) {
  const total = session.payments.reduce((s, p) => s + p.amount_paid, 0);
  const duration =
    session.closed_at && session.opened_at
      ? Math.round(
          (new Date(session.closed_at).getTime() -
            new Date(session.opened_at).getTime()) /
            60000
        )
      : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {session.cashier_name}
              </p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[session.status] ?? STATUS_STYLE.CLOSED}`}>
                {session.status === "OPEN" ? "Active" : "Clôturée"}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Session #{session.id} · {format(new Date(session.opened_at), "d MMM yyyy · HH:mm", { locale: fr })}
              {duration !== null && ` · ${duration} min`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">
            {total.toLocaleString("fr-CD")} USD
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {session._count.payments} paiement{session._count.payments !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Method subtotals */}
      <div className="flex flex-wrap gap-2">
        {METHOD_TOTALS.map((m) => {
          const val = (session as Record<string, unknown>)[m.key] as number | null;
          if (!val || val === 0) return null;
          return (
            <div
              key={m.key}
              className="flex items-center gap-1.5 rounded-lg border border-slate-100 dark:border-slate-700/60 px-2.5 py-1.5"
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${m.bg}`}>
                <m.Icon className={`w-3 h-3 ${m.color}`} />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{m.label}</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                {val.toLocaleString("fr-CD")} USD
              </span>
            </div>
          );
        })}
        {Object.values(METHOD_TOTALS).every(
          (m) => !((session as Record<string, unknown>)[m.key] as number)
        ) && (
          <p className="text-xs text-slate-400 italic">Aucun encaissement enregistré.</p>
        )}
      </div>

      {/* Notes */}
      {session.notes && (
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-3">
          {session.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          href={`/admin/cashier-sessions/${session.id}`}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <Eye className="w-3 h-3" />
          Voir détails
        </Link>
        {session.status === "OPEN" && (
          <AdminCloseSessionButton sessionId={session.id} />
        )}
      </div>
    </div>
  );
}

export default async function AdminCashierSessionsPage(props: SearchParamsProps) {
  const user = await getCurrentUser();

  if (!user || user.role !== Role.ADMIN) {
    redirect("/admin");
  }

  const searchParams = await props.searchParams;
  const statusParam = searchParams?.status as "OPEN" | "CLOSED" | undefined;
  const fromParam  = searchParams?.from;
  const toParam    = searchParams?.to;

  const sessions = await getAllCashierSessions({
    status: statusParam,
    from: fromParam ? new Date(fromParam) : undefined,
    to:   toParam   ? new Date(toParam)   : undefined,
  });

  const openCount   = sessions.filter((s) => s.status === "OPEN").length;
  const closedCount = sessions.filter((s) => s.status === "CLOSED").length;
  const grandTotal  = sessions.reduce(
    (sum, s) => sum + s.payments.reduce((a, p) => a + p.amount_paid, 0),
    0
  );

  return (
    <div className="p-6 flex flex-col gap-5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
            <LayoutList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Sessions de caisse
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} · {openCount} active{openCount !== 1 ? "s" : ""} · {closedCount} clôturée{closedCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-2 text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Total encaissé</p>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
              {grandTotal.toLocaleString("fr-CD")} USD
            </p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <form className="flex flex-wrap items-center gap-3" method="GET">
        <select
          name="status"
          defaultValue={statusParam ?? ""}
          className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Toutes les sessions</option>
          <option value="OPEN">Sessions actives</option>
          <option value="CLOSED">Sessions clôturées</option>
        </select>
        <input
          type="date"
          name="from"
          defaultValue={fromParam ?? ""}
          className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="date"
          name="to"
          defaultValue={toParam ?? ""}
          className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          Filtrer
        </button>
        {(statusParam || fromParam || toParam) && (
          <a
            href="/admin/cashier-sessions"
            className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center transition-colors"
          >
            Réinitialiser
          </a>
        )}
      </form>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <LayoutList className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucune session trouvée.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
