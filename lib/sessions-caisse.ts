import db from "@/lib/db";
import {
  getOrCreateActiveSession,
  attachPaymentToSession,
  closeSessionById,
} from "@/utils/services/cashier-sessions";

// ── Types publics ─────────────────────────────────────────────────────────────

export type SessionAvecStats = Awaited<ReturnType<typeof getAllSessions>>[number];
export type SessionActive    = Awaited<ReturnType<typeof getSessionActive>>;

// ── Lecture ───────────────────────────────────────────────────────────────────

/** Liste toutes les sessions avec compteur de paiements et total encaissé. */
export async function getAllSessions(filters?: {
  statut?: "OPEN" | "CLOSED";
  from?:   Date;
  to?:     Date;
}) {
  return db.cashierSession.findMany({
    where: {
      ...(filters?.statut ? { status: filters.statut } : {}),
      ...(filters?.from || filters?.to
        ? {
            opened_at: {
              ...(filters?.from ? { gte: filters.from } : {}),
              ...(filters?.to   ? { lte: filters.to   } : {}),
            },
          }
        : {}),
    },
    include: {
      _count:   { select: { payments: true } },
      payments: { where: { status: "PAID" }, select: { amount_paid: true } },
    },
    orderBy: { opened_at: "desc" },
  });
}

/** Retourne la session OPEN du jour ou null. */
export async function getSessionActive() {
  return db.cashierSession.findFirst({
    where:   { status: "OPEN" },
    orderBy: { opened_at: "desc" },
    include: { _count: { select: { payments: true } } },
  });
}

/** Détail complet d'une session : paiements + infos patient + rendez-vous. */
export async function getSessionById(sessionId: number) {
  return db.cashierSession.findUnique({
    where: { id: sessionId },
    include: {
      _count: { select: { payments: true } },
      payments: {
        orderBy: { payment_date: "desc" },
        include: {
          patient: {
            select: { id: true, first_name: true, last_name: true },
          },
          appointment: {
            select: { id: true, appointment_date: true, type: true },
          },
        },
      },
    },
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Crée une session automatiquement si aucune n'est active.
 * Idempotent : renvoie la session existante si déjà ouverte.
 */
export async function creerSessionSiAbsente(userId: string, userName: string) {
  return getOrCreateActiveSession(userId, userName);
}

/**
 * Lie un paiement à une session et incrémente le total encaissé.
 * Idempotent : ne fait rien si le paiement est déjà rattaché.
 */
export async function rattacherPaiement(paymentId: number, sessionId: number) {
  const payment = await db.payment.findUnique({
    where:  { id: paymentId },
    select: { amount_paid: true, payment_method: true, session_id: true },
  });

  if (!payment) throw new Error("Paiement introuvable");
  if (payment.session_id) return; // déjà rattaché — idempotent

  return attachPaymentToSession(
    paymentId,
    sessionId,
    payment.amount_paid,
    payment.payment_method
  );
}

/**
 * Ouvre manuellement une nouvelle session.
 * Lève une erreur si une session est déjà active.
 */
export async function ouvrirSession(userId: string, userName: string) {
  const active = await db.cashierSession.findFirst({
    where:  { status: "OPEN" },
    select: { id: true },
  });
  if (active) {
    throw new Error(
      "Une session est déjà active. Clôturez-la avant d'en ouvrir une nouvelle."
    );
  }

  return db.cashierSession.create({
    data: {
      cashier_id:      userId,
      cashier_name:    userName,
      opening_amount:  0,
      status:          "OPEN",
      total_cash:      0,
      total_card:      0,
      total_mobile:    0,
      total_insurance: 0,
      total_transfer:  0,
    },
    select: { id: true },
  });
}

/**
 * Clôture une session active. Recalcule le total final.
 * Lève une erreur si la session est introuvable ou déjà clôturée.
 */
export async function cloturerSession(sessionId: number) {
  return closeSessionById(sessionId);
}
