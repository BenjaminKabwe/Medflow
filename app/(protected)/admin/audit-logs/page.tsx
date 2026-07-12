import { checkRole } from "@/utils/roles";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { format } from "date-fns";
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
import { fr, enUS } from "date-fns/locale";
import { getLang } from "@/lib/i18n-server";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const STR = {
  fr: {
    system: "Système",
    title: "Journaux d'audit",
    entries: (n: string, plural: boolean) => `${n} entrée${plural ? "s" : ""}`,
    fullTraceability: "Traçabilité complète",
    all: "Toutes",
    noLog: "Aucun journal trouvé",
    noLogDesc: "Les actions du système apparaîtront ici au fur et à mesure.",
    headers: ["Horodatage", "Action", "Entité", "Utilisateur", "Détails"],
    paginationInfo: (p: number, tp: number, n: string) =>
      `Page ${p} sur ${tp} (${n} entrées)`,
    prev: "← Précédent",
    next: "Suivant →",
    numberLocale: "fr-FR",
    actions: {
      CREATE: "Création",
      UPDATE: "Modification",
      DELETE: "Suppression",
      VIEW: "Consultation",
      LOGIN: "Connexion",
      LOGOUT: "Déconnexion",
    } as Record<AuditAction, string>,
  },
  en: {
    system: "System",
    title: "Audit logs",
    entries: (n: string, plural: boolean) => `${n} entr${plural ? "ies" : "y"}`,
    fullTraceability: "Full traceability",
    all: "All",
    noLog: "No log found",
    noLogDesc: "System actions will appear here over time.",
    headers: ["Timestamp", "Action", "Entity", "User", "Details"],
    paginationInfo: (p: number, tp: number, n: string) =>
      `Page ${p} of ${tp} (${n} entries)`,
    prev: "← Previous",
    next: "Next →",
    numberLocale: "en-US",
    actions: {
      CREATE: "Create",
      UPDATE: "Update",
      DELETE: "Delete",
      VIEW: "View",
      LOGIN: "Login",
      LOGOUT: "Logout",
    } as Record<AuditAction, string>,
  },
};

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
  Patient:     "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Doctor:      "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Staff:       "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Appointment: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Diagnosis:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Payment:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PatientBill: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Service:     "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  searchParams?: Promise<{ action?: string; model?: string; page?: string }>;
}

const AuditLogsPage = async ({ searchParams }: Props) => {
  const isAdmin = await checkRole("ADMIN");
  if (!isAdmin) redirect("/admin");

  const lang = await getLang();
  const t = STR[lang];
  const dateLocale = lang === "en" ? enUS : fr;

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
                {t.system}
              </p>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
                {t.title}
                <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
                  {t.entries(total.toLocaleString(t.numberLocale), total !== 1)}
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t.fullTraceability}
          </div>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />

          {/* Action filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={buildUrl({ action: undefined, page: "1" })}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                !actionFilter
                  ? "bg-slate-800 text-white border-slate-700"
                  : "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
              }`}
            >
              {t.all}
            </Link>
            {(Object.keys(ACTION_CONFIG) as AuditAction[]).map((a) => (
              <Link
                key={a}
                href={buildUrl({ action: a, page: "1" })}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                  actionFilter === a
                    ? `${ACTION_CONFIG[a].color} ${ACTION_CONFIG[a].bg} border-transparent`
                    : "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                }`}
              >
                {ACTION_CONFIG[a].icon}
                {t.actions[a]}
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
                        : "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
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
              {t.noLog}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
              {t.noLogDesc}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_120px_110px_120px_2fr] gap-4 px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              {t.headers.map((h) => (
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
                        {format(log.created_at, "dd/MM/yyyy HH:mm:ss", { locale: dateLocale })}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        #{String(log.id).padStart(6, "0")}
                      </p>
                    </div>

                    {/* Action badge */}
                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${action.color} ${action.bg}`}>
                        {action.icon}
                        {t.actions[log.action]}
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
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate" title={log.user_id}>
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
            {t.paginationInfo(page, totalPages, total.toLocaleString(t.numberLocale))}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700
                           text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
              >
                {t.prev}
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700
                           text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
              >
                {t.next}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
