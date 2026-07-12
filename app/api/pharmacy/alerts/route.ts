import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole, ForbiddenError, UnauthorizedError } from "@/lib/permissions";
import {
  getLowStockMedications,
  getExpiringStocks,
  getExpiredStocks,
  EXPIRY_ALERT_DAYS,
  EXPIRY_CRITICAL_DAYS,
} from "@/utils/services/pharmacy";

export async function GET() {
  try {
    await requireRole([Role.ADMIN, Role.PHARMACIST]);

    const [lowStock, expiringSoon, expired] = await Promise.all([
      getLowStockMedications(),
      getExpiringStocks(EXPIRY_ALERT_DAYS),
      getExpiredStocks(),
    ]);

    const critical = expiringSoon.filter((s) => {
      const days = Math.floor(
        (s.expiry_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return days <= EXPIRY_CRITICAL_DAYS;
    });

    return NextResponse.json({
      summary: {
        lowStockCount: lowStock.length,
        expiringSoonCount: expiringSoon.length,
        criticalExpiryCount: critical.length,
        expiredCount: expired.length,
      },
      lowStock: lowStock.map((m) => ({
        id: m.id,
        name: m.name,
        dci: m.dci,
        dosage: m.dosage,
        totalStock: m.totalStock,
        reorderLevel: m.reorder_level,
      })),
      expiringSoon: expiringSoon.map((s) => ({
        id: s.id,
        medicationId: s.medication_id,
        medicationName: s.medication.name,
        batchNumber: s.batch_number,
        quantity: s.quantity,
        expiryDate: s.expiry_date,
        daysLeft: Math.floor(
          (s.expiry_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      })),
      expired: expired.map((s) => ({
        id: s.id,
        medicationName: s.medication.name,
        batchNumber: s.batch_number,
        quantity: s.quantity,
        expiryDate: s.expiry_date,
      })),
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[/api/pharmacy/alerts]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
