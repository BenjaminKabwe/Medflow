import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import {
  requireRole,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/permissions";
import { searchPatientsForDispensation } from "@/utils/services/pharmacy";

export async function GET(req: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.PHARMACIST, Role.NURSE]);

    const q = req.nextUrl.searchParams.get("q") ?? "";
    const patients = await searchPatientsForDispensation(q);

    return NextResponse.json({
      patients: patients.map((p) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        phone: p.phone,
        gender: p.gender,
        dateOfBirth: p.date_of_birth,
      })),
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[/api/pharmacy/patients/search]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
