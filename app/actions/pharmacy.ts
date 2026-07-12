"use server";

import { am } from "@/lib/action-messages";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { Prisma, PurchaseOrderStatus, Role } from "@prisma/client";
import db from "@/lib/db";
import {
  DispensationSchema,
  MedicationSchema,
  PurchaseOrderSchema,
  ReceiveOrderSchema,
  StockAdjustmentSchema,
  StockEntrySchema,
  SupplierSchema,
} from "@/lib/schema";
import {
  ForbiddenError,
  requireRole,
  UnauthorizedError,
} from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

// ─── Types de retour ─────────────────────────────────────────────────────────

export type ActionResult<T = never> = {
  success: boolean;
  message: string;
  error?: boolean;
  data?: T;
};

const PHARMACY_ROLES = [Role.ADMIN, Role.PHARMACIST] as const;
const DISPENSATION_ROLES = [
  Role.ADMIN,
  Role.PHARMACIST,
  Role.NURSE,
] as const;

function handleError(err: unknown, fallback = "Une erreur est survenue"): ActionResult {
  if (err instanceof UnauthorizedError) {
    return { success: false, message: err.message, error: true };
  }
  if (err instanceof ForbiddenError) {
    return { success: false, message: err.message, error: true };
  }
  console.error("[pharmacy action]", err);
  return { success: false, message: fallback, error: true };
}

async function actorInfo() {
  const user = await currentUser();
  if (!user) throw new UnauthorizedError();
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.emailAddresses[0]?.emailAddress ||
    user.id;
  return { userId: user.id, name };
}

// ─── Médicaments (catalogue) ─────────────────────────────────────────────────

export async function createMedication(
  data: unknown
): Promise<ActionResult<{ id: number }>> {
  try {
    const { userId } = await requireRole([...PHARMACY_ROLES]);
    const parsed = MedicationSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;
    const med = await db.medication.create({
      data: {
        name: v.name,
        dci: v.dci,
        form: v.form,
        dosage: v.dosage,
        unit: v.unit,
        category: v.category ?? undefined,
        description: v.description ?? undefined,
        barcode: v.barcode || undefined,
        prescription_required: v.prescription_required,
        reorder_level: v.reorder_level,
        is_active: v.is_active,
      },
    });

    await logAudit({
      userId,
      action: "CREATE",
      model: "Medication",
      recordId: String(med.id),
      newValues: v,
    });

    revalidatePath("/pharmacy/medications");
    return {
      success: true,
      message: await am("medAdded"),
      data: { id: med.id },
    };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        success: false,
        message: await am("medExists"),
        error: true,
      };
    }
    return handleError(err, "Impossible d'ajouter le médicament");
  }
}

export async function updateMedication(
  id: number,
  data: unknown
): Promise<ActionResult> {
  try {
    const { userId } = await requireRole([...PHARMACY_ROLES]);
    const parsed = MedicationSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;
    const before = await db.medication.findUnique({ where: { id } });
    if (!before) {
      return { success: false, message: await am("medNotFound"), error: true };
    }

    await db.medication.update({
      where: { id },
      data: {
        name: v.name,
        dci: v.dci,
        form: v.form,
        dosage: v.dosage,
        unit: v.unit,
        category: v.category ?? null,
        description: v.description ?? null,
        barcode: v.barcode || null,
        prescription_required: v.prescription_required,
        reorder_level: v.reorder_level,
        is_active: v.is_active,
      },
    });

    await logAudit({
      userId,
      action: "UPDATE",
      model: "Medication",
      recordId: String(id),
      oldValues: before as unknown as Record<string, unknown>,
      newValues: v,
    });

    revalidatePath("/pharmacy/medications");
    revalidatePath(`/pharmacy/medications/${id}`);
    return { success: true, message: await am("medUpdated") };
  } catch (err) {
    return handleError(err);
  }
}

export async function deleteMedication(id: number): Promise<ActionResult> {
  try {
    const { userId } = await requireRole([Role.ADMIN]);
    const stockCount = await db.medicationStock.count({
      where: { medication_id: id, quantity: { gt: 0 } },
    });
    if (stockCount > 0) {
      return {
        success: false,
        message: "Impossible de supprimer : du stock existe encore",
        error: true,
      };
    }
    await db.medication.delete({ where: { id } });
    await logAudit({
      userId,
      action: "DELETE",
      model: "Medication",
      recordId: String(id),
    });
    revalidatePath("/pharmacy/medications");
    return { success: true, message: await am("medDeleted") };
  } catch (err) {
    return handleError(err);
  }
}

