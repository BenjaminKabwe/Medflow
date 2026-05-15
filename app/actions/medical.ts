"use server";

import { DiagnosisFormData } from "@/components/dialogs/add-diagnosis";
import db from "@/lib/db";
import {
  DiagnosisSchema,
  PatientBillSchema,
  PaymentSchema,
} from "@/lib/schema";
import { checkRole } from "@/utils/roles";
import { currentUser, auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  getOrCreateActiveSession,
  attachPaymentToSession,
} from "@/utils/services/cashier-sessions";
import { logAudit } from "@/lib/audit";

export const addDiagnosis = async (
  data: DiagnosisFormData,
  appointmentId: string
) => {
  try {
    const validatedData = DiagnosisSchema.parse(data);

    let medicalRecord = null;

    if (!validatedData.medical_id) {
      medicalRecord = await db.medicalRecords.create({
        data: {
          patient_id: validatedData.patient_id,
          doctor_id: validatedData.doctor_id,
          appointment_id: Number(appointmentId),
        },
      });
    }

    const med_id = validatedData.medical_id || medicalRecord?.id;
    const diagnosis = await db.diagnosis.create({
      data: {
        ...validatedData,
        medical_id: Number(med_id),
      },
    });

    const { userId } = await auth();
    if (userId) {
      logAudit({
        userId,
        action: "CREATE",
        model: "Diagnosis",
        recordId: String(diagnosis.id),
        details: `Diagnostic ajouté pour le patient ${validatedData.patient_id} (RDV #${appointmentId})`,
      });
    }

    return {
      success: true,
      message: "Diagnostic ajouté avec succès",
      status: 201,
    };
  } catch (error) {
    console.log(error);
    return {
      error: "Échec de l'ajout du diagnostic",
    };
  }
};

export async function addNewBill(data: any) {
  try {
    const isAdmin = await checkRole("ADMIN");
    const isDoctor = await checkRole("DOCTOR");

    if (!isAdmin && !isDoctor) {
      return {
        success: false,
        msg: "Vous n'êtes pas autorisé à ajouter une facture",
      };
    }

    const isValidData = PatientBillSchema.safeParse(data);

    const validatedData = isValidData.data;
    let bill_info = null;

    if (!data?.bill_id || data?.bill_id === "undefined") {
      const info = await db.appointment.findUnique({
        where: { id: Number(data?.appointment_id) },
        select: {
          id: true,
          patient_id: true,
          bills: true,
        },
      });

      if (!info?.bills) {
        bill_info = await db.payment.create({
          data: {
            appointment_id: Number(data?.appointment_id),
            patient_id: info?.patient_id!,
            bill_date: new Date(),
            payment_date: new Date(),
            discount: 0.0,
            amount_paid: 0.0,
            total_amount: 0.0,
            receipt_number: `RCP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          },
        });
      } else {
        bill_info = info.bills;
      }
    } else {
      bill_info = {
        id: data?.bill_id,
      };
    }

    await db.patientBills.create({
      data: {
        bill_id: Number(bill_info?.id),
        service_id: Number(validatedData?.service_id),
        service_date: new Date(validatedData?.service_date!),
        quantity: Number(validatedData?.quantity),
        unit_cost: Number(validatedData?.unit_cost),
        total_cost: Number(validatedData?.total_cost),
      },
    });

    return {
      success: true,
      error: false,
      msg: `Facture ajoutée avec succès`,
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Erreur interne du serveur" };
  }
}

export async function generateBill(data: any) {
  try {
    const isValidData = PaymentSchema.safeParse(data);

    if (!isValidData.success) {
      return {
        success: false,
        error: true,
        msg: isValidData.error.errors[0]?.message ?? "Données invalides",
      };
    }

    const validatedData = isValidData.data;

    const totalAmount = Number(validatedData.total_amount);
    const discountAmount = (Number(validatedData.discount) / 100) * totalAmount;
    const amountPaid = totalAmount - discountAmount;

    const clerkUser = await currentUser();
    const userId = clerkUser?.id ?? "system";
    const userName =
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
      clerkUser?.username ||
      "Système";

    // PrismaNeonHTTP (adaptateur HTTP Neon) ne supporte pas les transactions
    // interactives — on exécute les opérations séquentiellement.
    const payment = await db.payment.update({
      data: {
        bill_date:    validatedData.bill_date,
        payment_date: new Date(),
        discount:     discountAmount,
        total_amount: totalAmount,
        amount_paid:  amountPaid,
        status:       "PAID",
      },
      where: { id: Number(validatedData.id) },
    });

    const session = await getOrCreateActiveSession(userId, userName);
    await attachPaymentToSession(payment.id, session.id, amountPaid, payment.payment_method);

    await db.appointment.update({
      data: { status: "COMPLETED" },
      where: { id: payment.appointment_id },
    });

    logAudit({
      userId,
      action: "UPDATE",
      model: "Payment",
      recordId: String(payment.id),
      details: `Facture #${payment.id} générée — montant payé : ${amountPaid.toFixed(2)} (remise ${validatedData.discount}%)`,
    });

    revalidatePath("/admin/cashier-sessions");
    revalidatePath("/administration/sessions-de-caisse");
    return { success: true, error: false, msg: "Facture générée avec succès" };
  } catch (error) {
    console.log(error);
    return { success: false, error: true, msg: "Erreur interne du serveur" };
  }
}
