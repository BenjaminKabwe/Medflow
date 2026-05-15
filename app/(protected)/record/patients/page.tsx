import { ActionDialog } from "@/components/action-dialog";
import { ActionOptions, ViewAction } from "@/components/action-options";
import { Pagination } from "@/components/pagination";
import { ProfileImage } from "@/components/profile-image";
import SearchInput from "@/components/search-input";
import { Table } from "@/components/tables/table";
import { Button } from "@/components/ui/button";
import { SearchParamsProps } from "@/types";
import { calculateAge } from "@/utils";
import { checkRole } from "@/utils/roles";
import { DATA_LIMIT } from "@/utils/seetings";
import { getAllPatients } from "@/utils/services/patient";
import { Patient } from "@prisma/client";
import { format } from "date-fns";
import { UserPen, UsersRound } from "lucide-react";

const columns = [
  { header: "Patient",          key: "name" },
  { header: "Sexe",             key: "gender",     className: "hidden md:table-cell" },
  { header: "Téléphone",        key: "contact",    className: "hidden md:table-cell" },
  { header: "Email",            key: "email",      className: "hidden lg:table-cell" },
  { header: "Adresse",          key: "address",    className: "hidden xl:table-cell" },
  { header: "Dernière visite",  key: "created_at", className: "hidden lg:table-cell" },
  { header: "Dernier traitement", key: "treatment", className: "hidden 2xl:table-cell" },
  { header: "Actions",          key: "action" },
];

const GENDER_FR: Record<string, string> = {
  male: "Homme", female: "Femme", other: "Autre",
};

interface PatientProps extends Patient {
  appointments: {
    medical: { created_at: Date; treatment_plan: string }[];
  }[];
}

const PatientList = async (props: SearchParamsProps) => {
  const searchParams = await props.searchParams;
  const page = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;

  const { data, totalPages, totalRecords, currentPage } = await getAllPatients({ page, search: searchQuery });
  const isAdmin = await checkRole("ADMIN");

  if (!data) return null;

  const renderRow = (item: PatientProps) => {
    const lastVisit = item?.appointments[0]?.medical[0] || null;
    const name = item?.first_name + " " + item?.last_name;
    const gender = GENDER_FR[item?.gender?.toLowerCase()] ?? item?.gender;

    return (
      <tr key={item?.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
        <td className="py-3 pr-4">
          <div className="flex items-center gap-3">
            <ProfileImage url={item?.img!} name={name} bgColor={item?.colorCode!} textClassName="text-white" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 capitalize">{name.toLowerCase()}</p>
              <p className="text-xs text-slate-400">{calculateAge(item?.date_of_birth)}</p>
            </div>
          </div>
        </td>
        <td className="hidden md:table-cell py-3 pr-4 text-slate-600 dark:text-slate-300">{gender}</td>
        <td className="hidden md:table-cell py-3 pr-4 text-slate-600 dark:text-slate-300">{item?.phone}</td>
        <td className="hidden lg:table-cell py-3 pr-4 text-slate-600 dark:text-slate-300 text-xs">{item?.email}</td>
        <td className="hidden xl:table-cell py-3 pr-4 text-slate-500 dark:text-slate-400 text-xs">{item?.address}</td>
        <td className="hidden lg:table-cell py-3 pr-4 text-slate-500 dark:text-slate-400 text-xs">
          {lastVisit
            ? format(lastVisit?.created_at, "dd/MM/yyyy HH:mm")
            : <span className="italic text-slate-400">—</span>}
        </td>
        <td className="hidden 2xl:table-cell py-3 pr-4 text-slate-500 dark:text-slate-400 text-xs">
          {lastVisit?.treatment_plan ?? <span className="italic text-slate-400">—</span>}
        </td>
        <td className="py-3">
          <div className="flex items-center gap-2">
            <ViewAction href={`/patient/${item?.id}`} />
            <ActionOptions>
              <div className="space-y-2">
                <Button variant="ghost" className="text-xs font-light w-full justify-start">
                  <UserPen size={15} className="mr-2" />
                  Modifier
                </Button>
                {isAdmin && <ActionDialog type="delete" id={item.id} deleteType="patient" />}
              </div>
            </ActionOptions>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <UsersRound className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Patients</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
              {totalRecords}{" "}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">enregistrés</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput />
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

export default PatientList;
