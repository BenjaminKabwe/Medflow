import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/lib/db";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { PaymentMethod, Role } from "@prisma/client";

const BodySchema = z.object({
  payment_method: z.nativeEnum(PaymentMethod),
  amount_paid: z.number().positive(),
  discount: z.number().min(0).optional().default(0),
});

function generateReceiptNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `REC-${date}-${rand}`;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireRole([Role.CASHIER]);

    const { id: rawId } = await params;
    const paymentId = Number(rawId);
    if (isNaN(paymentId)) {
      return NextResponse.json({ error: "ID de paiement invalide" }, { status: 400 });
    }

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
    const { payment_method, amount_paid, discount } = parsed.data;

    // 404 / 400 — paiement introuvable ou déjà encaissé
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, status: true, receipt_number: true },
    });
    if (!payment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }
    if (payment.status === "PAID") {
      return NextResponse.json(
        { error: "Ce paiement a déjà été encaissé" },
        { status: 400 }
      );
    }

    // 403 — session active obligatoire
    const session = await db.cashierSession.findFirst({
      where: { cashier_id: userId, status: "OPEN" },
      select: { id: true, cashier_name: true },
    });
    if (!session) {
      return NextResponse.json(
        { error: "Aucune session de caisse active" },
        { status: 403 }
      );
    }

    // 400 — mode de paiement inactif
    const methodConfig = await db.paymentMethodConfig.findUnique({
      where: { method: payment_method },
      select: { isActive: true, label: true },
    });
    if (!methodConfig?.isActive) {
      return NextResponse.json(
        {
          error: `Le mode de paiement "${methodConfig?.label ?? payment_method}" est désactivé`,
        },
        { status: 400 }
      );
    }

    const user = await currentUser();
    const cashierName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.username ||
      session.cashier_name;

    const receipt_number =
      payment.receipt_number?.trim() || generateReceiptNumber();

    const updated = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: "PAID",
        payment_method,
        amount_paid,
        discount: discount ?? 0,
        payment_date: new Date(),
        receipt_number,
        cashier_id: userId,
        cashier_name: cashierName,
        session_id: session.id,
      },
    });

    return NextResponse.json({
      payment: updated,
      receipt_number: updated.receipt_number,
    });
  } catch (e) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof ForbiddenError)
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error("[PATCH /api/cashier/payments/[id]/collect]", e);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
