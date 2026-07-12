import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole, ForbiddenError, UnauthorizedError } from "@/lib/permissions";
import { notifierAlertesStock } from "@/lib/pharmacy-alerts";

/**
 * Déclenche l'envoi des notifications d'alerte stock aux pharmaciens et admins.
 *
 * Sécurité : Admin/Pharmacien pour un déclenchement manuel, OU header
 * `x-cron-secret` valant CRON_SECRET pour un déclenchement automatisé
 * (Vercel Cron, GitHub Actions, etc.).
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret");
  const isCron = !!cronSecret && providedSecret === cronSecret;

  try {
    if (!isCron) {
      await requireRole([Role.ADMIN, Role.PHARMACIST]);
    }

    const result = await notifierAlertesStock();
    return NextResponse.json({
      success: true,
      ...result,
      triggered_by: isCron ? "cron" : "user",
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[/api/pharmacy/alerts/notify]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