// ─── Fournisseurs ────────────────────────────────────────────────────────────

export async function createSupplier(
  data: unknown
): Promise<ActionResult<{ id: number }>> {
  try {
    const { userId } = await requireRole([...PHARMACY_ROLES]);
    const parsed = SupplierSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;
    const supplier = await db.supplier.create({
      data: {
        name: v.name,
        contact_person: v.contact_person ?? undefined,
        email: v.email ? v.email : undefined,
        phone: v.phone,
        address: v.address ?? undefined,
        tax_id: v.tax_id ?? undefined,
        is_active: v.is_active,
      },
    });
    await logAudit({
      userId,
      action: "CREATE",
      model: "Supplier",
      recordId: String(supplier.id),
      newValues: v,
    });
    revalidatePath("/pharmacy/suppliers");
    return {
      success: true,
      message: await am("supplierCreated"),
      data: { id: supplier.id },
    };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        success: false,
        message: await am("supplierExists"),
        error: true,
      };
    }
    return handleError(err);
  }
}

export async function updateSupplier(
  id: number,
  data: unknown
): Promise<ActionResult> {
  try {
    const { userId } = await requireRole([...PHARMACY_ROLES]);
    const parsed = SupplierSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;
    const before = await db.supplier.findUnique({ where: { id } });
    if (!before) {
      return { success: false, message: "Fournisseur introuvable", error: true };
    }
    await db.supplier.update({
      where: { id },
      data: {
        name: v.name,
        contact_person: v.contact_person ?? null,
        email: v.email ? v.email : null,
        phone: v.phone,
        address: v.address ?? null,
        tax_id: v.tax_id ?? null,
        is_active: v.is_active,
      },
    });
    await logAudit({
      userId,
      action: "UPDATE",
      model: "Supplier",
      recordId: String(id),
      oldValues: before as unknown as Record<string, unknown>,
      newValues: v,
    });
    revalidatePath("/pharmacy/suppliers");
    return { success: true, message: await am("supplierUpdated") };
  } catch (err) {
    return handleError(err);
  }
}

// ─── Stocks : entrée de lot ──────────────────────────────────────────────────

export async function addStockEntry(
  data: unknown
): Promise<ActionResult<{ stockId: number }>> {
  try {
    const { userId, name } = await (async () => {
      const { userId } = await requireRole([...PHARMACY_ROLES]);
      const info = await actorInfo();
      return { userId, name: info.name };
    })();

    const parsed = StockEntrySchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;

    const result = await db.$transaction(async (tx) => {
      // Upsert : si le lot existe déjà pour ce médicament, on cumule
      const existing = await tx.medicationStock.findUnique({
        where: {
          medication_id_batch_number: {
            medication_id: v.medication_id,
            batch_number: v.batch_number,
          },
        },
      });

      let stock;
      if (existing) {
        stock = await tx.medicationStock.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + v.quantity,
            unit_cost: v.unit_cost,
            selling_price: v.selling_price,
            expiry_date: v.expiry_date,
            supplier_id: v.supplier_id ?? existing.supplier_id,
            notes: v.notes ?? existing.notes,
          },
        });
      } else {
        stock = await tx.medicationStock.create({
          data: {
            medication_id: v.medication_id,
            batch_number: v.batch_number,
            quantity: v.quantity,
            unit_cost: v.unit_cost,
            selling_price: v.selling_price,
            expiry_date: v.expiry_date,
            supplier_id: v.supplier_id ?? undefined,
            notes: v.notes ?? undefined,
          },
        });
      }

      await tx.stockMovement.create({
        data: {
          stock_id: stock.id,
          type: "IN",
          quantity: v.quantity,
          reason: v.notes ?? "Entrée en stock",
          user_id: userId,
          user_name: name,
        },
      });

      return stock;
    });

    await logAudit({
      userId,
      action: "CREATE",
      model: "MedicationStock",
      recordId: String(result.id),
      newValues: v,
    });

    revalidatePath("/pharmacy/inventory");
    revalidatePath(`/pharmacy/medications/${v.medication_id}`);
    return {
      success: true,
      message: `Entrée en stock enregistrée (+${v.quantity})`,
      data: { stockId: result.id },
    };
  } catch (err) {
    return handleError(err);
  }
}

// ─── Ajustement / retour / perte / péremption ────────────────────────────────

