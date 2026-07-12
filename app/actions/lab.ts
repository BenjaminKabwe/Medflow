"use server";

import { am } from "@/lib/action-messages";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import db from "@/lib/db";
import { LabRequestSchema, LabResultSchema } from "@/lib/schema";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export type ActionResult<T = never> = {
  success: boolean;
  message: string;
  error?: boolean;
  data?: T;
};

const REQUESTER_ROLES = [Role.DOCTOR, Role.ADMIN] as const;
const LAB_ROLES = [Role.LAB_TECHNICIAN, Role.ADMIN] as const;
const CANCEL_ROLES = [Role.DOCTOR, Role.LAB_TECHNICIAN, Role.ADMIN] as const;

function handleError(err: unknown, fallback = "Une erreur est survenue"): ActionResult {
  if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
    return { success: false, message: err.message, error: true };
  }
  console.error("[lab action]", err);
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

/** Médecin : demande une ou plusieurs analyses pour un dossier médical. */
export async function requestLabTests(
  data: unknown
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireRole([...REQUESTER_ROLES]);
    const { userId, name } = await actorInfo();

    const parsed = LabRequestSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;

    // On ne garde que des services de catégorie LABORATORY réellement existants.
    const services = await db.services.findMany({
      where: { id: { in: v.service_ids }, category: "LABORATORY" },
      select: { id: true },
    });
    if (services.length === 0) {
      return {
        success: false,
        message: await am("noValidTest"),
        error: true,
      };
    }

    await db.labTest.createMany({
      data: services.map((s) => ({
        record_id: v.record_id,
        service_id: s.id,
        notes: v.notes ?? undefined,
        requested_by: userId,
        requested_by_name: name,
      })),
    });

    await logAudit({
      userId,
      action: "CREATE",
      model: "LabTest",
      recordId: String(v.record_id),
      details: `${services.length} analyse(s) demandée(s) (dossier #${v.record_id})`,
    });

    revalidatePath("/lab/tests");
    revalidatePath("/lab_technician");
    return {
      success: true,
      message: `${services.length} analyse(s) envoyée(s) au laboratoire`,
      data: { count: services.length },
    };
  } catch (err) {
    return handleError(err, "Impossible d'envoyer la demande d'analyses");
  }
}

/** Laborantin : prend en charge une analyse (REQUESTED → IN_PROGRESS). */
export async function startLabTest(id: number): Promise<ActionResult> {
  try {
    await requireRole([...LAB_ROLES]);
    const { userId, name } = await actorInfo();

    const test = await db.labTest.findUnique({ where: { id } });
    if (!test) {
      return { success: false, message: "Analyse introuvable", error: true };
    }
    if (test.status !== "REQUESTED") {
      return {
        success: false,
        message: "Cette analyse n'est plus en attente",
        error: true,
      };
    }

    await db.labTest.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        performed_by: userId,
        performed_by_name: name,
      },
    });
    await logAudit({
      userId,
      action: "UPDATE",
      model: "LabTest",
      recordId: String(id),
      details: "prise en charge (REQUESTED → IN_PROGRESS)",
    });

    revalidatePath("/lab/tests");
    revalidatePath("/lab_technician");
    return { success: true, message: "Analyse prise en charge" };
  } catch (err) {
    return handleError(err);
  }
}

/** Laborantin : saisit le résultat et clôture l'analyse (→ COMPLETED). */
export async function submitLabResult(data: unknown): Promise<ActionResult> {
  try {
    await requireRole([...LAB_ROLES]);
    const { userId, name } = await actorInfo();

    const parsed = LabResultSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;

    const test = await db.labTest.findUnique({ where: { id: v.id } });
    if (!test) {
      return { success: false, message: "Analyse introuvable", error: true };
    }
    if (test.status === "COMPLETED" || test.status === "CANCELLED") {
      return {
        success: false,
        message: await am("testAlreadyClosed"),
        error: true,
      };
    }

    await db.labTest.update({
      where: { id: v.id },
      data: {
        result: v.result,
        notes: v.notes ?? test.notes ?? undefined,
        status: "COMPLETED",
        test_date: new Date(),
        completed_at: new Date(),
        performed_by: test.performed_by ?? userId,
        performed_by_name: test.performed_by_name ?? name,
      },
    });
    await logAudit({
      userId,
      action: "UPDATE",
      model: "LabTest",
      recordId: String(v.id),
      details: "résultat saisi (→ COMPLETED)",
    });

    revalidatePath("/lab/tests");
    revalidatePath("/lab_technician");
    revalidatePath(`/record/appointments/${test.record_id}`);
    return { success: true, message: await am("resultSaved") };
  } catch (err) {
    return handleError(err, "Impossible d'enregistrer le résultat");
  }
}

/** Annule une analyse (tant qu'elle n'est pas clôturée). */
export async function cancelLabTest(id: number): Promise<ActionResult> {
  try {
    const { userId } = await requireRole([...CANCEL_ROLES]);
    const test = await db.labTest.findUnique({ where: { id } });
    if (!test) {
      return { success: false, message: "Analyse introuvable", error: true };
    }
    if (test.status === "COMPLETED" || test.status === "CANCELLED") {
      return {
        success: false,
        message: await am("testCannotCancel"),
        error: true,
      };
    }

    await db.labTest.update({ where: { id }, data: { status: "CANCELLED" } });
    await logAudit({
      userId,
      action: "UPDATE",
      model: "LabTest",
      recordId: String(id),
      details: `annulation (statut ${test.status} → CANCELLED)`,
    });

    revalidatePath("/lab/tests");
    revalidatePath("/lab_technician");
    return { success: true, message: await am("testCancelled") };
  } catch (err) {
    return handleError(err);
  }
}
