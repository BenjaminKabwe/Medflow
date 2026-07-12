import { AlertTriangle, PackageMinus, CalendarClock } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import {
  getLowStockMedications,
  getExpiringStocks,
  getExpiredStocks,
  EXPIRY_ALERT_DAYS,
} from "@/utils/services/pharmacy";
import { formatNumber } from "@/utils";
import { Role } from "@prisma/client";
import { getLang } from "@/lib/i18n-server";

const ALLOWED: Role[] = [Role.ADMIN, Role.PHARMACIST];

const STR = {
  fr: {
    title: "Alertes pharmacie",
    subtitle: "Ruptures et péremptions à surveiller de près",
    lowStockTitle: "Stock bas",
    lowStockNote: (n: number) =>
      `${n} médicament${n > 1 ? "s" : ""} sous le seuil`,
    lowStockEmpty: "Aucun médicament sous le seuil de réappro.",
    currentStock: "Stock actuel",
    threshold: "Seuil",
    expiringTitle: (days: number) => `Péremption proche (≤ ${days} jours)`,
    batchesNote: (n: number) => `${n} lot${n > 1 ? "s" : ""}`,
    expiringEmpty: "Aucun lot proche de la péremption.",
    batch: "Lot",
    qty: "qté",
    expiredTitle: "Périmés",
    expiredNote: (n: number) => `${n} lot${n > 1 ? "s" : ""} à retirer`,
    expiredEmpty: "Aucun lot périmé — rien à retirer.",
    expiredSince: (d: number) => `Périmé depuis ${d}j`,
    dateLocale: "fr-FR",
  },
  en: {
    title: "Pharmacy alerts",
    subtitle: "Shortages and expiries to watch closely",
    lowStockTitle: "Low stock",
    lowStockNote: (n: number) =>
      `${n} medication${n > 1 ? "s" : ""} below threshold`,
    lowStockEmpty: "No medication below the reorder threshold.",
    currentStock: "Current stock",
    threshold: "Threshold",
    expiringTitle: (days: number) => `Near expiry (≤ ${days} days)`,
    batchesNote: (n: number) => `${n} batch${n > 1 ? "es" : ""}`,
    expiringEmpty: "No batch near expiry.",
    batch: "Batch",
    qty: "qty",
    expiredTitle: "Expired",
    expiredNote: (n: number) => `${n} batch${n > 1 ? "es" : ""} to remove`,
    expiredEmpty: "No expired batch — nothing to remove.",
    expiredSince: (d: number) => `Expired ${d}d ago`,
    dateLocale: "en-GB",
  },
};

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const t = STR[await getLang()];

  const [lowStock, expiringSoon, expired] = await Promise.all([
    getLowStockMedications(),
    getExpiringStocks(EXPIRY_ALERT_DAYS),
    getExpiredStocks(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
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

      {/* Low stock */}
      <Section
        title={t.lowStockTitle}
        note={t.lowStockNote(lowStock.length)}
        icon={<PackageMinus className="w-4 h-4 text-orange-500" />}
        empty={t.lowStockEmpty}
      >
        {lowStock.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
          >
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                {m.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {m.dci} · {m.dosage} · {m.category ?? "—"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.currentStock}</p>
                <p className="font-bold text-orange-600">
                  {formatNumber(m.totalStock)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.threshold}</p>
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  {m.reorder_level}
                </p>
              </div>
            </div>
          </div>
        ))}
      </Section>

      {/* Expiring soon */}
      <Section
        title={t.expiringTitle(EXPIRY_ALERT_DAYS)}
        note={t.batchesNote(expiringSoon.length)}
        icon={<CalendarClock className="w-4 h-4 text-amber-500" />}
        empty={t.expiringEmpty}
      >
        {expiringSoon.map((s) => {
          const days = Math.max(
            0,
            Math.floor(
              (s.expiry_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          );
          return (
            <div
              key={s.id}
              className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                  {s.medication.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {t.batch} {s.batch_number} · {t.qty} {formatNumber(s.quantity)}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                    days <= 30
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}
                >
                  {days}j
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {s.expiry_date.toLocaleDateString(t.dateLocale)}
                </p>
              </div>
            </div>
          );
        })}
      </Section>

      {/* Expired */}
      <Section
        title={t.expiredTitle}
        note={t.expiredNote(expired.length)}
        icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
        empty={t.expiredEmpty}
      >
        {expired.map((s) => {
          const daysAgo = Math.floor(
            (Date.now() - s.expiry_date.getTime()) / (1000 * 60 * 60 * 24)
          );
          return (
            <div
              key={s.id}
              className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                  {s.medication.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {t.batch} {s.batch_number} · {t.qty} {formatNumber(s.quantity)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {t.expiredSince(daysAgo)}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {s.expiry_date.toLocaleDateString(t.dateLocale)}
                </p>
              </div>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

function Section({
  title,
  note,
  icon,
  empty,
  children,
}: {
  title: string;
  note: string;
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode;
}) {
  const isEmpty = Array.isArray(children) ? children.length === 0 : !children;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {title}
        </h2>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">— {note}</span>
      </div>
      {isEmpty ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">{empty}</p>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}
