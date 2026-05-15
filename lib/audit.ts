import "server-only";
import db from "@/lib/db";
import { AuditAction } from "@/lib/generated/prisma/enums";

interface AuditData {
  userId: string;
  action: AuditAction;
  model: string;
  recordId: string;
  details?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

/** Fire-and-forget: never throws, never blocks the calling action. */
export async function logAudit(data: AuditData): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        user_id:    data.userId,
        action:     data.action,
        model:      data.model,
        record_id:  data.recordId,
        details:    data.details,
        old_values: data.oldValues ? JSON.stringify(data.oldValues) : undefined,
        new_values: data.newValues ? JSON.stringify(data.newValues) : undefined,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write:", err);
  }
}
