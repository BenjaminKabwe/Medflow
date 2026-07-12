import db from "@/lib/db";
import { Prisma } from "@prisma/client";

const DEFAULT_LIMIT = 20;

/** Seuils pour les alertes de péremption */
export const EXPIRY_ALERT_DAYS = 90;
export const EXPIRY_CRITICAL_DAYS = 30;

// ─── Médicaments (catalogue) ─────────────────────────────────────────────────

export async function getMedications({
  page = 1,
  limit = DEFAULT_LIMIT,
  search = "",
  category,
  activeOnly = true,
}: {
  page?: number | string;
  limit?: number | string;
  search?: string;
  category?: string;
  activeOnly?: boolean;
} = {}) {
  const p = Math.max(1, Number(page));
  const take = Number(limit) || DEFAULT_LIMIT;
  const skip = (p - 1) * take;

  const where: Prisma.MedicationWhereInput = {
    ...(activeOnly ? { is_active: true } : {}),
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { dci: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    db.medication.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take,
      include: {
        stocks: {
          select: { quantity: true, expiry_date: true, selling_price: true },
        },
      },
    }),
    db.medication.count({ where }),
  ]);

  const now = new Date();
  const enriched = data.map((m) => {
    const totalStock = m.stocks.reduce(
      (s, l) => s + (l.expiry_date > now ? l.quantity : 0),
      0
    );
    const lastPrice =
      m.stocks.length > 0
        ? m.stocks[m.stocks.length - 1].selling_price
        : null;
    return {
      ...m,
      totalStock,
      lastPrice,
      isLowStock: totalStock <= m.reorder_level,
    };
  });

  return {
    data: enriched,
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
}

export async function getMedicationById(id: number) {
  return db.medication.findUnique({
    where: { id },
    include: {
      stocks: {
        include: { supplier: true },
        orderBy: { expiry_date: "asc" },
      },
    },
  });
}

export async function getMedicationCategories(): Promise<string[]> {
  const rows = await db.medication.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });
  return rows
    .map((r) => r.category!)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

// ─── Fournisseurs ────────────────────────────────────────────────────────────

