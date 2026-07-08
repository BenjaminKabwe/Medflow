import "server-only";
import db from "@/lib/db";
import { envoyerEmailNotification } from "@/lib/email-notifications";
import { pusher } from "@/lib/pusher";
import { NotificationType } from "@/lib/generated/prisma/enums";

interface CreateNotificationData {
  user_id: string;
  sender_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  appointment_id?: number;
}

export async function creerNotification(data: CreateNotificationData) {
  const notification = await db.notification.create({
    data: {
      user_id: data.user_id,
      sender_id: data.sender_id,
      title: data.title,
      message: data.message,
      type: data.type,
      appointment_id: data.appointment_id,
    },
  });

  try {
    await pusher.trigger(
      `private-user-${data.user_id}`,
      "nouvelle-notification",
      notification
    );
  } catch (err) {
    console.error("[Pusher] trigger failed:", err);
  }

  try {
    await envoyerEmailNotification(data, notification.id);
  } catch (err) {
    console.error("[Email] notification email failed:", err);
  }

  return notification;
}

export async function marquerCommeLue(notificationId: number) {
  return db.notification.update({
    where: { id: notificationId },
    data: { read: true, read_at: new Date() },
  });
}

export async function marquerToutesCommeLues(userId: string) {
  // updateMany déclenche une transaction implicite incompatible avec PrismaNeonHTTP
  await db.$executeRaw`
    UPDATE "Notification"
    SET read = true, read_at = NOW(), updated_at = NOW()
    WHERE user_id = ${userId} AND read = false
  `;
}

export async function getNotifications(userId: string) {
  return db.notification.findMany({
    where: { user_id: userId },
    include: {
      appointment: {
        select: { id: true, appointment_date: true, time: true, status: true },
      },
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });
}

export async function getNombreNonLues(userId: string) {
  return db.notification.count({
    where: { user_id: userId, read: false },
  });
}
