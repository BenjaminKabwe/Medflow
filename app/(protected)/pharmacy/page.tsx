import Link from "next/link";
import {
  Pill,
  Package,
  AlertTriangle,
  PackageMinus,
  Truck,
  Receipt,
  ArrowRight,
  Boxes,
  Activity,
  CalendarClock,
} from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import {
  getPharmacyDashboardStats,
  getLowStockMedications,
  getExpiringStocks,
  EXPIRY_ALERT_DAYS,
} from "@/utils/services/pharmacy";
import { formatNumber } from "@/utils";
import { getLang } from "@/lib/i18n-server";
import { Role } from "@prisma/client";

const STR = {
  fr: {
    title: "Pharmacie",
    subtitle: "Catalogue, stock, dispensation et alertes",
    kpiMedications: "Médicaments",
    kpiMedicationsNote: (n: number) => `sur ${n} au catalogue`,
    kpiUnitsInStock: "Unités en stock",
    kpiUnitsNote: "tous lots valides",
    kpiSuppliers: "Fournisseurs",
    kpiSuppliersNote: "actifs",
    kpiLowStock: "Stock bas",
    kpiLowStockNote: "à réapprovisionner",
    kpiExpiring: "Péremption < 90j",
    kpiExpiringNote: "lots à surveiller",
    kpiExpired: "Périmés",
    kpiExpiredNote: "à retirer",
    dispensations30: "Dispensations (30 derniers jours)",
    seeAll: "Voir toutes →",
    count: "Nombre",
    revenue: "Chiffre d'affaires",
    quickActions: "Actions rapides",
    dispense: "Dispenser",
    addStock: "Ajouter stock",
    catalogue: "Catalogue",
    suppliers: "Fournisseurs",
    lowStockTitle: "Stock bas",
    lowStockEmpty: "Tous les stocks sont au-dessus du seuil de réappro.",
    expiryTitle: (n: number) => `Péremption ≤ ${n} jours`,
    expiryEmpty: "Aucun lot proche de la péremption.",
    details: "Détails →",
    stockThreshold: (stock: number, level: number) => `${stock} / seuil ${level}`,
    batchQty: (batch: string, qty: number) => `Lot ${batch} · qty ${qty}`,
    daysShort: (n: number) => `${n}j`,
  },
  en: {
    title: "Pharmacy",
    subtitle: "Catalogue, stock, dispensing and alerts",
    kpiMedications: "Medications",
    kpiMedicationsNote: (n: number) => `of ${n} in catalogue`,
    kpiUnitsInStock: "Units in stock",
    kpiUnitsNote: "all valid batches",
    kpiSuppliers: "Suppliers",
    kpiSuppliersNote: "active",
    kpiLowStock: "Low stock",
    kpiLowStockNote: "to restock",
    kpiExpiring: "Expiring < 90d",
    kpiExpiringNote: "batches to watch",
    kpiExpired: "Expired",
    kpiExpiredNote: "to remove",
    dispensations30: "Dispensations (last 30 days)",
    seeAll: "See all →",
    count: "Count",
    revenue: "Revenue",
    quickActions: "Quick actions",
    dispense: "Dispense",
    addStock: "Add stock",
    catalogue: "Catalogue",
    suppliers: "Suppliers",
    lowStockTitle: "Low stock",
    lowStockEmpty: "All stocks are above the reorder threshold.",
    expiryTitle: (n: number) => `Expiry ≤ ${n} days`,
    expiryEmpty: "No batch close to expiry.",
    details: "Details →",
    stockThreshold: (stock: number, level: number) => `${stock} / threshold ${level}`,
    batchQty: (batch: string, qty: number) => `Batch ${batch} · qty ${qty}`,
    daysShort: (n: number) => `${n}d`,
  },
} as const;

const ALLOWED_ROLES: Role[] = [
  Role.ADMIN,
  Role.PHARMACIST,
  Role.DOCTOR,
  Role.NURSE,
];

