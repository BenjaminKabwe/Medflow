"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import db from "@/lib/db";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { Prisma, PaymentMethod, Role } from "@prisma/client";

// ─── Types de retour ──────────────────────────────────────────────────────────

export type ActionResult = {
  success: boolean;
  message: string;
  error?: boolean;
};

// ─── Schémas Zod ──────────────────────────────────────────────────────────────

const MethodSchema = z.nativeEnum(PaymentMethod);

const UpdateConfigSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  label: z.string().min(1, "Le libellé est requis").max(50),
  description: z.string().max(300).optional(),
  fees: z.coerce.number().min(0, "Les frais ne peuvent pas être négatifs").max(100),
  isActive: z.boolean(),
  // Spécifique MOBILE_MONEY — codes opérateurs actifs
  activeOperators: z.array(z.string()).optional(),
  // Spécifique INSURANCE — codes organismes actifs
  activeProviders: z.array(z.string()).optional(),
});

export type UpdateConfigValues = z.infer<typeof UpdateConfigSchema>;

// ─── Helpers internes ─────────────────────────────────────────────────────────

function handlePermissionError(e: unknown): ActionResult {
  if (e instanceof UnauthorizedError || e instanceof ForbiddenError) {
    return { success: false, error: true, message: e.message };
  }
  console.error("[payment-methods action]", e);
  return { success: false, error: true, message: "Erreur interne du serveur" };
}

// ─── Actions publiques ────────────────────────────────────────────────────────

/**
 * Bascule l'état actif/inactif d'un mode de paiement.
 * Utilisé par le toggle avec useOptimistic dans l'UI.
 */
export async function togglePaymentMethod(
  method: PaymentMethod,
  isActive: boolean
): Promise<ActionResult> {
  try {
    await requireRole([Role.ADMIN]);

    const parsed = MethodSchema.safeParse(method);
    if (!parsed.success) {
      return { success: false, error: true, message: "Mode de paiement invalide" };
    }

    await db.paymentMethodConfig.update({
      where: { method: parsed.data },
      data: { isActive },
    });

    revalidatePath("/admin/system-settings");
    return {
      success: true,
      message: isActive ? "Mode de paiement activé" : "Mode de paiement désactivé",
    };
  } catch (e) {
    return handlePermissionError(e);
  }
}

/**
 * Met à jour la configuration complète d'un mode de paiement depuis le Dialog.
 * Gère les métadonnées spécifiques à chaque méthode (opérateurs, organismes…).
 */
export async function updatePaymentMethodConfig(
  values: UpdateConfigValues
): Promise<ActionResult> {
  try {
    await requireRole([Role.ADMIN]);

    const parsed = UpdateConfigSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        error: true,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
      };
    }

    const { method, label, description, fees, isActive, activeOperators, activeProviders } =
      parsed.data;

    // Lecture de la config actuelle pour fusionner les métadonnées
    const current = await db.paymentMethodConfig.findUniqueOrThrow({
      where: { method },
      select: { metadata: true },
    });

    const currentMeta = (current.metadata as Record<string, unknown> | null) ?? {};
    let updatedMeta: Record<string, unknown> = { ...currentMeta };

    if (method === PaymentMethod.MOBILE_MONEY && activeOperators !== undefined) {
      type Operator = { code: string; active: boolean; [key: string]: unknown };
      const existing = (currentMeta.operators as Operator[] | undefined) ?? [];
      updatedMeta = {
        ...updatedMeta,
        operators: existing.map((op) => ({
          ...op,
          active: activeOperators.includes(op.code),
        })),
      };
    }

    if (method === PaymentMethod.INSURANCE && activeProviders !== undefined) {
      type Provider = { code: string; active: boolean; [key: string]: unknown };
      const existing = (currentMeta.providers as Provider[] | undefined) ?? [];
      updatedMeta = {
        ...updatedMeta,
        providers: existing.map((p) => ({
          ...p,
          active: activeProviders.includes(p.code),
        })),
      };
    }

    await db.paymentMethodConfig.update({
      where: { method },
      data: { label, description, fees, isActive, metadata: updatedMeta as Prisma.InputJsonValue },
    });

    revalidatePath("/admin/system-settings");
    return { success: true, message: "Configuration mise à jour avec succès" };
  } catch (e) {
    return handlePermissionError(e);
  }
}

/**
 * Récupère tous les modes de paiement — utilisé dans les Server Components.
 */
export async function getPaymentMethodConfigs() {
  return db.paymentMethodConfig.findMany({
    orderBy: { method: "asc" },
  });
}

/**
 * Récupère uniquement les modes actifs — utilisé à l'encaissement.
 */
export async function getActivePaymentMethods() {
  return db.paymentMethodConfig.findMany({
    where: { isActive: true },
    orderBy: { method: "asc" },
  });
}
