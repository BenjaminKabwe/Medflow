import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { checkRole } from "@/utils/roles";

export async function getNotifications() {
  const { userId } = await auth();
  if (!userId) return { data: [], unreadCount: 0 };

  const notifications = await db.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { data: notifications, unreadCount };
}

export async function getAllNotificationsAdmin() {
  const isAdmin = await checkRole("ADMIN");
  if (!isAdmin) return { data: [], total: 0 };

  const notifications = await db.notification.findMany({
    orderBy: { created_at: "desc" },
    take: 150,
  });

  if (notifications.length === 0) return { data: [], total: 0 };

  const userIds = [
    ...new Set([
      ...notifications.map((n) => n.user_id),
      ...notifications.filter((n) => n.sender_id).map((n) => n.sender_id!),
    ]),
  ];

  const [patients, doctors] = await Promise.all([
    db.patient.findMany({
      where: { id: { in: userIds } },
      select: { id: true, first_name: true, last_name: true },
    }),
    db.doctor.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    }),
  ]);

  const userMap = new Map<string, string>();
  for (const p of patients) userMap.set(p.id, `${p.first_name} ${p.last_name}`);
  for (const d of doctors) userMap.set(d.id, `Dr ${d.name}`);

  return {
    data: notifications.map((n) => ({
      ...n,
      recipientName: userMap.get(n.user_id) ?? "Utilisateur inconnu",
      senderName: n.sender_id ? (userMap.get(n.sender_id) ?? null) : null,
    })),
    total: notifications.length,
  };
}

export async function getUnreadCount() {
  try {
    const { userId } = await auth();
    if (!userId) return 0;

    return await db.notification.count({
      where: { user_id: userId, read: false },
    });
  } catch {
    return 0;
  }
}
