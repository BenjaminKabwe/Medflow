import db from "@/lib/db";

export type TimelineEventType =
  | "appointment"
  | "vitals"
  | "diagnosis"
  | "lab"
  | "prescription"
  | "dispensation"
  | "payment";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  date: Date;
  title: string;
  description?: string;
  status?: string;
  amount?: number;
  by?: string;
};

/**
 * Agrège tous les évènements médicaux et administratifs d'un patient en une
 * frise chronologique unifiée (du plus récent au plus ancien).
 */
export async function getPatientTimeline(
  patientId: string
): Promise<TimelineEvent[]> {
  const [
    appointments,
    vitals,
    diagnoses,
    labTests,
    prescriptions,
    dispensations,
    payments,
  ] = await Promise.all([
    db.appointment.findMany({
      where: { patient_id: patientId },
      select: {
        id: true,
        appointment_date: true,
        type: true,
        status: true,
        reason: true,
      },
    }),
    db.vitalSigns.findMany({
      where: { patient_id: patientId },
      select: {
        id: true,
        created_at: true,
        body_temperature: true,
        systolic: true,
        diastolic: true,
        heartRate: true,
        weight: true,
      },
    }),
    db.diagnosis.findMany({
      where: { patient_id: patientId },
      select: {
        id: true,
        created_at: true,
        diagnosis: true,
        doctor: { select: { name: true } },
      },
    }),
    db.labTest.findMany({
      where: { medical_record: { patient_id: patientId } },
      select: {
        id: true,
        created_at: true,
        completed_at: true,
        status: true,
        result: true,
        requested_by_name: true,
        services: { select: { service_name: true } },
      },
    }),
    db.prescription.findMany({
      where: { patient_id: patientId },
      select: {
        id: true,
        reference: true,
        created_at: true,
        status: true,
        doctor_name: true,
        _count: { select: { items: true } },
      },
    }),
    db.dispensation.findMany({
      where: { patient_id: patientId },
      select: {
        id: true,
        reference: true,
        dispensed_at: true,
        total_amount: true,
        status: true,
        dispensed_by_name: true,
      },
    }),
    db.payment.findMany({
      where: { patient_id: patientId },
      select: {
        id: true,
        payment_date: true,
        bill_date: true,
        total_amount: true,
        amount_paid: true,
        status: true,
        receipt_number: true,
      },
    }),
  ]);

  const events: TimelineEvent[] = [];

  for (const a of appointments) {
    events.push({
      id: `appointment-${a.id}`,
      type: "appointment",
      date: a.appointment_date,
      title: `Rendez-vous · ${a.type}`,
      description: a.reason ?? undefined,
      status: a.status,
    });
  }

  for (const v of vitals) {
    events.push({
      id: `vitals-${v.id}`,
      type: "vitals",
      date: v.created_at,
      title: "Constantes vitales",
      description: `T° ${v.body_temperature}°C · TA ${v.systolic}/${v.diastolic} · FC ${v.heartRate} · ${v.weight} kg`,
    });
  }

  for (const d of diagnoses) {
    events.push({
      id: `diagnosis-${d.id}`,
      type: "diagnosis",
      date: d.created_at,
      title: "Diagnostic",
      description: d.diagnosis,
      by: d.doctor?.name ?? undefined,
    });
  }

  for (const t of labTests) {
    const done = t.status === "COMPLETED";
    events.push({
      id: `lab-${t.id}`,
      type: "lab",
      date: done && t.completed_at ? t.completed_at : t.created_at,
      title: `Analyse · ${t.services.service_name}`,
      description: done && t.result ? t.result : undefined,
      status: t.status,
      by: t.requested_by_name ?? undefined,
    });
  }

  for (const p of prescriptions) {
    events.push({
      id: `prescription-${p.id}`,
      type: "prescription",
      date: p.created_at,
      title: `Ordonnance · ${p.reference}`,
      description: `${p._count.items} médicament(s)`,
      status: p.status,
      by: p.doctor_name ?? undefined,
    });
  }

  for (const dsp of dispensations) {
    events.push({
      id: `dispensation-${dsp.id}`,
      type: "dispensation",
      date: dsp.dispensed_at,
      title: `Dispensation · ${dsp.reference}`,
      description: `${dsp.dispensed_by_name}`,
      status: dsp.status,
      amount: dsp.total_amount,
    });
  }

  for (const pay of payments) {
    events.push({
      id: `payment-${pay.id}`,
      type: "payment",
      date: pay.payment_date ?? pay.bill_date,
      title: `Facture · ${pay.receipt_number}`,
      description: `Payé ${pay.amount_paid} / ${pay.total_amount} FC`,
      status: pay.status,
      amount: pay.total_amount,
    });
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime());
  return events;
}
