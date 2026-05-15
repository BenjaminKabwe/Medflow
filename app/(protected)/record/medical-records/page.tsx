import { ViewAction } from "@/components/action-options";
import { Pagination } from "@/components/pagination";
import { ProfileImage } from "@/components/profile-image";
import SearchInput from "@/components/search-input";
import { Table } from "@/components/tables/table";
import { SearchParamsProps } from "@/types";
import { DATA_LIMIT } from "@/utils/seetings";
import { getMedicalRecords } from "@/utils/services/medical-record";
import { Diagnosis, LabTest, MedicalRecords, Patient } from "@prisma/client";
import { format } from "date-fns";
import { SquareActivity } from "lucide-react";

const columns = [
  { header: "Patient",     key: "name" },
  { header: "Date & Heure", key: "medical_date",  className: "hidden md:table-cell" },
  { header: "Médecin",     key: "doctor",          className: "hidden 2xl:table-cell" },
  { header: "Diagnostic",  key: "diagnosis",       className: "hidden lg:table-cell" },
  { header: "Examens",     key: "lab_test",        className: "hidden xl:table-cell" },
  { header: "Action",      key: "action" },
];

const GENDER_FR: Record<string, string> = {
  male: "Homme", female: "Femme", other: "Autre",
};

interface ExtendedProps extends MedicalRecords {
  patient: Patient;
  diagnosis: Diagnosis[];
  lab_test: LabTest[];
}

const MedicalRecordsPage = async (props: SearchParamsProps) => {
  const searchParams = await props.searchParams;
  const page = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;

  const { data, totalPages, totalRecords, currentPage } = await getMedicalRecords({ page, search: searchQuery });

  if (!data) return null;

  const renderRow = (item: ExtendedProps) => {
    const name = item?.patient?.first_name + " " + item?.patient?.last_name;
    const patient = item?.patient;
    const gender = GENDER_FR[patient?.gender?.toLowerCase()] ?? patient?.gender;

    return (
      <tr key={item?.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
        <td className="py-3 pr-4">
          <div className="flex items-center gap-3">
            <ProfileImage url={patient?.img!} name={name} bgColor={patient?.colorCode!} textClassName="text-white" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 capitalize">{name.toLowerCase()}</p>
              <p className="text-xs text-slate-400">{gender}</p>
            </div>
          </div>
        </td>
        <td className="hidden md:table-cell py-3 pr-4 text-slate-500 dark:text-slate-400 text-xs">
          {format(item?.created_at, "dd/MM/yyyy HH:mm")}
        </td>
        <td className="hidden 2xl:table-cell py-3 pr-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
          {item?.doctor_id}
        </td>
        <td className="hidden lg:table-cell py-3 pr-4">
          {item?.diagnosis?.length === 0 ? (
            <span className="italic text-slate-400">—</span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
              {item.diagnosis.length} diagnostic{item.diagnosis.length > 1 ? "s" : ""}
            </span>
          )}
        </td>
        <td className="hidden xl:table-cell py-3 pr-4">
          {item?.lab_test?.length === 0 ? (
            <span className="italic text-slate-400">—</span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {item.lab_test.length} examen{item.lab_test.length > 1 ? "s" : ""}
            </span>
          )}
        </td>
        <td className="py-3">
          <ViewAction href={`/record/appointments/${item?.appointment_id}`} />
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <SquareActivity className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Dossiers médicaux</p>
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

export default MedicalRecordsPage;
