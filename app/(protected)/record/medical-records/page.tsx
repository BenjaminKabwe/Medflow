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
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    colPatient: "Patient",
    colDate: "Date & Heure",
    colDoctor: "Médecin",
    colDiagnosis: "Diagnostic",
    colLabTest: "Examens",
    colAction: "Action",
    gender: { male: "Homme", female: "Femme", other: "Autre" } as Record<string, string>,
    headerLabel: "Dossiers médicaux",
    registered: "enregistrés",
    diagnosisCount: (n: number) => `${n} diagnostic${n > 1 ? "s" : ""}`,
    labTestCount: (n: number) => `${n} examen${n > 1 ? "s" : ""}`,
  },
  en: {
    colPatient: "Patient",
    colDate: "Date & Time",
    colDoctor: "Doctor",
    colDiagnosis: "Diagnosis",
    colLabTest: "Lab tests",
    colAction: "Action",
    gender: { male: "Male", female: "Female", other: "Other" } as Record<string, string>,
    headerLabel: "Medical records",
    registered: "recorded",
    diagnosisCount: (n: number) => `${n} diagnos${n > 1 ? "es" : "is"}`,
    labTestCount: (n: number) => `${n} test${n > 1 ? "s" : ""}`,
  },
} as const;

interface ExtendedProps extends MedicalRecords {
  patient: Patient;
  diagnosis: Diagnosis[];
  lab_test: LabTest[];
}

const MedicalRecordsPage = async (props: SearchParamsProps) => {
  const t = STR[await getLang()];
  const columns = [
    { header: t.colPatient, key: "name" },
    { header: t.colDate, key: "medical_date", className: "hidden md:table-cell" },
    { header: t.colDoctor, key: "doctor", className: "hidden 2xl:table-cell" },
    { header: t.colDiagnosis, key: "diagnosis", className: "hidden lg:table-cell" },
    { header: t.colLabTest, key: "lab_test", className: "hidden xl:table-cell" },
    { header: t.colAction, key: "action" },
  ];
  const searchParams = await props.searchParams;
  const page = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;

  const { data, totalPages, totalRecords, currentPage } = await getMedicalRecords({ page, search: searchQuery });

  if (!data) return null;

  const renderRow = (item: ExtendedProps) => {
    const name = item?.patient?.first_name + " " + item?.patient?.last_name;
    const patient = item?.patient;
    const gender = t.gender[patient?.gender?.toLowerCase()] ?? patient?.gender;

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
              {t.diagnosisCount(item.diagnosis.length)}
            </span>
          )}
        </td>
        <td className="hidden xl:table-cell py-3 pr-4">
          {item?.lab_test?.length === 0 ? (
            <span className="italic text-slate-400">—</span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {t.labTestCount(item.lab_test.length)}
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
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">{t.headerLabel}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
              {totalRecords}{" "}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">{t.registered}</span>
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
