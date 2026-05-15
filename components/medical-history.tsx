import { Diagnosis, LabTest, MedicalRecords, Patient } from "@prisma/client";
import { ClipboardList } from "lucide-react";
import React from "react";
import { Table } from "./tables/table";
import { ProfileImage } from "./profile-image";
import { formatDateTime } from "@/utils";
import { ViewAction } from "./action-options";
import { MedicalHistoryDialog } from "./medical-history-dialog";

export interface ExtendedMedicalHistory extends MedicalRecords {
  patient?: Patient;
  diagnosis: Diagnosis[];
  lab_test: LabTest[];
  index?: number;
}

interface DataProps {
  data: ExtendedMedicalHistory[];
  isShowProfile?: boolean;
}

export const MedicalHistory = ({ data, isShowProfile }: DataProps) => {
  const columns = [
    { header: "N°",          key: "no" },
    { header: "Patient",     key: "name",        className: isShowProfile ? "table-cell" : "hidden" },
    { header: "Date & heure",key: "medical_date" },
    { header: "Médecin",     key: "doctor",      className: "hidden xl:table-cell" },
    { header: "Diagnostic",  key: "diagnosis",   className: "hidden md:table-cell" },
    { header: "Examens",     key: "lab_test",    className: "hidden 2xl:table-cell" },
    { header: "",            key: "action" },
  ];

  const renderRow = (item: ExtendedMedicalHistory) => (
    <tr
      key={item.id}
      className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
    >
      <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
        #{item?.id}
      </td>

      {isShowProfile && (
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2.5">
            <ProfileImage
              url={item?.patient?.img!}
              name={`${item?.patient?.first_name} ${item?.patient?.last_name}`}
            />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
                {`${item?.patient?.first_name} ${item?.patient?.last_name}`.toLowerCase()}
              </p>
              <span className="text-xs text-slate-400 capitalize">
                {item?.patient?.gender === "MALE" ? "Homme" : "Femme"}
              </span>
            </div>
          </div>
        </td>
      )}

      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300 text-xs">
        {formatDateTime(item?.created_at.toString())}
      </td>

      <td className="hidden xl:table-cell py-3 pr-4 text-slate-600 dark:text-slate-300 text-xs">
        {item?.doctor_id}
      </td>

      <td className="hidden md:table-cell py-3 pr-4">
        {item?.diagnosis?.length === 0 ? (
          <span className="text-xs italic text-slate-400">Aucun diagnostic</span>
        ) : (
          <MedicalHistoryDialog
            id={item?.appointment_id}
            patientId={item?.patient_id}
            doctor_id={item?.doctor_id}
            label={
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-medium">
                {item?.diagnosis?.length} trouvé{item?.diagnosis?.length > 1 ? "s" : ""}
              </span>
            }
          />
        )}
      </td>

      <td className="hidden 2xl:table-cell py-3 pr-4">
        {item?.lab_test?.length === 0 ? (
          <span className="text-xs italic text-slate-400">Aucun examen</span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            {item?.lab_test?.length} examen{item?.lab_test?.length > 1 ? "s" : ""}
          </span>
        )}
      </td>

      <td className="py-3">
        <ViewAction href={`/record/appointments/${item?.appointment_id}`} />
      </td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-violet-500" />
        </div>
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
            Historique médical
          </p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
            {data?.length}{" "}
            <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
              dossier{data?.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
    </div>
  );
};
