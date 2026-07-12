import { ActionDialog } from "@/components/action-dialog";
import { StaffForm } from "@/components/forms/staff-form";
import { Pagination } from "@/components/pagination";
import { ProfileImage } from "@/components/profile-image";
import SearchInput from "@/components/search-input";
import { Table } from "@/components/tables/table";
import { SearchParamsProps } from "@/types";
import { checkRole } from "@/utils/roles";
import { DATA_LIMIT } from "@/utils/seetings";
import { getAllStaff } from "@/utils/services/staff";
import { Staff } from "@prisma/client";
import { format } from "date-fns";
import { Users } from "lucide-react";
import React from "react";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    colInfo: "Info",
    colRole: "Rôle",
    colPhone: "Téléphone",
    colEmail: "Email",
    colCreatedAt: "Date d'arrivée",
    colActions: "Actions",
    headerLabel: "Personnels",
    registered: "enregistrés",
  },
  en: {
    colInfo: "Info",
    colRole: "Role",
    colPhone: "Phone",
    colEmail: "Email",
    colCreatedAt: "Join date",
    colActions: "Actions",
    headerLabel: "Staff",
    registered: "recorded",
  },
} as const;

const StaffList = async (props: SearchParamsProps) => {
  const t = STR[await getLang()];
  const columns = [
    { header: t.colInfo, key: "name" },
    { header: t.colRole, key: "role", className: "hidden md:table-cell" },
    { header: t.colPhone, key: "contact", className: "hidden md:table-cell" },
    { header: t.colEmail, key: "email", className: "hidden lg:table-cell" },
    { header: t.colCreatedAt, key: "created_at", className: "hidden xl:table-cell" },
    { header: t.colActions, key: "action" },
  ];
  const searchParams = await props.searchParams;
  const page = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;

  const { data, totalPages, totalRecords, currentPage } = await getAllStaff({ page, search: searchQuery });
  if (!data) return null;

  const isAdmin = await checkRole("ADMIN");

  const renderRow = (item: Staff) => (
    <tr
      key={item?.id}
      className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors border-b border-slate-100 dark:border-slate-800"
    >
      <td className="flex items-center gap-4 p-4">
        <ProfileImage url={item?.img!} name={item?.name} bgColor={item?.colorCode!} textClassName="text-white" />
        <div>
          <h3 className="uppercase font-semibold text-slate-800 dark:text-slate-100">{item?.name}</h3>
          <span className="text-xs text-slate-400 capitalize">{item?.phone}</span>
        </div>
      </td>
      <td className="hidden md:table-cell text-slate-600 dark:text-slate-300 capitalize">{item?.role?.toLowerCase().replace("_", " ")}</td>
      <td className="hidden md:table-cell text-slate-600 dark:text-slate-300">{item?.phone}</td>
      <td className="hidden lg:table-cell text-slate-600 dark:text-slate-300 text-xs">{item?.email}</td>
      <td className="hidden xl:table-cell text-slate-500 dark:text-slate-400 text-xs">{format(item?.created_at, "dd/MM/yyyy")}</td>
      <td>
        <div className="flex items-center gap-2">
          <ActionDialog type="staff" id={item?.id} data={item} />
          {isAdmin && <ActionDialog type="delete" id={item?.id} deleteType="staff" />}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Personnels</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
              {totalRecords}{" "}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">enregistrés</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput />
          {isAdmin && <StaffForm />}
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

export default StaffList;
