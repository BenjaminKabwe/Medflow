import db from "@/lib/db";
import { Table } from "../tables/table";
import { Payment } from "@prisma/client";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { ViewAction } from "../action-options";
import { checkRole } from "@/utils/roles";
import { ActionDialog } from "../action-dialog";
import { PdfDownloadButton } from "../pdf-download-button";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    colNo: "N°",
    colBillDate: "Date de facturation",
    colPayDate: "Date de paiement",
    colTotal: "Total",
    colDiscount: "Remise",
    colPayable: "Montant payable",
    colPaid: "Montant payé",
    colActions: "Actions",
    paymentsTotal: (n: number) => `paiement${n !== 1 ? "s" : ""} au total`,
  },
  en: {
    colNo: "No.",
    colBillDate: "Billing date",
    colPayDate: "Payment date",
    colTotal: "Total",
    colDiscount: "Discount",
    colPayable: "Amount payable",
    colPaid: "Amount paid",
    colActions: "Actions",
    paymentsTotal: (n: number) => `payment${n !== 1 ? "s" : ""} in total`,
  },
};

export const PaymentsContainer = async ({
  patientId,
}: {
  patientId: string;
}) => {
  const lang = await getLang();
  const t = STR[lang];
  const dateLocale = lang === "en" ? enUS : fr;

  const columns = [
    { header: t.colNo, key: "id" },
    { header: t.colBillDate, key: "bill_date", className: "" },
    { header: t.colPayDate, key: "pay_date", className: "hidden md:table-cell" },
    { header: t.colTotal, key: "total", className: "" },
    { header: t.colDiscount, key: "discount", className: "hidden xl:table-cell" },
    { header: t.colPayable, key: "payable", className: "hidden xl:table-cell" },
    { header: t.colPaid, key: "paid", className: "hidden xl:table-cell" },
    { header: t.colActions, key: "action" },
  ];

  const [data, patient, isAdmin] = await Promise.all([
    db.payment.findMany({ where: { patient_id: patientId } }),
    db.patient.findUnique({
      where: { id: patientId },
      select: { first_name: true, last_name: true },
    }),
    checkRole("ADMIN"),
  ]);

  if (!data) return null;

  const patientName = patient
    ? `${patient.last_name}_${patient.first_name}`
    : patientId;

  const renderRow = (item: Payment) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 dark:border-slate-700 even:bg-slate-50 dark:even:bg-slate-800/40 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
      >
        <td className="flex items-center gap-2 md:gap-4 py-2 xl:py-4">
          #{item?.id}
        </td>
        <td>{format(item?.bill_date, "d MMM yyyy", { locale: dateLocale })}</td>
        <td className="hidden items-center py-2 md:table-cell">
          {format(item?.payment_date, "d MMM yyyy", { locale: dateLocale })}
        </td>
        <td>{item?.total_amount.toFixed(2)}</td>
        <td className="hidden xl:table-cell">{item?.discount.toFixed(2)}</td>
        <td className="hidden xl:table-cell">
          {(item?.total_amount - item?.discount).toFixed(2)}
        </td>
        <td className="hidden xl:table-cell">{item?.amount_paid.toFixed(2)}</td>
        <td>
          <div className="flex items-center gap-1">
            <ViewAction
              href={`/record/appointments/${item?.appointment_id}?cat=bills`}
            />
            <PdfDownloadButton
              paymentId={item.id}
              patientName={patientName}
            />
            {isAdmin && (
              <ActionDialog
                type="delete"
                deleteType="payment"
                id={item?.id.toString()}
              />
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-2 md:p-4 2xl:p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="hidden lg:flex items-center gap-1">
          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {data?.length ?? 0}
          </p>
          <span className="text-gray-600 dark:text-slate-400 text-sm xl:text-base">
            {t.paymentsTotal(data?.length ?? 0)}
          </span>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={data} />
    </div>
  );
};
