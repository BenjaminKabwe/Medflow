import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getAllSessions, ouvrirSession } from "@/lib/sessions-caisse";

// GET /api/sessions-caisse — liste toutes les sessions
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut") as "OPEN" | "CLOSED" | null;
  const from   = searchParams.get("from");
  const to     = searchParams.get("to");

  const sessions = await getAllSessions({
    statut: statut ?? undefined,
    from:   from ? new Date(from) : undefined,
    to:     to   ? new Date(to)   : undefined,
  });

  const data = sessions.map((s) => ({
    id:           s.id,
    ouvertureAt:  s.opened_at,
    clotureAt:    s.closed_at,
    statut:       s.status,
    caissier:     s.cashier_name,
    totalEncaisse: s.payments.reduce((sum, p) => sum + p.amount_paid, 0),
    nbPaiements:  s._count.payments,
  }));

  return NextResponse.json(data);
}

// POST /api/sessions-caisse — ouvre manuellement une nouvelle session
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await currentUser();
  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "Administrateur";

  try {
    const session = await ouvrirSession(userId, userName);
    revalidatePath("/administration/sessions-de-caisse");
    revalidatePath("/admin/cashier-sessions");
    return NextResponse.json({ id: session.id }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erreur interne";
    const status  = message.includes("déjà active") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
