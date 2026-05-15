import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { cloturerSession } from "@/lib/sessions-caisse";

// PATCH /api/sessions-caisse/[id]/cloturer — clôture une session active
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const sessionId = Number(id);
  if (isNaN(sessionId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  try {
    await cloturerSession(sessionId);
    revalidatePath("/administration/sessions-de-caisse");
    revalidatePath("/admin/cashier-sessions");
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erreur interne";
    const status  = message.includes("introuvable") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
