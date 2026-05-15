"use server";

import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function markAsRead(id: number): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  const notif = await db.notification.findUnique({ where: { id }, select: { user_id: true } });
  if (!notif || notif.user_id !== userId) return;

  await db.notification.update({
    where: { id },
    data: { read: true, read_at: new Date() },
  });

  revalidatePath("/notifications");
}

export async function markAllAsRead(): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  // updateMany déclenche une transaction implicite incompatible avec PrismaNeonHTTP
  await db.$executeRaw`
    UPDATE "Notification"
    SET read = true, read_at = NOW(), updated_at = NOW()
    WHERE user_id = ${userId} AND read = false
  `;

  revalidatePath("/notifications");
}
