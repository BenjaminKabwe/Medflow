import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { calculateBMI } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Separator } from "../ui/separator";
import { checkRole } from "@/utils/roles";
import { AddVitalSigns } from "../dialogs/add-vital-signs";

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

  return (
    <section id="vital-signs">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Signes vitaux</CardTitle>

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
              Aucun signe vital enregistré
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
                      label="Température corporelle"
                      value={`${el?.body_temperature}°C`}
                    />
                    <ItemCard
                      label="Tension artérielle"
                      value={`${el?.systolic} / ${el?.diastolic} mmHg`}
                    />
                    <ItemCard label="Fréquence cardiaque" value={`${el?.heartRate} bpm`} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ItemCard label="Poids" value={`${el?.weight} kg`} />
                    <ItemCard label="Taille" value={`${el?.height} cm`} />

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
                      <p className="text-sm xl:text-base text-gray-500">IMC</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ItemCard
                      label="Fréquence respiratoire"
                      value={`${el?.respiratory_rate || "—"}`}
                    />
                    <ItemCard
                      label="Saturation en oxygène"
                      value={`${el?.oxygen_saturation || "—"}`}
                    />
                    <ItemCard
                      label="Date de mesure"
                      value={format(el?.created_at, "d MMM yyyy HH:mm", { locale: fr })}
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
