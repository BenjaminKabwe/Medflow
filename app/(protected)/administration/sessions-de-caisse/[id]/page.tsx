import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Receipt,
  Banknote,
  CreditCard,
  Smartphone,
  Shield,
  Building2,
} from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { AdminCloseSessionButton } from "@/components/cashier/admin-close-session-button";
import { getSessionById } from "@/lib/sessions-caisse";
import { PdfDownloadButton } from "@/components/pdf-download-button";
import { getLang } from "@/lib/i18n-server";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STR = {
  fr: {
    active: "Active",
    closed: "Clôturée",
    backToSessions: "Sessions de caisse",
    openedOn: "Ouverte le",
    closedOn: "Clôturée le",
    totalCollected: "Total encaissé",
    payments: "Paiements",
    sessionPayments: "Paiements de la session",
    noPayment: "Aucun paiement enregistré pour cette session.",
    colNumber: "N°",
    colPatient: "Patient",
    colAppointment: "Rendez-vous",
    colPaymentDate: "Date paiement",
    colMode: "Mode",
    colAmount: "Montant",
    colInvoice: "Facture",
    notes: "Notes",
    methods: {
      total_cash: "Espèces",
      total_card: "Carte",
      total_mobile: "Mobile",
      total_insurance: "Assurance",
      total_transfer: "Virement",
    } as Record<string, string>,
    paymentMethods: {
      CASH: "Espèces",
      CARD: "Carte",
      MOBILE_MONEY: "Mobile",
      INSURANCE: "Assurance",
      BANK_TRANSFER: "Virement",
    } as Record<string, string>,
  },
  en: {
    active: "Active",
    closed: "Closed",
    backToSessions: "Cashier sessions",
    openedOn: "Opened on",
    closedOn: "Closed on",
    totalCollected: "Total collected",
    payments: "Payments",
    sessionPayments: "Session payments",
    noPayment: "No payment recorded for this session.",
    colNumber: "No.",
    colPatient: "Patient",
    colAppointment: "Appointment",
    colPaymentDate: "Payment date",
    colMode: "Method",
    colAmount: "Amount",
    colInvoice: "Invoice",
    notes: "Notes",
    methods: {
      total_cash: "Cash",
      total_card: "Card",
      total_mobile: "Mobile",
      total_insurance: "Insurance",
      total_transfer: "Transfer",
    } as Record<string, string>,
    paymentMethods: {
      CASH: "Cash",
      CARD: "Card",
      MOBILE_MONEY: "Mobile",
      INSURANCE: "Insurance",
      BANK_TRANSFER: "Transfer",
    } as Record<string, string>,
  },
} as const;

const STATUS_STYLE: Record<string, string> = {
  OPEN:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CLOSED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const METHOD_TOTALS = [
  { key: "total_cash",      Icon: Banknote,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  { key: "total_card",      Icon: CreditCard, color: "text-sky-600 dark:text-sky-400",         bg: "bg-sky-50 dark:bg-sky-950/40" },
  { key: "total_mobile",    Icon: Smartphone, color: "text-orange-600 dark:text-orange-400",   bg: "bg-orange-50 dark:bg-orange-950/40" },
  { key: "total_insurance", Icon: Shield,     color: "text-violet-600 dark:text-violet-400",   bg: "bg-violet-50 dark:bg-violet-950/40" },
  { key: "total_transfer",  Icon: Building2,  color: "text-slate-600 dark:text-slate-400",     bg: "bg-slate-100 dark:bg-slate-800/50" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = STR[await getLang()];
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) redirect("/admin");

  const { id } = await params;
  const sessionId = Number(id);
  if (isNaN(sessionId)) notFound();

  const session = await getSessionById(sessionId);
  if (!session) notFound();

  const grandTotal = session.payments.reduce((s, p) => s + p.amount_paid, 0);
  const duration =
    session.closed_at && session.opened_at
      ? Math.round(
          (new Date(session.closed_at).getTime() -
            new Date(session.opened_at).getTime()) /
            60000
        )
      : null;

  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen max-w-5xl mx-auto">

      {/* ── Back + Header ── */}
      <div>
        <Link
          href="/administration/sessions-de-caisse"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToSessions}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Session #{session.id}
              </h1>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  STATUS_STYLE[session.status] ?? STATUS_STYLE.CLOSED
                }`}
              >
                {session.status === "OPEN" ? t.active : t.closed}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {session.cashier_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t.openedOn}{" "}
                {format(new Date(session.opened_at), "d MMM yyyy · HH:mm", {
                  locale: fr,
                })}
              </span>
              {session.closed_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {t.closedOn}{" "}
                  {format(new Date(session.closed_at), "d MMM yyyy · HH:mm", {
                    locale: fr,
                  })}
                </span>
              )}
              {duration !== null && <span>{duration} min</span>}
            </div>
          </div>
          {session.status === "OPEN" && (
            <AdminCloseSessionButton sessionId={session.id} />
          )}
        </div>
      </div>

      {/* ── Totaux par mode ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {METHOD_TOTALS.map((m) => {
          const val = (session as Record<string, unknown>)[m.key] as number | null;
          return (
            <div
              key={m.key}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-2"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${m.bg}`}>
                <m.Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.methods[m.key]}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {(val ?? 0).toLocaleString("fr-CD")} USD
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Grand total ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">
            {t.totalCollected}
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {grandTotal.toLocaleString("fr-CD")} USD
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 mb-0.5">{t.payments}</p>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {session._count.payments}
          </p>
        </div>
      </div>

      {/* ── Tableau des paiements ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t.sessionPayments}
          </h2>
        </div>

        {session.payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400 italic">
              {t.noPayment}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t.colNumber}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t.colPatient}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">
                    {t.colAppointment}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">
                    {t.colPaymentDate}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">
                    {t.colMode}
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t.colAmount}
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t.colInvoice}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {session.payments.map((p) => {
                  const patientName = `${p.patient.first_name} ${p.patient.last_name}`;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                        #{p.id}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-100 uppercase text-xs">
                          {patientName}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          ID: {p.patient.id}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">
                        <Link
                          href={`/record/appointments/${p.appointment.id}?cat=bills`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-2 transition-colors"
                        >
                          {format(
                            new Date(p.appointment.appointment_date),
                            "d MMM yyyy",
                            { locale: fr }
                          )}
                        </Link>
                        <p className="text-xs text-slate-400 capitalize">{p.appointment.type}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">
                        {format(new Date(p.payment_date), "d MMM yyyy · HH:mm", {
                          locale: fr,
                        })}
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {t.paymentMethods[p.payment_method] ?? p.payment_method}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-800 dark:text-slate-100 text-xs">
                        {p.amount_paid.toLocaleString("fr-CD")} USD
                      </td>
                      <td className="px-5 py-3 text-center">
                        <PdfDownloadButton
                          paymentId={p.id}
                          patientName={`${p.patient.last_name}_${p.patient.first_name}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  <td
                    colSpan={5}
                    className="px-5 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
                  >
                    {t.totalCollected}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-slate-800 dark:text-slate-100">
                    {grandTotal.toLocaleString("fr-CD")} USD
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Notes ── */}
      {session.notes && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 px-5 py-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">{t.notes}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 italic">
            {session.notes}
          </p>
        </div>
      )}
    </div>
  );
}
