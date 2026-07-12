"use server";

import { am } from "@/lib/action-messages";

import db from "@/lib/db";
import { PatientFormSchema } from "@/lib/schema";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { logAudit } from "@/lib/audit";

export async function updatePatient(data: any, pid: string) {
  try {
    const validateData = PatientFormSchema.safeParse(data);

    if (!validateData.success) {
      return {
        success: false,
        error: true,
        msg: "Veuillez fournir tous les champs obligatoires",
      };
    }

    const patientData = validateData.data;

    const client = await clerkClient();
    await client.users.updateUser(pid, {
      firstName: patientData.first_name,
      lastName: patientData.last_name,
    });

    await db.patient.update({
      data: {
        ...patientData,
      },
      where: { id: pid },
    });

    const { userId } = await auth();
    if (userId) {
      logAudit({
        userId,
        action: "UPDATE",
        model: "Patient",
        recordId: pid,
        details: `Mise à jour du profil patient : ${patientData.first_name} ${patientData.last_name}`,
      });
    }

    return {
      success: true,
      error: false,
      msg: await am("patientUpdated"),
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: true, msg: error?.message };
  }
}
export async function createNewPatient(data: any, pid: string) {
  try {
    const validateData = PatientFormSchema.safeParse(data);

if (!validateData.success) {
  console.error("Validation errors:", JSON.stringify(validateData.error.errors, null, 2));
  return {
    success: false,
    error: true,
    msg: "Fournissez tous les champs obligatoires",
  };
}

    const patientData = validateData.data;
    let patient_id = pid;

    const client = await clerkClient();
    if (pid === "new-patient") {
      const user = await client.users.createUser({
        emailAddress: [patientData.email],
        password: patientData.phone,
        firstName: patientData.first_name,
        lastName: patientData.last_name,
        publicMetadata: { role: "patient" },
      });

      patient_id = user?.id;
    } else {
      await client.users.updateUser(pid, {
        publicMetadata: { role: "patient" },
      });
    }

    await db.patient.create({
      data: {
        ...patientData,
        id: patient_id,
      },
    });

    const { userId } = await auth();
    if (userId) {
      logAudit({
        userId,
        action: "CREATE",
        model: "Patient",
        recordId: patient_id,
        details: `Nouveau patient : ${patientData.first_name} ${patientData.last_name} (${patientData.email})`,
      });
    }

    return { success: true, error: false, msg: await am("patientCreated") };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: true, msg: error?.message };
  }
}
