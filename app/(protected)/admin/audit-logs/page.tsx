import { checkRole } from "@/utils/roles";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Logs,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Eye,
  LogIn,
  LogOut,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { AuditAction } from "@/lib/generated/prisma/enums";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const ACTION_CONFIG: Record<
  AuditAction,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  CREATE: {
    label: "Création",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: <Plus className="w-3 h-3" />,
  },
  UPDATE: {
    label: "Modification",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
    icon: <Pencil className="w-3 h-3" />,
  },
  DELETE: {
    label: "Suppression",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    icon: <Trash2 className="w-3 h-3" />,
  },
  VIEW: {
    label: "Consultation",
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
    icon: <Eye className="w-3 h-3" />,
  },
  LOGIN: {
    label: "Connexion",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    icon: <LogIn className="w-3 h-3" />,
  },
  LOGOUT: {
    label: "Déconnexion",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: <LogOut className="w-3 h-3" />,
  },
};

const MODEL_COLORS: Record<string, string> = {
  Patient:     "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Doctor:      "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Staff:       "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Appointment: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Diagnosis:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Payment:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PatientBill: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  Service:     "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  searchParams?: Promise<{ action?: string; model?: string; page?: string }>;
}

const AuditLogsPage = async ({ searchParams }: Props) => {
  const isAdmin = await checkRole("ADMIN");
  if (!isAdmin) redirect("/admin");

  const params = await searchParams;
  const actionFilter = params?.action as AuditAction | undefined;
  const modelFilter  = params?.model;
  const page         = Math.max(1, Number(params?.page ?? 1));
  const skip         = (page - 1) * PAGE_SIZE;

  const where = {
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(modelFilter  ? { model: modelFilter }   : {}),
  };

  // Fetch logs + total count in parallel
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
  ]);

  // Resolve user names (admin / staff / doctor / patient)
  const userIds = [...new Set(logs.map((l) => l.user_id))];
  const [staffList, doctorList, patientList] = userIds.length > 0
    ? await Promise.all([
        db.staff.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, role: true } }),
        db.doctor.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }),
        db.patient.findMany({ where: { id: { in: userIds } }, select: { id: true, first_name: true, last_name: true } }),
      ])
    : [[], [], []];

  const userMap = new Map<string, { name: string; role?: string }>();
  for (const s of staffList)  userMap.set(s.id, { name: s.name, role: s.role });
  for (const d of doctorList) userMap.set(d.id, { name: `Dr. ${d.name}`, role: "DOCTOR" });
  for (const p of patientList) userMap.set(p.id, { name: `${p.first_name} ${p.last_name}`, role: "PATIENT" });

  // Distinct models for filter
  const allModels = await db.auditLog
    .findMany({ distinct: ["model"], select: { model: true } })
    .then((rows) => rows.map((r) => r.model).sort());

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = {
      action: actionFilter,
      model:  modelFilter,
      page:   String(page),
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v);
    }
    return `?${sp.toString()}`;
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Logs className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                Système
              </p>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
                Journaux d&apos;audit
                <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
                  {total.toLocaleString("fr-FR")} entrée{total !== 1 ? "s" : ""}
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            Traçabilité complète
          </div>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />

          {/* Action filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={buildUrl({ action: undefined, page: "1" })}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                !actionFilter
                  ? "bg-slate-800 text-white border-slate-700"
                  : "text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
              }`}
            >
              Toutes
            </Link>
            {(Object.keys(ACTION_CONFIG) as AuditAction[]).map((a) => (
              <Link
                key={a}
                href={buildUrl({ action: a, page: "1" })}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                  actionFilter === a
                    ? `${ACTION_CONFIG[a].color} ${ACTION_CONFIG[a].bg} border-transparent`
                    : "text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                }`}
              >
                {ACTION_CONFIG[a].icon}
                {ACTION_CONFIG[a].label}
              </Link>
            ))}
          </div>

          {allModels.length > 0 && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {allModels.map((m) => (
                  <Link
                    key={m}
                    href={buildUrl({ model: modelFilter === m ? undefined : m, page: "1" })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      modelFilter === m
                        ? MODEL_COLORS[m] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        : "text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                    }`}
                  >
                    {m}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Log list ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Logs className="w-7 h-7 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Aucun journal trouvé
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
              Les actions du système apparaîtront ici au fur et à mesure.
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_120px_110px_120px_2fr] gap-4 px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              {["Horodatage", "Action", "Entité", "Utilisateur", "Détails"].map((h) => (
                <p key={h} className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {h}
                </p>
              ))}
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => {
                const action = ACTION_CONFIG[log.action];
                const modelColor = MODEL_COLORS[log.model] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
                const user = userMap.get(log.user_id);

                return (
                  <li
                    key={log.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_120px_110px_120px_2fr] gap-2 md:gap-4
                               px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Timestamp */}
                    <div className="flex flex-col justify-center">
                      <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                        {format(log.created_at, "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        #{String(log.id).padStart(6, "0")}
                      </p>
                    </div>

                    {/* Action badge */}
                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${action.color} ${action.bg}`}>
                        {action.icon}
                        {action.label}
                      </span>
                    </div>

                    {/* Model badge */}
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${modelColor}`}>
                        {log.model}
                      </span>
                    </div>

                    {/* User */}
                    <div className="flex flex-col justify-center">
                      {user ? (
                        <>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                            {user.name}
                          </p>
                          {user.role && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">
                              {user.role.toLowerCase()}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs font-mono text-slate-400 truncate" title={log.user_id}>
                          {log.user_id.slice(0, 12)}…
                        </p>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex items-center">
                      {log.details ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {log.details}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-300 dark:text-slate-600 italic">—</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-400 dark:text-slate-500">
            Page {page} sur {totalPages} ({total.toLocaleString("fr-FR")} entrées)
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700
                           text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
              >
                ← Précédent
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700
                           text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
              >
                Suivant →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
