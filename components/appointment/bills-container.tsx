import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import { ReceiptText } from "lucide-react";
import { Table } from "../tables/table";
import { PatientBills } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ActionDialog } from "../action-dialog";
import { Separator } from "../ui/separator";
import { AddBills } from "../dialogs/add-bills";
import { GenerateFinalBills } from "./generate-final-bill";

const columns = [
  {
    header: "N°",
    key: "no",
    className: "hidden md:table-cell",
  },
  {
    header: "Service",
    key: "service",
  },
  {
    header: "Date",
    key: "date",
    className: "",
  },
  {
    header: "Quantité",
    key: "qnty",
    className: "hidden md:table-cell",
  },
  {
    header: "Prix unitaire",
    key: "price",
    className: "hidden md:table-cell",
  },
  {
    header: "Coût total",
    key: "total",
    className: "",
  },
  {
    header: "Action",
    key: "action",
    className: "hidden xl:table-cell",
  },
];

interface ExtendedBillProps extends PatientBills {
  service: {
    service_name: string;
    id: number;
  };
}

export const BillsContainer = async ({ id }: { id: string }) => {
  const [data, servicesData] = await Promise.all([
    db.payment.findFirst({
      where: { appointment_id: Number(id) },
      include: {
        bills: {
          include: {
            service: { select: { service_name: true, id: true } },
          },
          orderBy: { created_at: "asc" },
        },
      },
    }),
    db.services.findMany(),
  ]);

  const billData = data?.bills || [];

  // Always derive totals from the actual bill lines, not the stale payment record.
  const totalBills = billData.reduce((sum, acc) => sum + acc.total_cost, 0);
  const discountAmount = data?.discount ?? 0;
  const discountPct = totalBills > 0 ? (discountAmount / totalBills) * 100 : 0;
  const payable = Math.max(0, totalBills - discountAmount);
  const amountPaid = data?.amount_paid ?? 0;
  const amountUnpaid = Math.max(0, payable - amountPaid);

  const renderRow = (item: ExtendedBillProps) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 dark:border-slate-700 even:bg-slate-50 dark:even:bg-slate-800/40 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
      >
        <td className="hidden md:table-cell py-2 xl:py-6"># {item?.id}</td>
        <td className="items-center py-2">{item?.service?.service_name}</td>
        <td className="">{format(item?.service_date, "d MMM yyyy", { locale: fr })}</td>
        <td className="hidden items-center py-2 md:table-cell">{item?.quantity}</td>
        <td className="hidden lg:table-cell">{item?.unit_cost.toFixed(2)}</td>
        <td>{item?.total_cost.toFixed(2)}</td>
        <td className="hidden xl:table-cell">
          <ActionDialog
            type="delete"
            id={item?.id.toString()}
            deleteType="bill"
          />
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-2 2xl:p-4 border border-slate-200 dark:border-slate-700">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="font-semibold text-xl text-slate-800 dark:text-slate-100">
            Factures du patient
          </h1>
          <div className="hidden lg:flex items-center gap-1">
            <ReceiptText size={20} className="text-gray-500 dark:text-slate-400" />
            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {billData?.length}
            </p>
            <span className="text-gray-600 dark:text-slate-400 text-sm xl:text-base">
              facture{billData?.length !== 1 ? "s" : ""} au total
            </span>
          </div>
        </div>

        {((await checkRole("ADMIN")) || (await checkRole("DOCTOR"))) && (
          <div className="flex items-center mt-5 justify-end">
            <AddBills id={data?.id} appId={id} servicesData={servicesData} />
            <GenerateFinalBills id={data?.id} total_bill={totalBills} />
          </div>
        )}
      </div>

      <Table columns={columns} renderRow={renderRow} data={billData!} />

      <Separator className="dark:bg-slate-700" />

      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between md:text-center py-2 space-y-6">
        <SummaryItem label="Total" value={totalBills.toFixed(2)} />
        <SummaryItem
          label="Remise"
          value={`${discountAmount.toFixed(2)} (${discountPct.toFixed(2)}%)`}
          color="yellow"
        />
        <SummaryItem label="Montant payable" value={payable.toFixed(2)} />
        <SummaryItem label="Montant payé"    value={amountPaid.toFixed(2)}   color="green" />
        <SummaryItem label="Montant impayé"  value={amountUnpaid.toFixed(2)} color="red"   />
      </div>
    </div>
  );
};

function SummaryItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "yellow" | "green" | "red";
}) {
  const colorClass =
    color === "yellow"
      ? "text-yellow-600 dark:text-yellow-400"
      : color === "green"
      ? "text-emerald-600 dark:text-emerald-400"
      : color === "red"
      ? "text-red-600 dark:text-red-400"
      : "text-slate-800 dark:text-slate-100";

  return (
    <div className="w-[120px]">
      <span className="text-gray-500 dark:text-slate-400 text-sm">{label}</span>
      <p className={`text-xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}
