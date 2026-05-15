import { NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { Role } from "@prisma/client";

// SessionStatus n'est pas encore dans le client généré (pré-migration)
const SessionStatusSchema = z.enum(["OPEN", "CLOSED"]);

const SearchParamsSchema = z.object({
  cashier_id: z.string().optional(),
  status: SessionStatusSchema.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: Request) {
  try {
    await requireRole([Role.ADMIN]);

    const { searchParams } = new URL(request.url);
    const queryResult = SearchParamsSchema.safeParse({
      cashier_id: searchParams.get("cashier_id") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: queryResult.error.flatten() },
        { status: 400 }
      );
    }
    const { cashier_id, status, from, to, page, limit } = queryResult.data;

    // Construction du filtre de date explicite pour éviter les erreurs TS
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const where = {
      ...(cashier_id ? { cashier_id } : {}),
      ...(status ? { status } : {}),
      ...(from || to ? { opened_at: dateFilter } : {}),
    };

    const [sessions, total] = await Promise.all([
      db.cashierSession.findMany({
        where,
        include: {
          _count: { select: { payments: true } },
          payments: {
            where: { status: "PAID" },
            select: { amount_paid: true, payment_method: true },
          },
        },
        orderBy: { opened_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.cashierSession.count({ where }),
    ]);

    return NextResponse.json({
      sessions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof ForbiddenError)
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error("[GET /api/admin/cashier-sessions]", e);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