export async function adjustStock(data: unknown): Promise<ActionResult> {
  try {
    const { userId } = await requireRole([...PHARMACY_ROLES]);
    const { name } = await actorInfo();
    const parsed = StockAdjustmentSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;

    await db.$transaction(async (tx) => {
      const stock = await tx.medicationStock.findUnique({
        where: { id: v.stock_id },
      });
      if (!stock) throw new Error("Lot introuvable");

      const newQty = stock.quantity + v.quantity; // v.quantity peut être négatif
      if (newQty < 0) {
        throw new Error("Quantité résultante négative");
      }

      await tx.medicationStock.update({
        where: { id: v.stock_id },
        data: { quantity: newQty },
      });

      await tx.stockMovement.create({
        data: {
          stock_id: v.stock_id,
          type: v.type,
          quantity: v.quantity,
          reason: v.reason,
          user_id: userId,
          user_name: name,
        },
      });
    });

    await logAudit({
      userId,
      action: "UPDATE",
      model: "MedicationStock",
      recordId: String(v.stock_id),
      details: `${v.type} qty=${v.quantity} raison=${v.reason}`,
    });

    revalidatePath("/pharmacy/inventory");
    return { success: true, message: await am("adjustmentSaved") };
  } catch (err) {
    if (err instanceof Error && err.message.includes("négative")) {
      return { success: false, message: err.message, error: true };
    }
    return handleError(err);
  }
}

// ─── Dispensation (délivrance patient) ───────────────────────────────────────

function nextReference(prefix: string, id: number) {
  const y = new Date().getFullYear();
  return `${prefix}-${y}-${String(id).padStart(5, "0")}`;
}

export async function createDispensation(
  data: unknown
): Promise<ActionResult<{ id: number; reference: string }>> {
  try {
    const { userId } = await requireRole([...DISPENSATION_ROLES]);
    const { name } = await actorInfo();
    const parsed = DispensationSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;

    const result = await db.$transaction(async (tx) => {
      // Recharge chaque lot pour vérifier stock + prix
      const items = await Promise.all(
        v.items.map(async (item) => {
          const stock = await tx.medicationStock.findUnique({
            where: { id: item.stock_id },
            include: { medication: true },
          });
          if (!stock) throw new Error(`Lot ${item.stock_id} introuvable`);
          if (stock.quantity < item.quantity) {
            throw new Error(
              `Stock insuffisant pour ${stock.medication.name} (dispo : ${stock.quantity})`
            );
          }
          if (stock.expiry_date < new Date()) {
            throw new Error(
              `Lot ${stock.batch_number} de ${stock.medication.name} est périmé`
            );
          }
          return {
            stock,
            quantity: item.quantity,
            instructions: item.instructions ?? undefined,
            unit_price: stock.selling_price,
            total_price: stock.selling_price * item.quantity,
          };
        })
      );

      const total = items.reduce((s, i) => s + i.total_price, 0);

      // Reference provisoire, on la remplace après création avec l'id
      const dispensation = await tx.dispensation.create({
        data: {
          reference: `DSP-TMP-${Date.now()}`,
          patient_id: v.patient_id,
          medical_record_id: v.medical_record_id ?? undefined,
          prescription_id: v.prescription_id ?? undefined,
          dispensed_by: userId,
          dispensed_by_name: name,
          notes: v.notes ?? undefined,
          total_amount: total,
          items: {
            create: items.map((i) => ({
              stock_id: i.stock.id,
              medication_id: i.stock.medication_id,
              quantity: i.quantity,
              unit_price: i.unit_price,
              total_price: i.total_price,
              instructions: i.instructions,
            })),
          },
        },
      });

      const reference = nextReference("DSP", dispensation.id);
      await tx.dispensation.update({
        where: { id: dispensation.id },
        data: { reference },
      });

      // Décrément stock + mouvement OUT par lot
      for (const i of items) {
        await tx.medicationStock.update({
          where: { id: i.stock.id },
          data: { quantity: i.stock.quantity - i.quantity },
        });
        await tx.stockMovement.create({
          data: {
            stock_id: i.stock.id,
            type: "OUT",
            quantity: -i.quantity,
            reason: "Dispensation",
            reference,
            user_id: userId,
            user_name: name,
          },
        });
      }

      // Si dispensation liée à une ordonnance : maj des quantités délivrées + statut
      if (v.prescription_id) {
        const rxItems = await tx.prescriptionItem.findMany({
          where: { prescription_id: v.prescription_id },
        });

        // Cumule les quantités dispensées par médicament dans cette dispensation
        const dispensedByMed = new Map<number, number>();
        for (const i of items) {
          dispensedByMed.set(
            i.stock.medication_id,
            (dispensedByMed.get(i.stock.medication_id) ?? 0) + i.quantity
          );
        }

        for (const rxItem of rxItems) {
          const add = dispensedByMed.get(rxItem.medication_id);
          if (!add) continue;
          const newDispensed = Math.min(
            rxItem.quantity_prescribed,
            rxItem.quantity_dispensed + add
          );
          if (newDispensed !== rxItem.quantity_dispensed) {
            await tx.prescriptionItem.update({
              where: { id: rxItem.id },
              data: { quantity_dispensed: newDispensed },
            });
          }
        }

        // Recalcule le statut global de l'ordonnance
        const refreshed = await tx.prescriptionItem.findMany({
          where: { prescription_id: v.prescription_id },
        });
        const allDispensed = refreshed.every(
          (it) => it.quantity_dispensed >= it.quantity_prescribed
        );
        const anyDispensed = refreshed.some((it) => it.quantity_dispensed > 0);
        await tx.prescription.update({
          where: { id: v.prescription_id },
          data: {
            status: allDispensed
              ? "DISPENSED"
              : anyDispensed
              ? "PARTIALLY_DISPENSED"
              : "PENDING",
          },
        });
      }

      return { id: dispensation.id, reference };
    });

    await logAudit({
      userId,
      action: "CREATE",
      model: "Dispensation",
      recordId: String(result.id),
      newValues: { reference: result.reference, patient_id: v.patient_id },
    });

    revalidatePath("/pharmacy/dispensation");
    revalidatePath("/pharmacy/inventory");
    if (v.prescription_id) {
      revalidatePath("/pharmacy/prescriptions");
      revalidatePath(`/pharmacy/prescriptions/${v.prescription_id}`);
    }
    return {
      success: true,
      message: `Dispensation ${result.reference} enregistrée`,
      data: result,
    };
  } catch (err) {
    if (err instanceof Error && /Stock insuffisant|périmé|introuvable/.test(err.message)) {
      return { success: false, message: err.message, error: true };
    }
    return handleError(err);
  }
}

