import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Banknote,
  LayoutList,
  Eye,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Hash,
} from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { AdminCloseSessionButton } from "@/components/cashier/admin-close-session-button";
import { getAllSessions } from "@/lib/sessions-caisse";
import { SearchParamsProps } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  OPEN:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CLOSED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function totalEncaisse(session: { payments: { amount_paid: number }[] }) {
  return session.payments.reduce((s, p) => s + p.amount_paid, 0);
}

// ── Session card ──────────────────────────────────────────────────────────────

type Session = Awaited<ReturnType<typeof getAllSessions>>[number];

function SessionCard({ session, index }: { session: Session; index: number }) {
  const total    = totalEncaisse(session);
  const isActive = session.status === "OPEN";

  const duration =
    session.closed_at && session.opened_at
      ? Math.round(
          (new Date(session.closed_at).getTime() -
            new Date(session.opened_at).getTime()) /
            60000
        )
      : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        {/* Left: ID + caissier */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
            <Hash className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Session #{index + 1}
              </p>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  STATUS_STYLE[session.status] ?? STATUS_STYLE.CLOSED
                }`}
              >
                {isActive ? "Active" : "Clôturée"}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {session.cashier_name} ·{" "}
              {format(new Date(session.opened_at), "d MMM yyyy · HH:mm", {
                locale: fr,
              })}
              {duration !== null && ` · ${duration} min`}
            </p>
          </div>
        </div>

        {/* Right: total */}
        <div className="text-right">
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">
            {total.toLocaleString("fr-CD")} USD
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {session._count.payments}{" "}
            {session._count.payments !== 1 ? "paiements" : "paiement"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          href={`/administration/sessions-de-caisse/${session.id}`}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <Eye className="w-3 h-3" />
          Voir détails
        </Link>
        {isActive && <AdminCloseSessionButton sessionId={session.id} />}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SessionsDeCaissePage(props: SearchParamsProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) redirect("/admin");

  const searchParams = await props.searchParams;
  const statutParam  = searchParams?.statut as "OPEN" | "CLOSED" | undefined;
  const fromParam    = searchParams?.from;
  const toParam      = searchParams?.to;

  const sessions = await getAllSessions({
    statut: statutParam,
    from:   fromParam ? new Date(fromParam) : undefined,
    to:     toParam   ? new Date(toParam)   : undefined,
  });

  const activeCount = sessions.filter((s) => s.status === "OPEN").length;
  const closedCount = sessions.filter((s) => s.status === "CLOSED").length;
  const grandTotal  = sessions.reduce((sum, s) => sum + totalEncaisse(s), 0);
  const totalPaiements = sessions.reduce((sum, s) => sum + s._count.payments, 0);

  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
            <LayoutList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Sessions de Caisse
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} ·{" "}
              {activeCount} active{activeCount !== 1 ? "s" : ""} ·{" "}
              {closedCount} clôturée{closedCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-2 text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            Total encaissé
          </p>
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">
            {grandTotal.toLocaleString("fr-CD")} USD
          </p>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total sessions"
          value={sessions.length.toString()}
          Icon={LayoutList}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          label="Sessions actives"
          value={activeCount.toString()}
          Icon={CheckCircle2}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          label="Sessions clôturées"
          value={closedCount.toString()}
          Icon={XCircle}
          color="text-slate-500 dark:text-slate-400"
          bg="bg-slate-100 dark:bg-slate-800/50"
        />
        <StatCard
          label="Paiements total"
          value={totalPaiements.toString()}
          Icon={TrendingUp}
          color="text-violet-600 dark:text-violet-400"
          bg="bg-violet-50 dark:bg-violet-950/40"
        />
      </div>

      {/* ── Filters ── */}
      <form className="flex flex-wrap items-center gap-3" method="GET">
        <select
          name="statut"
          defaultValue={statutParam ?? ""}
          className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes les sessions</option>
          <option value="OPEN">Sessions actives</option>
          <option value="CLOSED">Sessions clôturées</option>
        </select>
        <input
          type="date"
          name="from"
          defaultValue={fromParam ?? ""}
          className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          name="to"
          defaultValue={toParam ?? ""}
          className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          Filtrer
        </button>
        {(statutParam || fromParam || toParam) && (
          <a
            href="/administration/sessions-de-caisse"
            className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center transition-colors"
          >
            Réinitialiser
          </a>
        )}
      </form>

      {/* ── Sessions list ── */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Banknote className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucune session de caisse trouvée.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-xs">
            Les sessions sont créées automatiquement lors du premier paiement validé,
            ou manuellement depuis le tableau de bord caissier.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session, index) => (
            <SessionCard key={session.id} session={session} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stat card helper ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}
