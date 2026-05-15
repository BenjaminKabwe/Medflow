import { NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { Prisma, PaymentMethod, Role } from "@prisma/client";

// Valide que le segment dynamique est une valeur connue de l'enum
const MethodParamSchema = z.nativeEnum(PaymentMethod);

const UpdateBodySchema = z
  .object({
    label: z.string().min(1, "Le libellé est requis").max(50).optional(),
    description: z.string().max(300).optional(),
    fees: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ method: string }> }
) {
  try {
    await requireRole([Role.ADMIN]);

    const { method: rawMethod } = await params;

    const methodResult = MethodParamSchema.safeParse(rawMethod.toUpperCase());
    if (!methodResult.success) {
      return NextResponse.json(
        { error: `Mode de paiement inconnu : ${rawMethod}` },
        { status: 400 }
      );
    }
    const method = methodResult.data;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    }

    const bodyResult = UpdateBodySchema.safeParse(body);
    if (!bodyResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: bodyResult.error.flatten() },
        { status: 422 }
      );
    }

    const { metadata, ...rest } = bodyResult.data;
    const updated = await db.paymentMethodConfig.update({
      where: { method },
      data: {
        ...rest,
        ...(metadata !== undefined && { metadata: metadata as Prisma.InputJsonValue }),
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof ForbiddenError)
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error("[PATCH /api/admin/payment-methods/[method]]", e);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