// ─── Bons de commande fournisseurs ───────────────────────────────────────────

export async function createPurchaseOrder(
  data: unknown
): Promise<ActionResult<{ id: number; reference: string }>> {
  try {
    const { userId } = await requireRole([...PHARMACY_ROLES]);
    const parsed = PurchaseOrderSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;
    const total = v.items.reduce(
      (s, i) => s + i.unit_cost * i.quantity_ordered,
      0
    );

    const result = await db.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.create({
        data: {
          reference: `PO-TMP-${Date.now()}`,
          supplier_id: v.supplier_id,
          expected_date: v.expected_date ?? undefined,
          notes: v.notes ?? undefined,
          total_amount: total,
          created_by: userId,
          items: {
            create: v.items.map((i) => ({
              medication_id: i.medication_id,
              quantity_ordered: i.quantity_ordered,
              unit_cost: i.unit_cost,
              total_cost: i.unit_cost * i.quantity_ordered,
            })),
          },
        },
      });
      const reference = nextReference("PO", order.id);
      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { reference },
      });
      return { id: order.id, reference };
    });

    await logAudit({
      userId,
      action: "CREATE",
      model: "PurchaseOrder",
      recordId: String(result.id),
      newValues: { reference: result.reference, supplier_id: v.supplier_id },
    });

    revalidatePath("/pharmacy/purchase-orders");
    return {
      success: true,
      message: `Bon de commande ${result.reference} créé`,
      data: result,
    };
  } catch (err) {
    return handleError(err, "Impossible de créer le bon de commande");
  }
}

const STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  DRAFT: [PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.CANCELLED],
  ORDERED: [PurchaseOrderStatus.CANCELLED],
  PARTIALLY_RECEIVED: [],
  RECEIVED: [],
  CANCELLED: [],
};