function formatFC(amount: number) {
  return `${formatNumber(amount)} FC`;
}

export default async function PharmacyDashboard() {
  const t = STR[await getLang()];
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED_ROLES.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  // Accès par sous-module de la pharmacie (miroir de lib/routes.ts).
  // On ne rend que les tuiles/actions que le rôle courant peut réellement ouvrir,
  // pour éviter qu'un clic ne redirige vers le tableau de bord.
  const PHARMACY_ACCESS: Record<string, Role[]> = {
    "/pharmacy/medications": [Role.ADMIN, Role.PHARMACIST, Role.DOCTOR],
    "/pharmacy/inventory": [Role.ADMIN, Role.PHARMACIST],
    "/pharmacy/suppliers": [Role.ADMIN, Role.PHARMACIST],
    "/pharmacy/purchase-orders": [Role.ADMIN, Role.PHARMACIST],
    "/pharmacy/prescriptions": [Role.ADMIN, Role.PHARMACIST],
    "/pharmacy/dispensation": [Role.ADMIN, Role.PHARMACIST, Role.NURSE],
    "/pharmacy/alerts": [Role.ADMIN, Role.PHARMACIST],
  };
  const canAccess = (href: string) => {
    const roles = PHARMACY_ACCESS[href];
    return !roles || roles.includes(user.role);
  };

  const [stats, lowStock, expiringSoon] = await Promise.all([
    getPharmacyDashboardStats(),
    getLowStockMedications(),
    getExpiringStocks(EXPIRY_ALERT_DAYS),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
          <Pill className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {t.title}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          title={t.kpiMedications}
          value={stats.activeMedications}
          note={t.kpiMedicationsNote(stats.medicationsCount)}
          icon={<Pill className="w-5 h-5 text-sky-500" />}
          bg="bg-sky-500/10"
          href="/pharmacy/medications"
        />
        {canAccess("/pharmacy/inventory") && (
          <KpiCard
            title={t.kpiUnitsInStock}
            value={stats.totalUnitsInStock}
            note={t.kpiUnitsNote}
            icon={<Boxes className="w-5 h-5 text-sky-500" />}
            bg="bg-sky-500/10"
            href="/pharmacy/inventory"
          />
        )}
        {canAccess("/pharmacy/suppliers") && (
          <KpiCard
            title={t.kpiSuppliers}
            value={stats.suppliersCount}
            note={t.kpiSuppliersNote}
            icon={<Truck className="w-5 h-5 text-sky-500" />}
            bg="bg-sky-500/10"
            href="/pharmacy/suppliers"
          />
        )}
        {canAccess("/pharmacy/alerts") && (
          <>
            <KpiCard
              title={t.kpiLowStock}
              value={stats.lowStockCount}
              note={t.kpiLowStockNote}
              icon={<PackageMinus className="w-5 h-5 text-orange-500" />}
              bg="bg-orange-500/10"
              href="/pharmacy/alerts"
              highlight={stats.lowStockCount > 0}
            />
            <KpiCard
              title={t.kpiExpiring}
              value={stats.expiringSoonCount}
              note={t.kpiExpiringNote}
              icon={<CalendarClock className="w-5 h-5 text-amber-500" />}
              bg="bg-amber-500/10"
              href="/pharmacy/alerts"
              highlight={stats.expiringSoonCount > 0}
            />
            <KpiCard
              title={t.kpiExpired}
              value={stats.expiredCount}
              note={t.kpiExpiredNote}
              icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
              bg="bg-red-500/10"
              href="/pharmacy/alerts"
              highlight={stats.expiredCount > 0}
            />
          </>
        )}
      </div>

      {/* Activity row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t.dispensations30}
              </h2>
            </div>
            {canAccess("/pharmacy/dispensation") && (
              <Link
                href="/pharmacy/dispensation"
                className="text-[11px] text-sky-500 font-medium hover:underline"
              >
                {t.seeAll}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {formatNumber(stats.dispensationsMonth)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{t.count}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {formatFC(stats.dispensationsRevenueMonth)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{t.revenue}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t.quickActions}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {canAccess("/pharmacy/dispensation") && (
              <QuickAction href="/pharmacy/dispensation" label={t.dispense} icon={<Pill className="w-4 h-4" />} />
            )}
            {canAccess("/pharmacy/inventory") && (
              <QuickAction href="/pharmacy/inventory" label={t.addStock} icon={<Package className="w-4 h-4" />} />
            )}
            {canAccess("/pharmacy/medications") && (
              <QuickAction href="/pharmacy/medications" label={t.catalogue} icon={<Boxes className="w-4 h-4" />} />
            )}
            {canAccess("/pharmacy/suppliers") && (
              <QuickAction href="/pharmacy/suppliers" label={t.suppliers} icon={<Truck className="w-4 h-4" />} />
            )}
          </div>
        </div>
      </div>

      {/* Alerts sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AlertPanel
          title={t.lowStockTitle}
          count={lowStock.length}
          color="orange"
          empty={t.lowStockEmpty}
          href={canAccess("/pharmacy/alerts") ? "/pharmacy/alerts" : undefined}
          detailsLabel={t.details}
        >
          {lowStock.slice(0, 6).map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-slate-700 dark:text-slate-200 truncate font-medium">
                  {m.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {m.dci} · {m.dosage}
                </p>
              </div>
              <span className="text-xs font-semibold text-orange-600">
                {t.stockThreshold(m.totalStock, m.reorder_level)}
              </span>
            </li>
          ))}
        </AlertPanel>

        <AlertPanel
          title={t.expiryTitle(EXPIRY_ALERT_DAYS)}
          count={expiringSoon.length}
          color="amber"
          empty={t.expiryEmpty}
          href={canAccess("/pharmacy/alerts") ? "/pharmacy/alerts" : undefined}
          detailsLabel={t.details}
        >
          {expiringSoon.slice(0, 6).map((s) => {
            const days = Math.max(
              0,
              Math.floor(
                (s.expiry_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )
            );
            return (
              <li
                key={s.id}
                className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-slate-700 dark:text-slate-200 truncate font-medium">
                    {s.medication.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {t.batchQty(s.batch_number, s.quantity)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-600">
                  {t.daysShort(days)}
                </span>
              </li>
            );
          })}
        </AlertPanel>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  note,
  icon,
  bg,
  href,
  highlight,
}: {
  title: string;
  value: number;
  note: string;
  icon: React.ReactNode;
  bg: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-4 flex flex-col gap-3 bg-white dark:bg-slate-900 transition-shadow hover:shadow-md ${
        highlight
          ? "border-orange-200 dark:border-orange-900/40"
          : "border-slate-100 dark:border-slate-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          {icon}
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none tracking-tight">
        {formatNumber(value)}
      </p>
      <div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {title}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          {note}
        </p>
      </div>
    </Link>
  );
}

function QuickAction({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
    >
      <span className="text-slate-400">{icon}</span>
      {label}
    </Link>
  );
}

function AlertPanel({
  title,
  count,
  color,
  empty,
  href,
  detailsLabel,
  children,
}: {
  title: string;
  count: number;
  color: "orange" | "amber" | "red";
  empty: string;
  href?: string;
  detailsLabel: string;
  children: React.ReactNode;
}) {
  const badgeClass =
    color === "orange"
      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
      : color === "amber"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {title}
          </h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeClass}`}>
            {count}
          </span>
        </div>
        {href && (
          <Link
            href={href}
            className="text-[11px] text-sky-500 font-medium hover:underline"
          >
            {detailsLabel}
          </Link>
        )}
      </div>
      {count === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">{empty}</p>
      ) : (
        <ul>{children}</ul>
      )}
    </div>
  );
}
