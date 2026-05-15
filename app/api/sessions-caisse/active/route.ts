import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSessionActive } from "@/lib/sessions-caisse";

// GET /api/sessions-caisse/active — retourne la session active ou null
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const session = await getSessionActive();
  if (!session) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    id:           session.id,
    ouvertureAt:  session.opened_at,
    caissier:     session.cashier_name,
    nbPaiements:  session._count.payments,
  });
}
