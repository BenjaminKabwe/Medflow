import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/lib/db";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { Role } from "@prisma/client";

const BodySchema = z.object({
  opening_amount: z.number().min(0),
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

    // 409 — session déjà ouverte
    const existing = await db.cashierSession.findFirst({
      where: { cashier_id: userId, status: "OPEN" },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Une session de caisse est déjà ouverte" },
        { status: 409 }
      );
    }

    const user = await currentUser();
    const cashierName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.username ||
      "Caissier";

    const session = await db.cashierSession.create({
      data: {
        cashier_id: userId,
        cashier_name: cashierName,
        opening_amount: parsed.data.opening_amount,
        notes: parsed.data.notes,
        status: "OPEN",
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof ForbiddenError)
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error("[POST /api/cashier/session/open]", e);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
