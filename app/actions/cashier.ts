"use server";

import { am } from "@/lib/action-messages";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/lib/db";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { PaymentMethod, Role } from "@prisma/client";
import { closeSessionById } from "@/utils/services/cashier-sessions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionResult<T = never> = {
  success: boolean;
  message: string;
  error?: boolean;
  data?: T;
};

// ─── Schémas Zod ──────────────────────────────────────────────────────────────

const OpenSessionSchema = z.object({
  opening_amount: z.coerce
    .number()
    .min(0, "Le fond de caisse ne peut pas être négatif"),
  notes: z.string().max(500).optional(),
});

const CloseSessionSchema = z.object({
  closing_amount: z.coerce
    .number()
    .min(0, "Le montant de clôture ne peut pas être négatif"),
  notes: z.string().max(500).optional(),
});

const CollectPaymentSchema = z.object({
  payment_method: z.nativeEnum(PaymentMethod),
  amount_paid: z.coerce
    .number()
    .positive("Le montant encaissé doit être supérieur à 0"),
  discount: z.coerce.number().min(0).optional().default(0),
});

export type OpenSessionValues = z.infer<typeof OpenSessionSchema>;
export type CloseSessionValues = z.infer<typeof CloseSessionSchema>;
export type CollectPaymentValues = z.infer<typeof CollectPaymentSchema>;

// ─── Helpers internes ─────────────────────────────────────────────────────────

function generateReceiptNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `REC-${date}-${rand}`;
}

function handleError(e: unknown): ActionResult {
  if (e instanceof UnauthorizedError || e instanceof ForbiddenError) {
    return { success: false, error: true, message: e.message };
  }
  console.error("[cashier action]", e);
  return { success: false, error: true, message: "Erreur interne du serveur" };
}

async function resolveCashierName(fallback: string): Promise<string> {
  const user = await currentUser();
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    fallback
  );
}

// ─── openSession ──────────────────────────────────────────────────────────────

export async function openSession(
  values: OpenSessionValues
): Promise<ActionResult<{ sessionId: number }>> {
  try {
    const { userId } = await requireRole([Role.CASHIER, Role.ADMIN]);

    const parsed = OpenSessionSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        error: true,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
      };
    }

    // 409 — double session simultanée
    const existing = await db.cashierSession.findFirst({
      where: { cashier_id: userId, status: "OPEN" },
      select: { id: true },
    });
    if (existing) {
      return {
        success: false,
        error: true,
        message:
          "Une session est déjà ouverte. Clôturez-la avant d'en ouvrir une nouvelle.",
      };
    }

    const cashierName = await resolveCashierName("Caissier");

    const session = await db.cashierSession.create({
      data: {
        cashier_id:      userId,
        cashier_name:    cashierName,
        opening_amount:  parsed.data.opening_amount,
        notes:           parsed.data.notes,
        status:          "OPEN",
        total_cash:      0,
        total_card:      0,
        total_mobile:    0,
        total_insurance: 0,
        total_transfer:  0,
      },
      select: { id: true },
    });

    revalidatePath("/cashier/dashboard");
    revalidatePath("/administration/sessions-de-caisse");
    revalidatePath("/admin/cashier-sessions");
    return {
      success: true,
      message: await am("cashSessionOpened"),
      data: { sessionId: session.id },
    };
  } catch (e) {
    return handleError(e);
  }
}

// ─── closeSession ─────────────────────────────────────────────────────────────

export async function closeSession(
  values: CloseSessionValues
): Promise<ActionResult> {
  try {
    const { userId } = await requireRole([Role.CASHIER, Role.ADMIN]);

    const parsed = CloseSessionSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        error: true,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
      };
    }

    const session = await db.cashierSession.findFirst({
      where: { cashier_id: userId, status: "OPEN" },
      select: { id: true, notes: true },
    });
    if (!session) {
      return {
        success: false,
        error: true,
        message: "Aucune session de caisse active",
      };
    }

    // Calcul automatique des totaux par mode de paiement
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

    await db.cashierSession.update({
      where: { id: session.id },
      data: {
        status: "CLOSED",
        closed_at: new Date(),
        closing_amount: parsed.data.closing_amount,
        notes: parsed.data.notes ?? session.notes,
        ...totals,
      },
    });

    revalidatePath("/cashier/dashboard");
    revalidatePath("/admin/cashier-sessions");
    revalidatePath("/administration/sessions-de-caisse");
    return { success: true, message: await am("cashSessionClosed") };
  } catch (e) {
    return handleError(e);
  }
}

