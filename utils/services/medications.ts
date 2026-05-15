import db from "@/lib/db";

export async function getMedications({
  page = "1",
  search = "",
  limit = 10,
}: {
  page?: string;
  search?: string;
  limit?: number;
}) {
  const currentPage = Number(page);
  const skip = (currentPage - 1) * limit;

  const where = {
    prescribed_medications: { not: null },
    ...(search
      ? {
          OR: [
            { patient: { first_name: { contains: search, mode: "insensitive" as const } } },
            { patient: { last_name:  { contains: search, mode: "insensitive" as const } } },
            { prescribed_medications: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    db.diagnosis.findMany({
      where,
      include: {
        patient: { select: { first_name: true, last_name: true, img: true, colorCode: true, gender: true } },
        doctor:  { select: { name: true, specialization: true } },
        medical: { select: { appointment_id: true } },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    db.diagnosis.count({ where }),
  ]);

  return {
    data,
    totalRecords: total,
    totalPages: Math.ceil(total / limit),
    currentPage,
  };
}
