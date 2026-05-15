import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const { userId } = await requireRole([Role.CASHIER, Role.ADMIN]);

    const session = await db.cashierSession.findFirst({
      where: { cashier_id: userId, status: "OPEN" },
      include: {
        payments: {
          where: { status: "PAID" },
          select: { amount_paid: true, payment_method: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    return NextResponse.json({ session });
  } catch (e) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof ForbiddenError)
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error("[GET /api/cashier/session/current]", e);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