export async function getSuppliers({
  page = 1,
  limit = DEFAULT_LIMIT,
  search = "",
  activeOnly = false,
}: {
  page?: number | string;
  limit?: number | string;
  search?: string;
  activeOnly?: boolean;
} = {}) {
  const p = Math.max(1, Number(page));
  const take = Number(limit) || DEFAULT_LIMIT;
  const skip = (p - 1) * take;

  const where: Prisma.SupplierWhereInput = {
    ...(activeOnly ? { is_active: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { contact_person: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    db.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take,
      include: { _count: { select: { stocks: true, orders: true } } },
    }),
    db.supplier.count({ where }),
  ]);

  return {
    data,
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
}

// ─── Stocks & mouvements ─────────────────────────────────────────────────────

export async function getStockList({
  page = 1,
  limit = DEFAULT_LIMIT,
  search = "",
}: {
  page?: number | string;
  limit?: number | string;
  search?: string;
} = {}) {
  const p = Math.max(1, Number(page));
  const take = Number(limit) || DEFAULT_LIMIT;
  const skip = (p - 1) * take;

  const where: Prisma.MedicationStockWhereInput = search
    ? {
        OR: [
          { batch_number: { contains: search, mode: "insensitive" } },
          {
            medication: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { dci: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    db.medicationStock.findMany({
      where,
      orderBy: { expiry_date: "asc" },
      skip,
      take,
      include: {
        medication: true,
        supplier: { select: { id: true, name: true } },
      },
    }),
    db.medicationStock.count({ where }),
  ]);

  return {
    data,
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
}

export async function getStockMovements(stockId: number, limit = 50) {
  return db.stockMovement.findMany({
    where: { stock_id: stockId },
    orderBy: { created_at: "desc" },
    take: limit,
  });
}

// ─── Alertes ─────────────────────────────────────────────────────────────────

/** Médicaments dont le stock disponible est ≤ reorder_level */
export async function getLowStockMedications() {
  const meds = await db.medication.findMany({
    where: { is_active: true },
    include: {
      stocks: {
        where: { expiry_date: { gt: new Date() } },
        select: { quantity: true },
      },
    },
  });

  return meds
    .map((m) => {
      const total = m.stocks.reduce((s, l) => s + l.quantity, 0);
      return { ...m, totalStock: total };
    })
    .filter((m) => m.totalStock <= m.reorder_level)
    .sort((a, b) => a.totalStock - b.totalStock);
}

/** Lots proches de la péremption (<= daysAhead jours) et non périmés */
export async function getExpiringStocks(daysAhead = EXPIRY_ALERT_DAYS) {
  const now = new Date();
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + daysAhead);

  return db.medicationStock.findMany({
    where: {
      quantity: { gt: 0 },
      expiry_date: { gte: now, lte: limitDate },
    },
    orderBy: { expiry_date: "asc" },
    include: { medication: true },
  });
}

/** Lots déjà périmés mais non vidés — à retirer physiquement */
export async function getExpiredStocks() {
  return db.medicationStock.findMany({
    where: {
      quantity: { gt: 0 },
      expiry_date: { lt: new Date() },
    },
    orderBy: { expiry_date: "asc" },
    include: { medication: true },
  });
}

// ─── Dispensations ───────────────────────────────────────────────────────────

export async function getDispensations({
  page = 1,
  limit = DEFAULT_LIMIT,
  search = "",
  patientId,
}: {
  page?: number | string;
  limit?: number | string;
  search?: string;
  patientId?: string;
} = {}) {
  const p = Math.max(1, Number(page));
  const take = Number(limit) || DEFAULT_LIMIT;
  const skip = (p - 1) * take;

  const where: Prisma.DispensationWhereInput = {
    ...(patientId ? { patient_id: patientId } : {}),
    ...(search
      ? {
          OR: [
            { reference: { contains: search, mode: "insensitive" } },
            {
              patient: {
                OR: [
                  { first_name: { contains: search, mode: "insensitive" } },
                  { last_name: { contains: search, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    db.dispensation.findMany({
      where,
      orderBy: { dispensed_at: "desc" },
      skip,
      take,
      include: {
        patient: { select: { id: true, first_name: true, last_name: true } },
        items: { include: { medication: true } },
      },
    }),
    db.dispensation.count({ where }),
  ]);

  return {
    data,
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
}

/**
 * Médicaments dispensables : actifs, ayant au moins un lot non périmé
 * avec du stock disponible. Chaque médicament est renvoyé avec ses lots
 * (triés par péremption la plus proche → logique FEFO).
 */
export async function getDispensableMedications() {
  const now = new Date();
  const meds = await db.medication.findMany({
    where: {
      is_active: true,
      stocks: {
        some: { quantity: { gt: 0 }, expiry_date: { gt: now } },
      },
    },
    orderBy: { name: "asc" },
    include: {
      stocks: {
        where: { quantity: { gt: 0 }, expiry_date: { gt: now } },
        orderBy: { expiry_date: "asc" },
        select: {
          id: true,
          batch_number: true,
          quantity: true,
          expiry_date: true,
          selling_price: true,
        },
      },
    },
  });

  return meds.map((m) => ({
    id: m.id,
    name: m.name,
    dci: m.dci,
    dosage: m.dosage,
    form: m.form,
    unit: m.unit,
    prescription_required: m.prescription_required,
    lots: m.stocks.map((s) => ({
      stock_id: s.id,
      batch_number: s.batch_number,
      quantity: s.quantity,
      expiry_date: s.expiry_date,
      selling_price: s.selling_price,
    })),
  }));
}

/** Recherche rapide de patients pour la dispensation (nom, téléphone). */
export async function searchPatientsForDispensation(search: string, limit = 10) {
  const q = search.trim();
  if (!q) return [];
  return db.patient.findMany({
    where: {
      OR: [
        { first_name: { contains: q, mode: "insensitive" } },
        { last_name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { first_name: "asc" },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      phone: true,
      gender: true,
      date_of_birth: true,
    },
  });
}

// ─── Bons de commande fournisseurs ───────────────────────────────────────────

export async function getPurchaseOrders({
  page = 1,
  limit = DEFAULT_LIMIT,
  search = "",
  status,
}: {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
} = {}) {
  const p = Math.max(1, Number(page));
  const take = Number(limit) || DEFAULT_LIMIT;
  const skip = (p - 1) * take;

  const where: Prisma.PurchaseOrderWhereInput = {
    ...(status ? { status: status as Prisma.EnumPurchaseOrderStatusFilter["equals"] } : {}),
    ...(search
      ? {
          OR: [
            { reference: { contains: search, mode: "insensitive" } },
            { supplier: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    db.purchaseOrder.findMany({
      where,
      orderBy: { order_date: "desc" },
      skip,
      take,
      include: {
        supplier: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    db.purchaseOrder.count({ where }),
  ]);

  return {
    data,
    total,
    page: p,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
}

export async function getPurchaseOrderById(id: number) {
  return db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: { medication: true },
        orderBy: { id: "asc" },
      },
    },
  });
}

/** KPI rapides pour l'en-tête de la liste des commandes. */
export async function getPurchaseOrderStats() {
  const [draft, ordered, partiallyReceived] = await Promise.all([
    db.purchaseOrder.count({ where: { status: "DRAFT" } }),
    db.purchaseOrder.count({ where: { status: "ORDERED" } }),
    db.purchaseOrder.count({ where: { status: "PARTIALLY_RECEIVED" } }),
  ]);
  return { draft, ordered, partiallyReceived, pending: ordered + partiallyReceived };
}

// ─── Activité du pharmacien connecté ─────────────────────────────────────────

export async function getPharmacistDailyStats(pharmacistId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [dispensationsToday, allToday, recentDispensations] = await Promise.all([
    db.dispensation.findMany({
      where: {
        dispensed_by: pharmacistId,
        dispensed_at: { gte: startOfDay, lte: endOfDay },
      },
      select: { id: true, total_amount: true, patient_id: true },
    }),
    db.dispensation.aggregate({
      where: { dispensed_at: { gte: startOfDay, lte: endOfDay } },
      _sum: { total_amount: true },
      _count: true,
    }),
    db.dispensation.findMany({
      where: { dispensed_by: pharmacistId },
      orderBy: { dispensed_at: "desc" },
      take: 5,
      include: {
        patient: {
          select: { id: true, first_name: true, last_name: true },
        },
        items: {
          include: { medication: true },
        },
      },
    }),
  ]);

  const uniquePatients = new Set(dispensationsToday.map((d) => d.patient_id));
  const revenueToday = dispensationsToday.reduce(
    (s, d) => s + d.total_amount,
    0
  );

  return {
    dispensationsToday: dispensationsToday.length,
    patientsToday: uniquePatients.size,
    revenueToday,
    globalDispensationsToday: allToday._count,
    globalRevenueToday: allToday._sum.total_amount ?? 0,
    recentDispensations,
  };
}

// ─── Dashboard KPI ───────────────────────────────────────────────────────────

export async function getPharmacyDashboardStats() {
  const now = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const soonDate = new Date();
  soonDate.setDate(soonDate.getDate() + EXPIRY_ALERT_DAYS);

  const [
    medicationsCount,
    activeMedications,
    suppliersCount,
    stocksAgg,
    lowStock,
    expiringSoon,
    expired,
    dispensationsMonth,
    dispensationsValue,
  ] = await Promise.all([
    db.medication.count(),
    db.medication.count({ where: { is_active: true } }),
    db.supplier.count({ where: { is_active: true } }),
    db.medicationStock.aggregate({
      _sum: { quantity: true },
      where: { expiry_date: { gt: now } },
    }),
    getLowStockMedications(),
    db.medicationStock.count({
      where: {
        quantity: { gt: 0 },
        expiry_date: { gte: now, lte: soonDate },
      },
    }),
    db.medicationStock.count({
      where: { quantity: { gt: 0 }, expiry_date: { lt: now } },
    }),
    db.dispensation.count({
      where: { dispensed_at: { gte: monthAgo } },
    }),
    db.dispensation.aggregate({
      _sum: { total_amount: true },
      where: { dispensed_at: { gte: monthAgo } },
    }),
  ]);

  return {
    medicationsCount,
    activeMedications,
    suppliersCount,
    totalUnitsInStock: stocksAgg._sum.quantity ?? 0,
    lowStockCount: lowStock.length,
    expiringSoonCount: expiringSoon,
    expiredCount: expired,
    dispensationsMonth,
    dispensationsRevenueMonth: dispensationsValue._sum.total_amount ?? 0,
  };
}
