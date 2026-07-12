import db from "@/lib/db";
import { Prisma } from "@prisma/client";

const DEFAULT_LIMIT = 20;

/** Catalogue des analyses (services de catégorie LABORATORY). */
export async function getLabServices() {
  return db.services.findMany({
    where: { category: "LABORATORY" },
    orderBy: { service_name: "asc" },
    select: { id: true, service_name: true, description: true, price: true },
  });
}

/** Liste paginée des analyses, avec patient / analyse / demandeur. */
export async function getLabTests({
  page = 1,
  limit = DEFAULT_LIMIT,
  search = "",
  status,
}: {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
} = {}) {
  const p = Math.max(1, Number(page));
  const take = Number(limit) || DEFAULT_LIMIT;
  const skip = (p - 1) * take;

  const where: Prisma.LabTestWhereInput = {
    ...(status
      ? { status: status as Prisma.EnumLabTestStatusFilter["equals"] }
      : {}),
    ...(search
      ? {
          OR: [
            { services: { service_name: { contains: search, mode: "insensitive" } } },
            { requested_by_name: { contains: search, mode: "insensitive" } },
            {
              medical_record: {
                patient: {
                  OR: [
                    { first_name: { contains: search, mode: "insensitive" } },
                    { last_name: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    db.labTest.findMany({
      where,
      orderBy: [{ status: "asc" }, { created_at: "desc" }],
      skip,
      take,
      include: {
        services: { select: { id: true, service_name: true, price: true } },
        medical_record: {
          select: {
            id: true,
            appointment_id: true,
            patient: {
              select: { id: true, first_name: true, last_name: true },
            },
          },
        },
      },
    }),
    db.labTest.count({ where }),
  ]);

  return {
    data,
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
}

export async function getLabTestById(id: number) {
  return db.labTest.findUnique({
    where: { id },
    include: {
      services: true,
      medical_record: {
        select: {
          id: true,
          appointment_id: true,
          patient: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              gender: true,
              date_of_birth: true,
              phone: true,
            },
          },
        },
      },
    },
  });
}

/** Analyses rattachées à un dossier médical (vue consultation / dossier patient). */
export async function getLabTestsForRecord(recordId: number) {
  return db.labTest.findMany({
    where: { record_id: recordId },
    orderBy: { created_at: "desc" },
    include: {
      services: { select: { id: true, service_name: true, price: true } },
    },
  });
}

/** KPI rapides pour le tableau de bord laborantin. */
export async function getLabStats() {
  const [requested, inProgress, completed] = await Promise.all([
    db.labTest.count({ where: { status: "REQUESTED" } }),
    db.labTest.count({ where: { status: "IN_PROGRESS" } }),
    db.labTest.count({ where: { status: "COMPLETED" } }),
  ]);
  return { requested, inProgress, completed, pending: requested + inProgress };
}
