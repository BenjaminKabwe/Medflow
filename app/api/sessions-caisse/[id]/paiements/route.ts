import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSessionById } from "@/lib/sessions-caisse";

// GET /api/sessions-caisse/[id]/paiements — liste les paiements d'une session
export async function GET(
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

  const session = await getSessionById(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  const paiements = session.payments.map((p) => ({
    id:            p.id,
    patient:       `${p.patient.first_name} ${p.patient.last_name}`,
    patientId:     p.patient.id,
    montant:       p.amount_paid,
    modePaiement:  p.payment_method,
    date:          p.payment_date,
    rendezVousId:  p.appointment.id,
    rendezVousDate: p.appointment.appointment_date,
    type:          p.appointment.type,
  }));

  return NextResponse.json(paiements);
}
