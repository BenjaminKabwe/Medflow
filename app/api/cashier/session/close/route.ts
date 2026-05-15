import { NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { Role } from "@prisma/client";

const BodySchema = z.object({
  closing_amount: z.number().min(0),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await requireRole([Role.CASHIER, Role.ADMIN]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const session = await db.cashierSession.findFirst({
      where: { cashier_id: userId, status: "OPEN" },
      select: { id: true, notes: true },
    });
    if (!session) {
      return NextResponse.json(
        { error: "Aucune session de caisse active" },
        { status: 404 }
      );
    }

    // Calcul automatique des totaux par mode
    const payments = await db.payment.findMany({
      where: { session_id: session.id, status: "PAID" },
      select: { payment_method: true, amount_paid: true },
    });

    const totals = {
      total_cash: 0,
      total_card: 0,
      total_mobile: 0,
      total_insurance: 0,
      total_transfer: 0,
    };
    for (const p of payments) {
      switch (p.payment_method) {
        case "CASH":          totals.total_cash      += p.amount_paid; break;
        case "CARD":          totals.total_card      += p.amount_paid; break;
        case "MOBILE_MONEY":  totals.total_mobile    += p.amount_paid; break;
        case "INSURANCE":     totals.total_insurance += p.amount_paid; break;
        case "BANK_TRANSFER": totals.total_transfer  += p.amount_paid; break;
      }
    }

    const closed = await db.cashierSession.update({
      where: { id: session.id },
      data: {
        status: "CLOSED",
        closed_at: new Date(),
        closing_amount: parsed.data.closing_amount,
        notes: parsed.data.notes ?? session.notes,
        ...totals,
      },
    });

    return NextResponse.json(closed);
  } catch (e) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof ForbiddenError)
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error("[POST /api/cashier/session/close]", e);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
