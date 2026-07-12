import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import {
  Pill,
  Boxes,
  AlertTriangle,
  PackageMinus,
  CalendarClock,
  User,
  ArrowRight,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import {
  getPharmacistDailyStats,
  getPharmacyDashboardStats,
  getLowStockMedications,
  getExpiringStocks,
  EXPIRY_CRITICAL_DAYS,
} from "@/utils/services/pharmacy";
import { formatNumber } from "@/utils";
import { Role } from "@prisma/client";
import { getLang } from "@/lib/i18n-server";

const ALLOWED: Role[] = [Role.PHARMACIST, Role.ADMIN];

const STR = {
  fr: {
    pharmacistDefault: "Pharmacien",
    morning: "Bonjour",
    afternoon: "Bon après-midi",
    evening: "Bonsoir",
    space: "Espace pharmacien",
    subtitle: "Voici ton activité du jour à la pharmacie.",
    dispensations: "Dispensations",
    inventory: "Inventaire",
    attentionRequired: "Attention requise",
    lowStockMsg: (n: number) =>
      `${n} médicament${n > 1 ? "s" : ""} en stock bas`,
    expiryMsg: (n: number, days: number) =>
      `${n} lot${n > 1 ? "s" : ""} proche${n > 1 ? "s" : ""} péremption (≤ ${days}j)`,
    seeAlerts: "Voir les alertes →",
    todayActivity: "Ton activité aujourd'hui",
    statDispensations: "Dispensations",
    statDispensationsNote: "que tu as effectuées",
    statPatients: "Patients servis",
    statPatientsNote: "uniques",
    statRevenue: "Chiffre d'affaires",
    statRevenueNote: "généré aujourd'hui",
    statTotal: "Total pharmacie",
    statTotalNote: (fc: string) => `dispensations (${fc})`,
    overview: "Vue d'ensemble pharmacie",
    activeMeds: "Médicaments actifs",
    unitsInStock: "Unités en stock",
    lowStock: "Stock bas",
    expiry90: "Péremption < 90j",
    myRecent: "Mes dernières dispensations",
    seeAll: "Voir tout →",
    noDispensation: "Aucune dispensation encore.",
    dispensationsHere: "Tes délivrances apparaîtront ici.",
    articles: (n: number) => `${n} article${n > 1 ? "s" : ""} —`,
    quickActions: "Actions rapides",
    qaNewDispensation: "Nouvelle dispensation",
    qaStockEntry: "Entrée en stock",
    qaAddMed: "Ajouter un médicament",
    qaSuppliers: "Gérer les fournisseurs",
    qaAlerts: "Voir les alertes",
  },
  en: {
    pharmacistDefault: "Pharmacist",
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    space: "Pharmacist space",
    subtitle: "Here is your activity today at the pharmacy.",
    dispensations: "Dispensations",
    inventory: "Inventory",
    attentionRequired: "Attention required",
    lowStockMsg: (n: number) =>
      `${n} medication${n > 1 ? "s" : ""} low on stock`,
    expiryMsg: (n: number, days: number) =>
      `${n} batch${n > 1 ? "es" : ""} near expiry (≤ ${days}d)`,
    seeAlerts: "View alerts →",
    todayActivity: "Your activity today",
    statDispensations: "Dispensations",
    statDispensationsNote: "you handled",
    statPatients: "Patients served",
    statPatientsNote: "unique",
    statRevenue: "Revenue",
    statRevenueNote: "generated today",
    statTotal: "Pharmacy total",
    statTotalNote: (fc: string) => `dispensations (${fc})`,
    overview: "Pharmacy overview",
    activeMeds: "Active medications",
    unitsInStock: "Units in stock",
    lowStock: "Low stock",
    expiry90: "Expiry < 90d",
    myRecent: "My latest dispensations",
    seeAll: "View all →",
    noDispensation: "No dispensation yet.",
    dispensationsHere: "Your dispensations will appear here.",
    articles: (n: number) => `${n} item${n > 1 ? "s" : ""} —`,
    quickActions: "Quick actions",
    qaNewDispensation: "New dispensation",
    qaStockEntry: "Stock entry",
    qaAddMed: "Add a medication",
    qaSuppliers: "Manage suppliers",
    qaAlerts: "View alerts",
  },
};

function formatFC(amount: number) {
  return `${formatNumber(amount)} FC`;
}

export default async function PharmacistDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const t = STR[await getLang()];
  const clerkUser = await currentUser();
  const firstName = clerkUser?.firstName ?? t.pharmacistDefault;

  const [dailyStats, globalStats, lowStock, criticalExpiry] = await Promise.all([
    getPharmacistDailyStats(user.userId),
    getPharmacyDashboardStats(),
    getLowStockMedications(),
    getExpiringStocks(EXPIRY_CRITICAL_DAYS),
  ]);

  const hasAlerts = lowStock.length > 0 || criticalExpiry.length > 0;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t.morning : hour < 18 ? t.afternoon : t.evening;

  return (
    <div className="flex flex-col gap-6">
      {/* Header - Greeting */}
      <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 dark:from-sky-600 dark:to-sky-800 p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">
              {t.space}
            </p>
            <h1 className="text-2xl font-bold mt-1">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-sm opacity-90 mt-1">
              {t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/pharmacy/dispensation"
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 text-sm font-medium transition-colors"
            >
              <Pill className="w-4 h-4" /> {t.dispensations}
            </Link>
            <Link
              href="/pharmacy/inventory"
              className="inline-flex items-center gap-2 rounded-lg bg-white text-sky-700 px-4 py-2 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              <Boxes className="w-4 h-4" /> {t.inventory}
            </Link>
          </div>
        </div>
      </div>

      {/* Alerts banner (if any) */}
      {hasAlerts && (
        <div className="rounded-2xl border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
              {t.attentionRequired}
            </p>
            <p className="text-xs text-orange-800 dark:text-orange-300 mt-0.5">
              {lowStock.length > 0 && <span>{t.lowStockMsg(lowStock.length)}</span>}
              {lowStock.length > 0 && criticalExpiry.length > 0 && " · "}
              {criticalExpiry.length > 0 && (
                <span>
                  {t.expiryMsg(criticalExpiry.length, EXPIRY_CRITICAL_DAYS)}
                </span>
              )}
            </p>
          </div>
          <Link
            href="/pharmacy/alerts"
            className="text-xs font-semibold text-orange-700 hover:underline whitespace-nowrap"
          >
            {t.seeAlerts}
          </Link>
        </div>
      )}

      {/* KPI du jour */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
          {t.todayActivity}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MyStatCard
            label={t.statDispensations}
            value={dailyStats.dispensationsToday}
            note={t.statDispensationsNote}
            icon={<Pill className="w-5 h-5 text-sky-500" />}
            bg="bg-sky-500/10"
          />
          <MyStatCard
            label={t.statPatients}
            value={dailyStats.patientsToday}
            note={t.statPatientsNote}
            icon={<Users className="w-5 h-5 text-sky-500" />}
            bg="bg-sky-500/10"
          />
          <MyStatCard
            label={t.statRevenue}
            value={dailyStats.revenueToday}
            note={t.statRevenueNote}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            bg="bg-emerald-500/10"
            asCurrency
          />
          <MyStatCard
            label={t.statTotal}
            value={dailyStats.globalDispensationsToday}
            note={t.statTotalNote(formatFC(dailyStats.globalRevenueToday))}
            icon={<Receipt className="w-5 h-5 text-sky-500" />}
            bg="bg-sky-500/10"
          />
        </div>
      </div>

      {/* KPI globaux pharmacie */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">
          {t.overview}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/pharmacy/medications"
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Pill className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {formatNumber(globalStats.activeMedications)}
              </p>
              <p className="text-xs text-slate-500">{t.activeMeds}</p>
            </div>
          </Link>
          <Link
            href="/pharmacy/inventory"
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {formatNumber(globalStats.totalUnitsInStock)}
              </p>
              <p className="text-xs text-slate-500">{t.unitsInStock}</p>
            </div>
          </Link>
          <Link
            href="/pharmacy/alerts"
            className={`rounded-2xl border p-4 hover:shadow-md transition-shadow flex items-center gap-3 ${
              globalStats.lowStockCount > 0
                ? "border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/10"
                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <PackageMinus className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {formatNumber(globalStats.lowStockCount)}
              </p>
              <p className="text-xs text-slate-500">{t.lowStock}</p>
            </div>
          </Link>
          <Link
            href="/pharmacy/alerts"
            className={`rounded-2xl border p-4 hover:shadow-md transition-shadow flex items-center gap-3 ${
              globalStats.expiringSoonCount > 0
                ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10"
                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {formatNumber(globalStats.expiringSoonCount)}
              </p>
              <p className="text-xs text-slate-500">{t.expiry90}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent dispensations + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t.myRecent}
            </h2>
            <Link
              href="/pharmacy/dispensation"
              className="text-[11px] text-sky-500 font-medium hover:underline"
            >
              {t.seeAll}
            </Link>
          </div>

          {dailyStats.recentDispensations.length === 0 ? (
            <div className="py-12 text-center">
              <Pill className="w-8 h-8 text-slate-600 dark:text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.noDispensation}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t.dispensationsHere}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {dailyStats.recentDispensations.map((d) => (
                <li key={d.id} className="py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {d.patient.first_name} {d.patient.last_name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {t.articles(d.items.length)}{" "}
                      {d.items
                        .map((i) => i.medication.name)
                        .slice(0, 2)
                        .join(", ")}
                      {d.items.length > 2 && ", …"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {formatFC(d.total_amount)}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {d.reference}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
            {t.quickActions}
          </h2>
          <div className="space-y-2">
            <QuickAction
              href="/pharmacy/dispensation"
              label={t.qaNewDispensation}
              icon={<Pill className="w-4 h-4" />}
              highlight
            />
            <QuickAction
              href="/pharmacy/inventory"
              label={t.qaStockEntry}
              icon={<Boxes className="w-4 h-4" />}
            />
            <QuickAction
              href="/pharmacy/medications"
              label={t.qaAddMed}
              icon={<Pill className="w-4 h-4" />}
            />
            <QuickAction
              href="/pharmacy/suppliers"
              label={t.qaSuppliers}
              icon={<User className="w-4 h-4" />}
            />
            <QuickAction
              href="/pharmacy/alerts"
              label={t.qaAlerts}
              icon={<AlertTriangle className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MyStatCard({
  label,
  value,
  note,
  icon,
  bg,
  asCurrency,
}: {
  label: string;
  value: number;
  note: string;
  icon: React.ReactNode;
  bg: string;
  asCurrency?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col gap-2">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none tracking-tight">
        {asCurrency ? formatFC(value) : formatNumber(value)}
      </p>
      <div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{note}</p>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon,
  highlight,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
        highlight
          ? "bg-sky-500 hover:bg-sky-600 text-white font-medium"
          : "border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className={highlight ? "text-white/80" : "text-slate-500 dark:text-slate-400"}>
          {icon}
        </span>
        {label}
      </span>
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  );
}
