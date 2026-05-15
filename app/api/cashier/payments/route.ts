import { NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { PaymentStatus, Role } from "@prisma/client";

const SearchParamsSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  date: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { userId } = await requireRole([Role.CASHIER, Role.ADMIN]);

    const { searchParams } = new URL(request.url);
    const queryResult = SearchParamsSchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      date: searchParams.get("date") ?? undefined,
    });
    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: queryResult.error.flatten() },
        { status: 400 }
      );
    }
    const { status, date } = queryResult.data;

    const session = await db.cashierSession.findFirst({
      where: { cashier_id: userId, status: "OPEN" },
      select: { id: true },
    });
    if (!session) {
      return NextResponse.json({ payments: [], session: null });
    }

    const dateFilter = date ? new Date(date) : undefined;

    const payments = await db.payment.findMany({
      where: {
        session_id: session.id,
        ...(status ? { status } : {}),
        ...(dateFilter
          ? {
              payment_date: {
                gte: new Date(dateFilter.setHours(0, 0, 0, 0)),
                lte: new Date(dateFilter.setHours(23, 59, 59, 999)),
              },
            }
          : {}),
      },
      include: {
        patient: {
          select: {
            first_name: true,
            last_name: true,
            img: true,
            colorCode: true,
          },
        },
        appointment: {
          select: { appointment_date: true, type: true },
        },
      },
      orderBy: { updated_at: "desc" },
    });

    return NextResponse.json({ payments, sessionId: session.id });
  } catch (e) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof ForbiddenError)
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error("[GET /api/cashier/payments]", e);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