export async function updatePurchaseOrderStatus(
  id: number,
  status: PurchaseOrderStatus
): Promise<ActionResult> {
  try {
    const { userId } = await requireRole([...PHARMACY_ROLES]);
    const order = await db.purchaseOrder.findUnique({ where: { id } });
    if (!order) {
      return { success: false, message: "Commande introuvable", error: true };
    }
    if (!STATUS_TRANSITIONS[order.status].includes(status)) {
      return {
        success: false,
        message: `Transition ${order.status} → ${status} non autorisée`,
        error: true,
      };
    }

    await db.purchaseOrder.update({ where: { id }, data: { status } });
    await logAudit({
      userId,
      action: "UPDATE",
      model: "PurchaseOrder",
      recordId: String(id),
      details: `statut ${order.status} → ${status}`,
    });

    revalidatePath("/pharmacy/purchase-orders");
    revalidatePath(`/pharmacy/purchase-orders/${id}`);
    const label =
      status === PurchaseOrderStatus.ORDERED
        ? "Commande passée au fournisseur"
        : status === PurchaseOrderStatus.CANCELLED
        ? "Commande annulée"
        : "Statut mis à jour";
    return { success: true, message: label };
  } catch (err) {
    return handleError(err);
  }
}

export async function receivePurchaseOrder(
  data: unknown
): Promise<ActionResult> {
  try {
    const { userId } = await requireRole([...PHARMACY_ROLES]);
    const { name } = await actorInfo();
    const parsed = ReceiveOrderSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        error: true,
      };
    }
    const v = parsed.data;

    await db.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id: v.order_id },
        include: { items: true },
      });
      if (!order) throw new Error("Commande introuvable");
      if (
        order.status === PurchaseOrderStatus.CANCELLED ||
        order.status === PurchaseOrderStatus.RECEIVED
      ) {
        throw new Error("Cette commande ne peut plus être réceptionnée");
      }

      for (const recv of v.items) {
        if (recv.quantity_received <= 0) continue;
        const item = order.items.find((it) => it.id === recv.item_id);
        if (!item) throw new Error(`Ligne ${recv.item_id} introuvable`);

        const remaining = item.quantity_ordered - item.quantity_received;
        if (recv.quantity_received > remaining) {
          throw new Error(
            `Réception (${recv.quantity_received}) supérieure au restant (${remaining})`
          );
        }

        // Crée/cumule le lot en stock (comme une entrée de stock)
        const batch = recv.batch_number!.trim();
        const existing = await tx.medicationStock.findUnique({
          where: {
            medication_id_batch_number: {
              medication_id: item.medication_id,
              batch_number: batch,
            },
          },
        });

        let stock;
        if (existing) {
          stock = await tx.medicationStock.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + recv.quantity_received,
              unit_cost: item.unit_cost,
              selling_price: recv.selling_price ?? existing.selling_price,
              expiry_date: recv.expiry_date ?? existing.expiry_date,
              supplier_id: order.supplier_id,
            },
          });
        } else {
          stock = await tx.medicationStock.create({
            data: {
              medication_id: item.medication_id,
              batch_number: batch,
              quantity: recv.quantity_received,
              unit_cost: item.unit_cost,
              selling_price: recv.selling_price ?? item.unit_cost,
              expiry_date: recv.expiry_date!,
              supplier_id: order.supplier_id,
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            stock_id: stock.id,
            type: "IN",
            quantity: recv.quantity_received,
            reason: "Réception commande",
            reference: order.reference,
            user_id: userId,
            user_name: name,
          },
        });

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { quantity_received: item.quantity_received + recv.quantity_received },
        });
      }

      // Recalcule le statut global
      const refreshed = await tx.purchaseOrderItem.findMany({
        where: { order_id: order.id },
      });
      const allReceived = refreshed.every(
        (it) => it.quantity_received >= it.quantity_ordered
      );
      const anyReceived = refreshed.some((it) => it.quantity_received > 0);
      const newStatus = allReceived
        ? PurchaseOrderStatus.RECEIVED
        : anyReceived
        ? PurchaseOrderStatus.PARTIALLY_RECEIVED
        : order.status;

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          received_date: allReceived ? new Date() : order.received_date,
        },
      });
    });

    await logAudit({
      userId,
      action: "UPDATE",
      model: "PurchaseOrder",
      recordId: String(v.order_id),
      details: "Réception de marchandise",
    });

    revalidatePath("/pharmacy/purchase-orders");
    revalidatePath(`/pharmacy/purchase-orders/${v.order_id}`);
    revalidatePath("/pharmacy/inventory");
    return { success: true, message: await am("receptionSaved") };
  } catch (err) {
    if (
      err instanceof Error &&
      /introuvable|réceptionnée|supérieure/.test(err.message)
    ) {
      return { success: false, message: err.message, error: true };
    }
    return handleError(err, "Impossible d'enregistrer la réception");
  }
}
