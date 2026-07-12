"use server";

import { am } from "@/lib/action-messages";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import db from "@/lib/db";
import { PrescriptionSchema } from "@/lib/schema";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createPrescriptionRecord } from "@/utils/services/prescription";

export type ActionResult<T = never> = {
  success: boolean;
  message: string;
  error?: boolean;
  data?: T;
};

// Prescrire est un acte médical : seul le médecin qui mène la consultation
// peut créer une ordonnance (pas l'admin, l'infirmier, etc.).
const PRESCRIBER_ROLES = [Role.DOCTOR] as const;
const CANCEL_ROLES = [Role.DOCTOR, Role.ADMIN, Role.PHARMACIST] as const;

function handleError(err: unknown, fallback = "Une erreur est survenue"): ActionResult {
  if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
    return { success: false, message: err.message, error: true };
  }
  console.error("[prescription action]", err);
  return { success: false, message: fallback, error: true };
}

async function actorInfo() {
  const user = await currentUser();
  if (!user) throw new UnauthorizedError();
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.emailAddresses[0]?.emailAddress ||
    user.id;
  return { userId: user.id, name };
}

export async function createPrescription(
  data: unknown
): Promise<ActionResult<{ id: number; reference: string }>> {
  try {
    await requireRole([...PRESCRIBER_ROLES]);
    const { userId, name } = await actorInfo();

    const parsed = PrescriptionSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;

    const result = await createPrescriptionRecord({
      patient_id: v.patient_id,
      medical_record_id: v.medical_record_id,
      appointment_id: v.appointment_id,
      doctor_id: userId,
      doctor_name: name,
      notes: v.notes,
      items: v.items,
    });

    await logAudit({
      userId,
      action: "CREATE",
      model: "Prescription",
      recordId: String(result.id),
      newValues: { reference: result.reference, patient_id: v.patient_id },
    });

    revalidatePath("/pharmacy/prescriptions");
    revalidatePath(`/patient/${v.patient_id}`);
    return {
      success: true,
      message: `Ordonnance ${result.reference} créée`,
      data: result,
    };
  } catch (err) {
    return handleError(err, "Impossible de créer l'ordonnance");
  }
}

export async function cancelPrescription(id: number): Promise<ActionResult> {
  try {
    const { userId } = await requireRole([...CANCEL_ROLES]);
    const rx = await db.prescription.findUnique({ where: { id } });
    if (!rx) {
      return { success: false, message: "Ordonnance introuvable", error: true };
    }
    if (rx.status === "DISPENSED" || rx.status === "CANCELLED") {
      return {
        success: false,
        message: await am("rxCannotCancel"),
        error: true,
      };
    }

    await db.prescription.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    await logAudit({
      userId,
      action: "UPDATE",
      model: "Prescription",
      recordId: String(id),
      details: `annulation (statut ${rx.status} → CANCELLED)`,
    });

    revalidatePath("/pharmacy/prescriptions");
    revalidatePath(`/pharmacy/prescriptions/${id}`);
    return { success: true, message: await am("rxCancelled") };
  } catch (err) {
    return handleError(err);
  }
}
