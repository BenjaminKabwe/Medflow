import db from "@/lib/db";
import { Prisma } from "@prisma/client";

const DEFAULT_LIMIT = 20;

export type PrescriptionItemInput = {
  medication_id: number;
  quantity_prescribed: number;
  dosage: string;
  duration?: string | null;
  instructions?: string | null;
};

/**
 * Crée une ordonnance structurée + ses lignes, et attribue une référence
 * lisible (RX-<année>-<id>). Partagé par l'action `createPrescription` et par
 * le flux « diagnostic » qui prescrit dans la foulée.
 */
export async function createPrescriptionRecord(params: {
  patient_id: string;
  medical_record_id?: number | null;
  appointment_id?: number | null;
  doctor_id: string;
  doctor_name: string;
  notes?: string | null;
  items: PrescriptionItemInput[];
}): Promise<{ id: number; reference: string }> {
  return db.$transaction(async (tx) => {
    const rx = await tx.prescription.create({
      data: {
        reference: `RX-TMP-${Date.now()}`,
        patient_id: params.patient_id,
        medical_record_id: params.medical_record_id ?? undefined,
        appointment_id: params.appointment_id ?? undefined,
        doctor_id: params.doctor_id,
        doctor_name: params.doctor_name,
        notes: params.notes ?? undefined,
        items: {
          create: params.items.map((i) => ({
            medication_id: i.medication_id,
            quantity_prescribed: i.quantity_prescribed,
            dosage: i.dosage,
            duration: i.duration ?? undefined,
            instructions: i.instructions ?? undefined,
          })),
        },
      },
    });
    const reference = `RX-${new Date().getFullYear()}-${String(rx.id).padStart(
      5,
      "0"
    )}`;
    await tx.prescription.update({
      where: { id: rx.id },
      data: { reference },
    });
    return { id: rx.id, reference };
  });
}

export async function getPrescriptions({
  page = 1,
  limit = DEFAULT_LIMIT,
  search = "",
  status,
  patientId,
}: {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  patientId?: string;
} = {}) {
  const p = Math.max(1, Number(page));
  const take = Number(limit) || DEFAULT_LIMIT;
  const skip = (p - 1) * take;

  const where: Prisma.PrescriptionWhereInput = {
    ...(patientId ? { patient_id: patientId } : {}),
    ...(status
      ? { status: status as Prisma.EnumPrescriptionStatusFilter["equals"] }
      : {}),
    ...(search
      ? {
          OR: [
            { reference: { contains: search, mode: "insensitive" } },
            { doctor_name: { contains: search, mode: "insensitive" } },
            {
              patient: {
                OR: [
                  { first_name: { contains: search, mode: "insensitive" } },
                  { last_name: { contains: search, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    db.prescription.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take,
      include: {
        patient: { select: { id: true, first_name: true, last_name: true } },
        items: { select: { id: true, medication: { select: { name: true } } } },
        _count: { select: { items: true } },
      },
    }),
    db.prescription.count({ where }),
  ]);

  return {
    data,
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
}

export async function getPrescriptionById(id: number) {
  return db.prescription.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          phone: true,
          gender: true,
          date_of_birth: true,
        },
      },
      items: {
        include: { medication: true },
        orderBy: { id: "asc" },
      },
      dispensations: {
        select: {
          id: true,
          reference: true,
          dispensed_at: true,
          dispensed_by_name: true,
          total_amount: true,
        },
        orderBy: { dispensed_at: "desc" },
      },
    },
  });
}

export async function getPatientPrescriptions(patientId: string, limit = 10) {
  return db.prescription.findMany({
    where: { patient_id: patientId },
    orderBy: { created_at: "desc" },
    take: limit,
    include: {
      items: { include: { medication: true } },
    },
  });
}

/** KPI rapides : nombre d'ordonnances à dispenser. */
export async function getPrescriptionStats() {
  const [pending, partial] = await Promise.all([
    db.prescription.count({ where: { status: "PENDING" } }),
    db.prescription.count({ where: { status: "PARTIALLY_DISPENSED" } }),
  ]);
  return { pending, partial, toDispense: pending + partial };
}
