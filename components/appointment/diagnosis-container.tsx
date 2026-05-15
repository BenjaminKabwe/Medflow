import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NoDataFound } from "../no-data-found";
import { AddDiagnosis } from "../dialogs/add-diagnosis";
import { checkRole } from "@/utils/roles";
import { MedicalHistoryCard } from "./medical-history-card";

export const DiagnosisContainer = async ({
  patientId,
  doctorId,
  id,
}: {
  patientId: string;
  doctorId: string;
  id: string;
}) => {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const data = await db.medicalRecords.findFirst({
    where: { appointment_id: Number(id) },
    include: {
      diagnosis: {
        include: { doctor: true },
        orderBy: { created_at: "desc" },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const diagnosis = data?.diagnosis || null;
  const isPatient = await checkRole("PATIENT");

  return (
    <div>
      {diagnosis?.length === 0 || !diagnosis ? (
        <div className="flex flex-col items-center justify-center mt-20">
          <NoDataFound note="Aucun diagnostic trouvé" />
          <AddDiagnosis
            key={new Date().getTime()}
            patientId={patientId}
            doctorId={doctorId}
            appointmentId={id}
            medicalId={data?.id.toString() || ""}
          />
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Dossiers médicaux
            </h2>
            {!isPatient && (
              <AddDiagnosis
                key={new Date().getTime()}
                patientId={patientId}
                doctorId={doctorId}
                appointmentId={id}
                medicalId={data?.id.toString() || ""}
              />
            )}
          </div>

          {diagnosis?.map((record, id) => (
            <MedicalHistoryCard key={record.id} record={record} index={id} />
          ))}
        </section>
      )}
    </div>
  );
};
