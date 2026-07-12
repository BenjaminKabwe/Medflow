"use server";

import { am } from "@/lib/action-messages";

import { VitalSignsFormData } from "@/components/dialogs/add-vital-signs";
import db from "@/lib/db";
import { creerNotification } from "@/lib/notifications";
import { AppointmentSchema, VitalSignsSchema } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { AppointmentStatus } from "@prisma/client";
import { logAudit } from "@/lib/audit";

export async function createNewAppointment(data: any) {
  try {
    const validatedData = AppointmentSchema.safeParse(data);

    if (!validatedData.success) {
      return { success: false, msg: await am("invalidData") };
    }
    const validated = validatedData.data;
    const { userId } = await auth();

    const appointment = await db.appointment.create({
      data: {
        patient_id: data.patient_id,
        doctor_id: validated.doctor_id,
        time: validated.time,
        type: validated.type,
        appointment_date: new Date(validated.appointment_date),
        note: validated.note,
      },
    });

    const [patient, doctor] = await Promise.all([
      db.patient.findUnique({ where: { id: data.patient_id }, select: { first_name: true, last_name: true } }),
      db.doctor.findUnique({ where: { id: validated.doctor_id }, select: { name: true } }),
    ]);

    const dateStr = new Date(validated.appointment_date).toLocaleDateString("fr-FR");
    await creerNotification({
      user_id: validated.doctor_id,
      sender_id: userId ?? undefined,
      title: "Nouveau rendez-vous",
      message: `${patient?.first_name ?? ""} ${patient?.last_name ?? ""} a planifié un rendez-vous le ${dateStr} à ${validated.time}.`,
      type: "NOUVEAU_RENDEZ_VOUS",
      appointment_id: appointment.id,
    });

    if (userId) {
      logAudit({
        userId,
        action: "CREATE",
        model: "Appointment",
        recordId: String(appointment.id),
        details: `Rendez-vous créé pour ${patient?.first_name ?? ""} ${patient?.last_name ?? ""} le ${dateStr} à ${validated.time}`,
      });
    }

    return {
      success: true,
      msg: await am("appointmentCreated"),
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: await am("genericError") };
  }
}
export async function appointmentAction(
  id: string | number,
  status: AppointmentStatus,
  reason: string
) {
  try {
    const { userId } = await auth();

    const appointment = await db.appointment.update({
      where: { id: Number(id) },
      data: { status, reason },
    });

    const dateStr = appointment.appointment_date.toLocaleDateString("fr-FR");

    if (status === "SCHEDULED" || status === "CANCELLED") {
      const doctor = await db.doctor.findUnique({
        where: { id: appointment.doctor_id },
        select: { name: true },
      });

      if (status === "SCHEDULED") {
        await creerNotification({
          user_id: appointment.patient_id,
          sender_id: userId ?? undefined,
          title: "Rendez-vous confirmé",
          message: `Votre rendez-vous du ${dateStr} à ${appointment.time} a été confirmé par Dr ${doctor?.name ?? ""}.`,
          type: "RENDEZ_VOUS_CONFIRME",
          appointment_id: appointment.id,
        });
      } else {
        await creerNotification({
          user_id: appointment.patient_id,
          sender_id: userId ?? undefined,
          title: "Rendez-vous annulé",
          message: `Votre rendez-vous du ${dateStr} à ${appointment.time} a été annulé${reason ? ` — Motif : ${reason}` : ""}.`,
          type: "RENDEZ_VOUS_ANNULE",
          appointment_id: appointment.id,
        });
      }
    }

    const STATUS_LABELS: Record<string, string> = {
      PENDING:   "mis en attente",
      SCHEDULED: "approuvé",
      COMPLETED: "marqué comme terminé",
      CANCELLED: "annulé",
    };

    if (userId) {
      logAudit({
        userId,
        action: "UPDATE",
        model: "Appointment",
        recordId: String(id),
        details: `Statut du rendez-vous #${id} changé → ${STATUS_LABELS[status] ?? status}${reason ? ` (motif : ${reason})` : ""}`,
      });
    }

    return {
      success: true,
      error: false,
      msg: `Rendez-vous ${STATUS_LABELS[status] ?? status.toLowerCase()} avec succès`,
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: await am("genericError") };
  }
}

export async function addVitalSigns(
  data: VitalSignsFormData,
  appointmentId: string,
  doctorId: string
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, msg: await am("unauthorized") };
    }

    const validatedData = VitalSignsSchema.parse(data);

    let medicalRecord = null;

    if (!validatedData.medical_id) {
      medicalRecord = await db.medicalRecords.create({
        data: {
          patient_id: validatedData.patient_id,
          appointment_id: Number(appointmentId),
          doctor_id: doctorId,
        },
      });
    }

    const med_id = validatedData.medical_id || medicalRecord?.id;

    await db.vitalSigns.create({
      data: {
        ...validatedData,
        medical_id: Number(med_id!),
      },
    });

    return {
      success: true,
      msg: await am("vitalsAdded"),
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Erreur interne du serveur" };
  }
}
