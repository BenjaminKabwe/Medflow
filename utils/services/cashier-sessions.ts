import db from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SessionDetail = Awaited<ReturnType<typeof getSessionDetail>>;
export type SessionPayment = NonNullable<SessionDetail>["payments"][number];

// ── Session queries ───────────────────────────────────────────────────────────

/** Première session OPEN, quelle que soit l'identité du caissier. */
export function getActiveSession() {
  return db.cashierSession.findFirst({
    where: { status: "OPEN" },
    orderBy: { opened_at: "desc" },
    select: { id: true, cashier_id: true, cashier_name: true },
  });
}

/**
 * Renvoie la session active, ou en crée une automatiquement.
 * Utilisé quand un paiement est validé hors workflow caissier (ex. generateBill).
 */
export async function getOrCreateActiveSession(
  userId: string,
  userName: string,
  tx?: Prisma.TransactionClient
): Promise<{ id: number; cashier_name: string }> {
  const client = tx ?? db;

  const existing = await client.cashierSession.findFirst({
    where: { status: "OPEN" },
    orderBy: { opened_at: "desc" },
    select: { id: true, cashier_name: true },
  });
  if (existing) return existing;

  return client.cashierSession.create({
    data: {
      cashier_id:     userId,
      cashier_name:   userName,
      opening_amount: 0,
      status:         "OPEN",
      total_cash:      0,
      total_card:      0,
      total_mobile:    0,
      total_insurance: 0,
      total_transfer:  0,
      notes: "Session créée automatiquement lors d'un encaissement",
    },
    select: { id: true, cashier_name: true },
  });
}

/**
 * Lie un paiement à une session et recalcule `total_cash/card/…` en live.
 * Tout se passe dans une transaction atomique.
 */
export async function attachPaymentToSession(
  paymentId: number,
  sessionId: number,
  amountPaid: number,
  paymentMethod: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx ?? db;

  // Récupère le paiement pour vérifier qu'il n'est pas déjà rattaché
  const payment = await client.payment.findUnique({
    where: { id: paymentId },
    select: { session_id: true },
  });
  if (payment?.session_id) return; // déjà rattaché, idempotent

  await client.payment.update({
    where: { id: paymentId },
    data: { session_id: sessionId },
  });

  // Incrément du sous-total par mode de paiement
  const fieldMap: Record<string, string> = {
    CASH:          "total_cash",
    CARD:          "total_card",
    MOBILE_MONEY:  "total_mobile",
    INSURANCE:     "total_insurance",
    BANK_TRANSFER: "total_transfer",
  };
  const field = fieldMap[paymentMethod];
  if (field) {
    // Prisma's `increment` on a NULL Float column yields NULL (NULL + n = NULL in PostgreSQL).
    // Read the current value and set explicitly to handle pre-existing null sessions.
    const current = await client.cashierSession.findUnique({
      where:  { id: sessionId },
      select: { [field]: true } as Record<string, true>,
    });
    const prev = ((current as Record<string, number | null> | null)?.[field]) ?? 0;
    await client.cashierSession.update({
      where: { id: sessionId },
      data:  { [field]: prev + amountPaid },
    });
  }
}

/** Détail complet d'une session avec tous les paiements + infos patient. */
export function getSessionDetail(sessionId: number) {
  return db.cashierSession.findUnique({
    where: { id: sessionId },
    include: {
      _count: { select: { payments: true } },
      payments: {
        orderBy: { payment_date: "desc" },
        include: {
          patient: {
            select: {
              first_name: true,
              last_name: true,
              id: true,
            },
          },
          appointment: {
            select: { appointment_date: true, type: true, id: true },
          },
        },
      },
    },
  });
}

/** Clôture n'importe quelle session (usage admin, sans vérifier cashier_id). */
export async function closeSessionById(sessionId: number): Promise<void> {
  const session = await db.cashierSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });
  if (!session || session.status === "CLOSED") {
    throw new Error("Session introuvable ou déjà clôturée");
  }

  // Recalcul des totaux par mode
  const payments = await db.payment.findMany({
    where: { session_id: sessionId, status: "PAID" },
    select: { payment_method: true, amount_paid: true },
  });

  const totals = {
    total_cash: 0, total_card: 0, total_mobile: 0,
    total_insurance: 0, total_transfer: 0,
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
    where: { id: sessionId },
    data: { status: "CLOSED", closed_at: new Date(), ...totals },
  });
}
