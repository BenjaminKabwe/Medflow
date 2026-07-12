import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { calculateBMI } from "@/utils";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Separator } from "../ui/separator";
import { checkRole } from "@/utils/roles";
import { AddVitalSigns } from "../dialogs/add-vital-signs";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    title: "Signes vitaux",
    empty: "Aucun signe vital enregistré",
    temperature: "Température corporelle",
    bloodPressure: "Tension artérielle",
    heartRate: "Fréquence cardiaque",
    weight: "Poids",
    height: "Taille",
    bmi: "IMC",
    respiratory: "Fréquence respiratoire",
    oxygen: "Saturation en oxygène",
    measureDate: "Date de mesure",
  },
  en: {
    title: "Vital signs",
    empty: "No vital signs recorded",
    temperature: "Body temperature",
    bloodPressure: "Blood pressure",
    heartRate: "Heart rate",
    weight: "Weight",
    height: "Height",
    bmi: "BMI",
    respiratory: "Respiratory rate",
    oxygen: "Oxygen saturation",
    measureDate: "Measurement date",
  },
};

interface VitalSignsProps {
  id: number | string;
  patientId: string;
  doctorId: string;
  medicalId?: string;
  appointmentId?: string;
}

const ItemCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="w-full">
      <p className="text-lg xl:text-xl font-medium">{value}</p>
      <p className="text-sm xl:text-base text-gray-500">{label}</p>
    </div>
  );
};

export const VitalSigns = async ({
  id,
  patientId,
  doctorId,
}: VitalSignsProps) => {
  const data = await db.medicalRecords.findFirst({
    where: { appointment_id: Number(id) },
    include: {
      vital_signs: {
        orderBy: { created_at: "desc" },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const vitals = data?.vital_signs || null;
  const isPatient = await checkRole("PATIENT");
  const lang = await getLang();
  const t = STR[lang];
  const dateLocale = lang === "en" ? enUS : fr;

  return (
    <section id="vital-signs">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>{t.title}</CardTitle>

          {!isPatient && (
            <AddVitalSigns
              key={new Date().getTime()}
              patientId={patientId}
              doctorId={doctorId}
              appointmentId={id!.toString()}
              medicalId={data ? data?.id!.toString() : ""}
            />
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {vitals?.length === 0 || !vitals ? (
            <p className="text-sm text-gray-500 text-center py-6">
              {t.empty}
            </p>
          ) : (
            vitals.map((el) => {
              const { bmi, status, colorCode } = calculateBMI(
                el.weight || 0,
                el.height || 0
              );

              return (
                <div className="space-y-4" key={el?.id}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ItemCard
                      label={t.temperature}
                      value={`${el?.body_temperature}°C`}
                    />
                    <ItemCard
                      label={t.bloodPressure}
                      value={`${el?.systolic} / ${el?.diastolic} mmHg`}
                    />
                    <ItemCard label={t.heartRate} value={`${el?.heartRate} bpm`} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ItemCard label={t.weight} value={`${el?.weight} kg`} />
                    <ItemCard label={t.height} value={`${el?.height} cm`} />

                    <div className="w-full">
                      <div className="flex gap-x-2 items-center">
                        <p className="text-lg xl:text-xl font-medium">{bmi}</p>
                        <span
                          className="text-sm font-medium"
                          style={{ color: colorCode }}
                        >
                          ({status})
                        </span>
                      </div>
                      <p className="text-sm xl:text-base text-gray-500">{t.bmi}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ItemCard
                      label={t.respiratory}
                      value={`${el?.respiratory_rate || "—"}`}
                    />
                    <ItemCard
                      label={t.oxygen}
                      value={`${el?.oxygen_saturation || "—"}`}
                    />
                    <ItemCard
                      label={t.measureDate}
                      value={format(el?.created_at, "d MMM yyyy HH:mm", { locale: dateLocale })}
                    />
                  </div>
                  <Separator className="mt-4" />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </section>
  );
};
