import { ActionDialog } from "@/components/action-dialog";
import { ViewAction } from "@/components/action-options";
import { DoctorForm } from "@/components/forms/doctor-form";
import { Pagination } from "@/components/pagination";
import { ProfileImage } from "@/components/profile-image";
import SearchInput from "@/components/search-input";
import { Table } from "@/components/tables/table";
import { SearchParamsProps } from "@/types";
import { checkRole } from "@/utils/roles";
import { DATA_LIMIT } from "@/utils/seetings";
import { getAllDoctors } from "@/utils/services/doctor";
import { Doctor } from "@prisma/client";
import { format } from "date-fns";
import { Stethoscope } from "lucide-react";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    colDoctor: "Médecin",
    colLicense: "N° de licence",
    colPhone: "Téléphone",
    colEmail: "Email",
    colCreatedAt: "Date d'arrivée",
    colActions: "Actions",
    headerLabel: "Médecins",
    registered: "enregistrés",
  },
  en: {
    colDoctor: "Doctor",
    colLicense: "License No.",
    colPhone: "Phone",
    colEmail: "Email",
    colCreatedAt: "Join date",
    colActions: "Actions",
    headerLabel: "Doctors",
    registered: "recorded",
  },
} as const;

const DoctorsList = async (props: SearchParamsProps) => {
  const t = STR[await getLang()];
  const columns = [
    { header: t.colDoctor, key: "name" },
    { header: t.colLicense, key: "license", className: "hidden md:table-cell" },
    { header: t.colPhone, key: "contact", className: "hidden md:table-cell" },
    { header: t.colEmail, key: "email", className: "hidden lg:table-cell" },
    { header: t.colCreatedAt, key: "created_at", className: "hidden xl:table-cell" },
    { header: t.colActions, key: "action" },
  ];
  const searchParams = await props.searchParams;
  const page = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;

  const { data, totalPages, totalRecords, currentPage } = await getAllDoctors({ page, search: searchQuery });
  if (!data) return null;

  const isAdmin = await checkRole("ADMIN");

  const renderRow = (item: Doctor) => (
    <tr key={item?.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <ProfileImage url={item?.img!} name={item?.name} bgColor={item?.colorCode!} textClassName="text-white" />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 capitalize">{item?.name?.toLowerCase()}</p>
            <p className="text-xs text-slate-400 capitalize">{item?.specialization}</p>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell py-3 pr-4 text-slate-600 dark:text-slate-300 font-mono text-xs">{item?.license_number}</td>
      <td className="hidden md:table-cell py-3 pr-4 text-slate-600 dark:text-slate-300">{item?.phone}</td>
      <td className="hidden lg:table-cell py-3 pr-4 text-slate-600 dark:text-slate-300 text-xs">{item?.email}</td>
      <td className="hidden xl:table-cell py-3 pr-4 text-slate-500 dark:text-slate-400 text-xs">
        {format(item?.created_at, "dd/MM/yyyy")}
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          <ViewAction href={`doctors/${item?.id}`} />
          {isAdmin && <ActionDialog type="delete" id={item?.id} deleteType="doctor" />}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">{t.headerLabel}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
              {totalRecords}{" "}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">{t.registered}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput />
          {isAdmin && <DoctorForm />}
        </div>
      </div>

      <Table columns={columns} data={data} renderRow={renderRow} />

      {totalPages && (
        <div className="mt-4">
          <Pagination totalPages={totalPages} currentPage={currentPage} totalRecords={totalRecords} limit={DATA_LIMIT} />
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
