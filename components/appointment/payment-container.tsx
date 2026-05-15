import db from "@/lib/db";
import { Table } from "../tables/table";
import { Payment } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ViewAction } from "../action-options";
import { checkRole } from "@/utils/roles";
import { ActionDialog } from "../action-dialog";
import { PdfDownloadButton } from "../pdf-download-button";

const columns = [
  {
    header: "N°",
    key: "id",
  },
  {
    header: "Date de facturation",
    key: "bill_date",
    className: "",
  },
  {
    header: "Date de paiement",
    key: "pay_date",
    className: "hidden md:table-cell",
  },
  {
    header: "Total",
    key: "total",
    className: "",
  },
  {
    header: "Remise",
    key: "discount",
    className: "hidden xl:table-cell",
  },
  {
    header: "Montant payable",
    key: "payable",
    className: "hidden xl:table-cell",
  },
  {
    header: "Montant payé",
    key: "paid",
    className: "hidden xl:table-cell",
  },
  {
    header: "Actions",
    key: "action",
  },
];

export const PaymentsContainer = async ({
  patientId,
}: {
  patientId: string;
}) => {
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
        <td>{format(item?.bill_date, "d MMM yyyy", { locale: fr })}</td>
        <td className="hidden items-center py-2 md:table-cell">
          {format(item?.payment_date, "d MMM yyyy", { locale: fr })}
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
            paiement{(data?.length ?? 0) !== 1 ? "s" : ""} au total
          </span>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={data} />
    </div>
  );
};
