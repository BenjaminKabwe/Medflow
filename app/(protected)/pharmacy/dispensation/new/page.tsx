import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Pill } from "lucide-react";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/permissions";
import { getDispensableMedications } from "@/utils/services/pharmacy";
import { getPrescriptionById } from "@/utils/services/prescription";
import {
  NewDispensationForm,
  type PrescriptionContext,
} from "@/components/pharmacy/new-dispensation-form";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    dispensePrescription: "Dispenser une ordonnance",
    newDispensation: "Nouvelle dispensation",
    subtitle:
      "Délivrance de médicaments à un patient — décrémente le stock.",
  },
  en: {
    dispensePrescription: "Dispense a prescription",
    newDispensation: "New dispensation",
    subtitle:
      "Dispensing medications to a patient — decrements stock.",
  },
} as const;

const ALLOWED: Role[] = [Role.ADMIN, Role.PHARMACIST, Role.NURSE];

export default async function NewDispensationPage({
  searchParams,
}: {
  searchParams: Promise<{ prescription?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!ALLOWED.includes(user.role)) redirect(`/${user.role.toLowerCase()}`);

  const sp = await searchParams;
  const t = STR[await getLang()];
  const medications = await getDispensableMedications();

  // Contexte ordonnance (optionnel) : pré-remplit patient + lignes
  let prescription: PrescriptionContext | undefined;
  const rxId = Number(sp.prescription);
  if (Number.isInteger(rxId) && rxId > 0) {
    const rx = await getPrescriptionById(rxId);
    if (
      rx &&
      (rx.status === "PENDING" || rx.status === "PARTIALLY_DISPENSED")
    ) {
      prescription = {
        id: rx.id,
        reference: rx.reference,
        patient: {
          id: rx.patient.id,
          name: `${rx.patient.first_name} ${rx.patient.last_name}`,
          phone: rx.patient.phone,
          gender: rx.patient.gender,
          dateOfBirth: rx.patient.date_of_birth.toISOString(),
        },
        items: rx.items.map((it) => ({
          medicationId: it.medication_id,
          remaining: it.quantity_prescribed - it.quantity_dispensed,
          dosage: it.dosage,
          medicationName: it.medication.name,
        })),
      };
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Link
          href={
            prescription
              ? `/pharmacy/prescriptions/${prescription.id}`
              : "/pharmacy/dispensation"
          }
          className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Pill className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {prescription ? t.dispensePrescription : t.newDispensation}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t.subtitle}
            </p>
          </div>
        </div>
      </div>

      <NewDispensationForm
        medications={medications}
        prescription={prescription}
      />
    </div>
  );
}
