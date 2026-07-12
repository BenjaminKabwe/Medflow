import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import db from "@/lib/db";
import { creerNotification } from "@/lib/notifications";
import {
  getLowStockMedications,
  getExpiringStocks,
  EXPIRY_CRITICAL_DAYS,
} from "@/utils/services/pharmacy";

/**
 * Récupère les user_id Clerk des rôles cibles (admin + pharmacien) via Staff.
 * On s'appuie sur la table Staff plutôt qu'un appel Clerk global.
 */
async function getRecipients(): Promise<Array<{ id: string }>> {
  const staff = await db.staff.findMany({
    where: {
      role: { in: [Role.ADMIN, Role.PHARMACIST] },
      status: "ACTIVE",
    },
    select: { id: true },
  });

  // Optionnel : compléter via Clerk (couvre les admins Clerk-only)
  try {
    const client = await clerkClient();
    const list = await client.users.getUserList({ limit: 100 });
    const clerkAdmins = list.data
      .filter((u) => {
        const role = (u.publicMetadata as { role?: string })?.role;
        return role === "admin" || role === "pharmacist";
      })
      .map((u) => ({ id: u.id }));

    const seen = new Set(staff.map((s) => s.id));
    for (const c of clerkAdmins) {
      if (!seen.has(c.id)) {
        staff.push(c);
        seen.add(c.id);
      }
    }
  } catch (err) {
    console.error("[pharmacy-alerts] getRecipients Clerk fallback failed:", err);
  }

  return staff;
}

/**
 * Notifie les pharmaciens et admins des alertes stock critiques.
 * À déclencher :
 *  - au démarrage d'une session de travail
 *  - via un cron quotidien (à ajouter dans vercel.ts)
 *  - après un mouvement de stock (dispensation, ajustement)
 */
export async function notifierAlertesStock(): Promise<{
  notified: number;
  alerts: { lowStock: number; criticalExpiry: number };
}> {
  const [lowStock, expiringSoon] = await Promise.all([
    getLowStockMedications(),
    getExpiringStocks(EXPIRY_CRITICAL_DAYS),
  ]);

  if (lowStock.length === 0 && expiringSoon.length === 0) {
    return { notified: 0, alerts: { lowStock: 0, criticalExpiry: 0 } };
  }

  const recipients = await getRecipients();
  if (recipients.length === 0) {
    return {
      notified: 0,
      alerts: { lowStock: lowStock.length, criticalExpiry: expiringSoon.length },
    };
  }

  let notified = 0;

  for (const r of recipients) {
    if (lowStock.length > 0) {
      const preview = lowStock
        .slice(0, 3)
        .map((m) => `${m.name} (${m.totalStock})`)
        .join(", ");
      await creerNotification({
        user_id: r.id,
        title: `Stock bas : ${lowStock.length} médicament${lowStock.length > 1 ? "s" : ""}`,
        message:
          `${preview}${lowStock.length > 3 ? `, +${lowStock.length - 3} autres` : ""}. ` +
          `Réappro requis.`,
        type: "STOCK_BAS",
      });
      notified++;
    }

    if (expiringSoon.length > 0) {
      const preview = expiringSoon
        .slice(0, 3)
        .map((s) => `${s.medication.name} (lot ${s.batch_number})`)
        .join(", ");
      await creerNotification({
        user_id: r.id,
        title: `Péremption ≤ ${EXPIRY_CRITICAL_DAYS}j : ${expiringSoon.length} lot${expiringSoon.length > 1 ? "s" : ""}`,
        message:
          `${preview}${expiringSoon.length > 3 ? `, +${expiringSoon.length - 3} autres` : ""}. ` +
          `À écouler ou retirer rapidement.`,
        type: "MEDICAMENT_EXPIRE",
      });
      notified++;
    }
  }

  return {
    notified,
    alerts: {
      lowStock: lowStock.length,
      criticalExpiry: expiringSoon.length,
    },
  };
}
