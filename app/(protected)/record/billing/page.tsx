import { ActionDialog } from "@/components/action-dialog";
import { ViewAction } from "@/components/action-options";
import { PdfDownloadButton } from "@/components/pdf-download-button";
import { Pagination } from "@/components/pagination";
import { ProfileImage } from "@/components/profile-image";
import SearchInput from "@/components/search-input";
import { Table } from "@/components/tables/table";
import { cn } from "@/lib/utils";
import { SearchParamsProps } from "@/types";
import { checkRole } from "@/utils/roles";
import { DATA_LIMIT } from "@/utils/seetings";
import { getPaymentRecords } from "@/utils/services/payments";
import { Patient, Payment } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ReceiptText } from "lucide-react";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    colId: "N°",
    colPatient: "Patient",
    colContact: "Contact",
    colBillDate: "Date de facturation",
    colTotal: "Total",
    colDiscount: "Remise",
    colPayable: "Montant payable",
    colPaid: "Montant payé",
    colStatus: "Statut",
    colActions: "Actions",
    unpaid: "Impayé",
    paid: "Payé",
    male: "Homme",
    female: "Femme",
    paymentsTotal: (n: number) => `paiement${n !== 1 ? "s" : ""} au total`,
  },
  en: {
    colId: "No.",
    colPatient: "Patient",
    colContact: "Contact",
    colBillDate: "Billing date",
    colTotal: "Total",
    colDiscount: "Discount",
    colPayable: "Amount payable",
    colPaid: "Amount paid",
    colStatus: "Status",
    colActions: "Actions",
    unpaid: "Unpaid",
    paid: "Paid",
    male: "Male",
    female: "Female",
    paymentsTotal: (n: number) => `payment${n !== 1 ? "s" : ""} in total`,
  },
} as const;

interface ExtendedProps extends Payment {
  patient: Patient;
}

const BillingPage = async (props: SearchParamsProps) => {
  const t = STR[await getLang()];
  const columns = [
    { header: t.colId, key: "id" },
    { header: t.colPatient, key: "info", className: "" },
    { header: t.colContact, key: "phone", className: "hidden md:table-cell" },
    { header: t.colBillDate, key: "bill_date", className: "hidden md:table-cell" },
    { header: t.colTotal, key: "total", className: "hidden xl:table-cell" },
    { header: t.colDiscount, key: "discount", className: "hidden xl:table-cell" },
    { header: t.colPayable, key: "payable", className: "hidden xl:table-cell" },
    { header: t.colPaid, key: "paid", className: "hidden xl:table-cell" },
    { header: t.colStatus, key: "status", className: "hidden xl:table-cell" },
    { header: t.colActions, key: "action" },
  ];
  const searchParams = await props.searchParams;
  const page = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;

  const { data, totalPages, totalRecords, currentPage } =
    await getPaymentRecords({
      page,
      search: searchQuery,
    });
  const isAdmin = await checkRole("ADMIN");

  if (!data) return null;

  const renderRow = (item: ExtendedProps) => {
    const name = item?.patient?.first_name + " " + item?.patient?.last_name;
    const patient = item?.patient;

    const statusLabel =
      item?.status === "UNPAID"
        ? t.unpaid
        : item?.status === "PAID"
        ? t.paid
        : item?.status;

    return (
      <tr
        key={item?.id + patient?.id}
        className="border-b border-gray-200 dark:border-slate-700 even:bg-slate-50 dark:even:bg-slate-800/50 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <td># {item?.id}</td>
        <td className="flex items-center gap-4 p-4">
          <ProfileImage
            url={item?.patient?.img!}
            name={name}
            bgColor={patient?.colorCode!}
            textClassName="text-black"
          />
          <div>
            <h3 className="uppercase">{name}</h3>
            <span className="text-sm capitalize">
              {patient?.gender === "MALE" ? t.male : t.female}
            </span>
          </div>
        </td>
        <td className="hidden md:table-cell">{patient?.phone}</td>
        <td className="hidden md:table-cell">
          {format(item?.bill_date, "d MMM yyyy", { locale: fr })}
        </td>
        <td className="hidden xl:table-cell">
          {item?.total_amount?.toFixed(2)}
        </td>
        <td className="hidden xl:table-cell">{item?.discount?.toFixed(2)}</td>
        <td className="hidden xl:table-cell">
          {(item?.total_amount - item?.discount).toFixed(2)}
        </td>
        <td className="hidden xl:table-cell">
          {item?.amount_paid.toFixed(2)}
        </td>
        <td className="hidden xl:table-cell">
          <span
            className={cn(
              item?.status === "UNPAID"
                ? "text-red-600"
                : item?.status === "PAID"
                ? "text-emerald-600"
                : "text-gray-600"
            )}
          >
            {statusLabel}
          </span>
        </td>
        <td>
          <div className="flex items-center gap-1">
            <ViewAction
              href={`/record/appointments/${item?.appointment_id}?cat=bills`}
            />
            <PdfDownloadButton
              paymentId={item.id}
              patientName={`${item.patient.last_name}_${item.patient.first_name}`}
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
    <div className="bg-white dark:bg-slate-900 rounded-xl py-6 px-3 2xl:px-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="hidden lg:flex items-center gap-1">
          <ReceiptText size={20} className="text-gray-500" />
          <p className="text-2xl font-semibold">{totalRecords}</p>
          <span className="text-gray-600 text-sm xl:text-base">
            {t.paymentsTotal(totalRecords)}
          </span>
        </div>
        <div className="w-full lg:w-fit flex items-center justify-between lg:justify-start gap-2">
          <SearchInput />
        </div>
      </div>

      <div className="mt-4">
        <Table columns={columns} data={data} renderRow={renderRow} />

        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          totalRecords={totalRecords}
          limit={DATA_LIMIT}
        />
      </div>
    </div>
  );
};

export default BillingPage;