// ─── collectPayment ───────────────────────────────────────────────────────────

export async function collectPayment(
  paymentId: number,
  values: CollectPaymentValues
): Promise<ActionResult<{ receipt_number: string }>> {
  try {
    const { userId } = await requireRole([Role.CASHIER, Role.ADMIN]);

    const parsed = CollectPaymentSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        error: true,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
      };
    }
    const { payment_method, amount_paid, discount } = parsed.data;

    // 400 — paiement introuvable ou déjà encaissé
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, status: true, receipt_number: true },
    });
    if (!payment) {
      return { success: false, error: true, message: "Paiement introuvable" };
    }
    if (payment.status === "PAID") {
      return {
        success: false,
        error: true,
        message: await am("alreadyCollected"),
      };
    }

    // 403 — session active obligatoire
    const session = await db.cashierSession.findFirst({
      where: { cashier_id: userId, status: "OPEN" },
      select: { id: true, cashier_name: true },
    });
    if (!session) {
      return {
        success: false,
        error: true,
        message:
          "Aucune session de caisse active. Ouvrez une session avant d'encaisser.",
      };
    }

    // 400 — mode de paiement inactif
    const methodConfig = await db.paymentMethodConfig.findUnique({
      where: { method: payment_method },
      select: { isActive: true, label: true },
    });
    if (!methodConfig?.isActive) {
      return {
        success: false,
        error: true,
        message: `Le mode de paiement "${methodConfig?.label ?? payment_method}" est désactivé`,
      };
    }

    const cashierName = await resolveCashierName(session.cashier_name);
    const receipt_number =
      payment.receipt_number?.trim() || generateReceiptNumber();

    await db.payment.update({
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

    revalidatePath("/cashier/dashboard");
    revalidatePath("/administration/sessions-de-caisse");
    revalidatePath("/admin/cashier-sessions");
    return {
      success: true,
      message: await am("paymentCollected"),
      data: { receipt_number },
    };
  } catch (e) {
    return handleError(e);
  }
}

// ─── adminCloseSession ────────────────────────────────────────────────────────

export async function adminCloseSession(sessionId: number): Promise<ActionResult> {
  try {
    await requireRole([Role.ADMIN]);
    await closeSessionById(sessionId);
    revalidatePath("/admin/cashier-sessions");
    revalidatePath("/administration/sessions-de-caisse");
    return { success: true, message: await am("sessionClosed") };
  } catch (e) {
    return handleError(e);
  }
}

// ─── Read helpers (Server Components) ────────────────────────────────────────

export async function getCurrentSession(cashierId: string) {
  return db.cashierSession.findFirst({
    where: { cashier_id: cashierId, status: "OPEN" },
    include: {
      payments: {
        where: { status: "PAID" },
        select: { amount_paid: true, payment_method: true },
      },
    },
  });
}

export async function getUnpaidPayments() {
  return db.payment.findMany({
    where: { status: "UNPAID" },
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
    orderBy: { bill_date: "asc" },
  });
}

export async function getSessionPayments(
  sessionId: number,
  status?: "PAID" | "UNPAID" | "PART"
) {
  return db.payment.findMany({
    where: { session_id: sessionId, ...(status ? { status } : {}) },
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
}

export async function getAllCashierSessions(filters?: {
  cashier_id?: string;
  status?: "OPEN" | "CLOSED";
  from?: Date;
  to?: Date;
}) {
  return db.cashierSession.findMany({
    where: {
      ...(filters?.cashier_id ? { cashier_id: filters.cashier_id } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.from || filters?.to
        ? {
            opened_at: {
              ...(filters?.from ? { gte: filters.from } : {}),
              ...(filters?.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    include: {
      _count: { select: { payments: true } },
      payments: {
        where: { status: "PAID" },
        select: { amount_paid: true, payment_method: true },
      },
    },
    orderBy: { opened_at: "desc" },
  });
}
