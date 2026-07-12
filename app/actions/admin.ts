"use server";

import { am } from "@/lib/action-messages";

import db from "@/lib/db";
import {
  DoctorSchema,
  ServicesSchema,
  StaffSchema,
  WorkingDaysSchema,
} from "@/lib/schema";
import { generateRandomColor } from "@/utils";
import { checkRole } from "@/utils/roles";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { logAudit } from "@/lib/audit";

function parseClerkError(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "clerkError" in error &&
    (error as any).errors?.length
  ) {
    const first = (error as any).errors[0];
    const code: string = first?.code ?? "";

    const MESSAGES: Record<string, string> = {
      form_identifier_exists: "Cette adresse e-mail est déjà utilisée. Veuillez en choisir une autre.",
      form_password_pwned: "Ce mot de passe a été compromis dans une fuite de données. Veuillez en choisir un autre plus sécurisé.",
      form_password_too_short: "Le mot de passe est trop court. Il doit contenir au moins 8 caractères.",
      form_password_no_uppercase: "Le mot de passe doit contenir au moins une majuscule.",
      form_password_no_lowercase: "Le mot de passe doit contenir au moins une minuscule.",
      form_password_no_number: "Le mot de passe doit contenir au moins un chiffre.",
      form_data_missing: "Informations manquantes. Veuillez remplir tous les champs obligatoires.",
      form_param_format_invalid: "Format invalide pour l'un des champs.",
    };

    if (MESSAGES[code]) return MESSAGES[code];
    if (code.includes("password")) return "Mot de passe invalide. Veuillez en choisir un plus sécurisé.";
    if (code.includes("email")) return "Adresse e-mail invalide ou déjà utilisée.";
    return "Une erreur est survenue. Veuillez réessayer.";
  }
  return "Une erreur est survenue. Veuillez réessayer.";
}

function splitName(fullName: string): { firstName: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
  };
}

function generateUsername(email: string): string {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

export async function createNewStaff(data: any) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, msg: await am("unauthorized") };
    }

    const isAdmin = await checkRole("ADMIN");

    if (!isAdmin) {
      return { success: false, msg: await am("unauthorized") };
    }

    const values = StaffSchema.safeParse(data);

    if (!values.success) {
      return {
        success: false,
        errors: true,
        message: "Veuillez fournir toutes les informations requises",
      };
    }

    const validatedValues = values.data;

    const client = await clerkClient();
    const { firstName, lastName } = splitName(validatedValues.name);

    const user = await client.users.createUser({
      emailAddress: [validatedValues.email],
      username: generateUsername(validatedValues.email),
      ...(validatedValues.password ? { password: validatedValues.password } : {}),
      firstName,
      ...(lastName ? { lastName } : {}),
      publicMetadata: { role: validatedValues.role.toLowerCase() },
    });

    const deptId = validatedValues.department
      ? Number(validatedValues.department)
      : undefined;

    await db.staff.create({
      data: {
        name: validatedValues.name,
        phone: validatedValues.phone,
        email: validatedValues.email,
        address: validatedValues.address,
        role: validatedValues.role,
        license_number: validatedValues.license_number,
        ...(deptId && !isNaN(deptId)
          ? { department: { connect: { id: deptId } } }
          : {}),
        colorCode: generateRandomColor(),
        id: user.id,
        status: "ACTIVE",
      },
    });

    logAudit({
      userId,
      action: "CREATE",
      model: "Staff",
      recordId: user.id,
      details: `Nouveau membre du personnel : ${validatedValues.name} (${validatedValues.role})`,
    });

    return {
      success: true,
      message: await am("staffAdded"),
      error: false,
    };
  } catch (error) {
    console.error(error);
    return { error: true, success: false, message: parseClerkError(error) };
  }
}
export async function createNewDoctor(data: any) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, msg: await am("unauthorized") };
    }

    const isAdmin = await checkRole("ADMIN");

    if (!isAdmin) {
      return { success: false, msg: await am("unauthorized") };
    }

    const values = DoctorSchema.safeParse(data);

    const workingDaysValues = WorkingDaysSchema.safeParse(data?.work_schedule);

    if (!values.success || !workingDaysValues.success) {
      return {
        success: false,
        errors: true,
        message: "Veuillez fournir toutes les informations requises",
      };
    }

    const validatedValues = values.data;
    const workingDayData = workingDaysValues.data!;

    const client = await clerkClient();
    const { firstName, lastName } = splitName(validatedValues.name);

    const user = await client.users.createUser({
      emailAddress: [validatedValues.email],
      username: generateUsername(validatedValues.email),
      ...(validatedValues.password ? { password: validatedValues.password } : {}),
      firstName,
      ...(lastName ? { lastName } : {}),
      publicMetadata: { role: "doctor" },
    });

    const { department, password: _pw, ...doctorCoreValues } = validatedValues;

    const deptId = department ? Number(department) : undefined;

    const doctor = await db.doctor.create({
      data: {
        ...doctorCoreValues,
        id: user.id,
        colorCode: generateRandomColor(),
        ...(deptId && !isNaN(deptId)
          ? { department: { connect: { id: deptId } } }
          : {}),
      },
    });

    await Promise.all(
      workingDayData?.map((el) =>
        db.workingDays.create({
          data: {
            ...el,
            day: el.day.toUpperCase() as import("@prisma/client").WeekDay,
            doctor_id: doctor.id,
          },
        })
      )
    );

    logAudit({
      userId,
      action: "CREATE",
      model: "Doctor",
      recordId: doctor.id,
      details: `Nouveau médecin : ${validatedValues.name} — ${validatedValues.specialization}`,
    });

    return {
      success: true,
      message: await am("doctorAdded"),
      error: false,
    };
  } catch (error) {
    if (error && typeof error === "object" && "clerkError" in error) {
      console.error("Clerk errors:", JSON.stringify((error as any).errors, null, 2));
    } else {
      console.error(error);
    }
    return { error: true, success: false, message: parseClerkError(error) };
  }
}

export async function addNewService(data: any) {
  try {
    const isValidData = ServicesSchema.safeParse(data);

    if (!isValidData.success) {
      return { success: false, error: true, msg: await am("invalidFields") };
    }

    const validatedData = isValidData.data;

    await db.services.create({
      data: validatedData,
    });

    return {
      success: true,
      error: false,
      msg: `Service ajouté avec succès`,
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Erreur interne du serveur" };
  }
}
