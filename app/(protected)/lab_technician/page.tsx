import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import {
  FlaskConical,
  Clock,
  Loader,
  CheckCircle2,
  ArrowRight,
  User,
} from "lucide-react";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/permissions";
import { getLabStats, getLabTests } from "@/utils/services/lab";
import { formatNumber } from "@/utils";
import { getLabStatusMeta } from "@/components/lab/lab-status";
import { getLang } from "@/lib/i18n-server";

const ALLOWED: Role[] = [Role.LAB_TECHNICIAN, Role.ADMIN];

const STR = {
  fr: {
    labTechDefault: "Laborantin",
    hello: "Bonjour",
    subtitle: (n: number) => `Laboratoire · ${n} analyse(s) à traiter`,
    queue: "File d'attente",
    kpiRequested: "À prendre en charge",
    kpiInProgress: "En cours",
    kpiCompleted: "Terminées",
    recentRequests: "Demandes récentes",
    seeAll: "Tout voir",
    emptyQueue: "Aucune analyse en attente. 🎉",
  },
  en: {
    labTechDefault: "Lab technician",
    hello: "Hello",
    subtitle: (n: number) => `Laboratory · ${n} test(s) to process`,
    queue: "Work queue",
    kpiRequested: "To take charge",
    kpiInProgress: "In progress",
    kpiCompleted: "Completed",
    recentRequests: "Recent requests",
    seeAll: "See all",
    emptyQueue: "No pending test. 🎉",
  },
};

export default async function LabTechnicianDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const lang = await getLang();
  const t = STR[lang];
  const LAB_STATUS_META = getLabStatusMeta(lang);

  const clerkUser = await currentUser();
  const firstName = clerkUser?.firstName ?? t.labTechDefault;

  const [stats, { data: queue }] = await Promise.all([
    getLabStats(),
    getLabTests({ status: "REQUESTED", limit: 6 }),
  ]);

  const kpis = [
    {
      label: t.kpiRequested,
      value: stats.requested,
      icon: Clock,
      color: "text-sky-600",
      bg: "bg-sky-500/10",
    },
    {
      label: t.kpiInProgress,
      value: stats.inProgress,
      icon: Loader,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: t.kpiCompleted,
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <FlaskConical className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t.hello} {firstName}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t.subtitle(stats.pending)}
            </p>
          </div>
        </div>
        <Link
          href="/lab/tests"
          className="inline-flex items-center gap-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 font-medium"
        >
          {t.queue} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-4"
          >
            <div
              className={`w-11 h-11 rounded-xl ${k.bg} flex items-center justify-center`}
            >
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {formatNumber(k.value)}
              </p>
              <p className="text-xs text-slate-400">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t.recentRequests}
          </h2>
          <Link
            href="/lab/tests?status=REQUESTED"
            className="text-xs text-violet-600 hover:underline"
          >
            {t.seeAll}
          </Link>
        </div>
        {queue.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            {t.emptyQueue}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {queue.map((lt) => {
              const meta = LAB_STATUS_META[lt.status];
              return (
                <li
                  key={lt.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {lt.services.service_name}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      {lt.medical_record.patient.first_name}{" "}
                      {lt.medical_record.patient.last_name}
                      {lt.requested_by_name ? ` · ${lt.requested_by_name}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${meta.badge}`}
                  >
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
