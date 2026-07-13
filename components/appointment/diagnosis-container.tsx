import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NoDataFound } from "../no-data-found";
import { AddDiagnosis } from "../dialogs/add-diagnosis";
import { RequestLabTests } from "../dialogs/request-lab-tests";
import { checkRole } from "@/utils/roles";
import { getMedications } from "@/utils/services/pharmacy";
import { getLabServices, getLabTestsForRecord } from "@/utils/services/lab";
import { MedicalHistoryCard } from "./medical-history-card";
import { LabTestsPanel } from "./lab-tests-panel";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: { noDiagnosis: "Aucun diagnostic trouvé", title: "Dossiers médicaux" },
  en: { noDiagnosis: "No diagnosis found", title: "Medical records" },
};

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

  const lang = await getLang();
  const t = STR[lang];

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
  // Seul le médecin peut prescrire (acte médical).
  const isDoctor = await checkRole("DOCTOR");

  const medications = !isDoctor
    ? []
    : (await getMedications({ activeOnly: true, limit: 1000 })).data.map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        form: m.form,
      }));

  // Catalogue d'analyses (médecin seulement) + analyses déjà rattachées au dossier.
  const labServices = isDoctor ? await getLabServices() : [];
  const labTests = data?.id ? await getLabTestsForRecord(data.id) : [];

  return (
    <div>
      {diagnosis?.length === 0 || !diagnosis ? (
        <div className="flex flex-col items-center justify-center mt-20">
          <NoDataFound note={t.noDiagnosis} />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <AddDiagnosis
              key={new Date().getTime()}
              patientId={patientId}
              doctorId={doctorId}
              appointmentId={id}
              medicalId={data?.id.toString() || ""}
              medications={medications}
              canPrescribe={isDoctor}
            />
            {isDoctor && (
              <RequestLabTests
                recordId={data?.id ?? null}
                appointmentId={id}
                patientId={patientId}
                doctorId={doctorId}
                services={labServices}
              />
            )}
          </div>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {t.title}
            </h2>
            {!isPatient && (
              <div className="flex flex-wrap items-center gap-3">
                <AddDiagnosis
                  key={new Date().getTime()}
                  patientId={patientId}
                  doctorId={doctorId}
                  appointmentId={id}
                  medicalId={data?.id.toString() || ""}
                  medications={medications}
                  canPrescribe={isDoctor}
                />
                {isDoctor && data?.id && (
                  <RequestLabTests recordId={data.id} services={labServices} />
                )}
              </div>
            )}
          </div>

          {diagnosis?.map((record, id) => (
            <MedicalHistoryCard key={record.id} record={record} index={id} lang={lang} />
          ))}

          {!isPatient && <LabTestsPanel tests={labTests} lang={lang} />}
        </section>
      )}
    </div>
  );
};
