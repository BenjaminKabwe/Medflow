import "server-only";
import db from "@/lib/db";
import {
  envoyerEmail,
  escapeEmailHtml,
  isEmailConfigured,
} from "@/lib/email";
import { NotificationType } from "@/lib/generated/prisma/enums";

interface EmailNotificationData {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
}

const EMAIL_NOTIFICATION_TYPES: NotificationType[] = [
  "NOUVEAU_RENDEZ_VOUS",
  "RENDEZ_VOUS_CONFIRME",
  "RENDEZ_VOUS_ANNULE",
  "RENDEZ_VOUS_MODIFIE",
  "PAIEMENT_RECU",
];

async function getNotificationRecipient(userId: string) {
  const [patient, doctor, staff] = await Promise.all([
    db.patient.findUnique({
      where: { id: userId },
      select: { email: true, first_name: true, last_name: true },
    }),
    db.doctor.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    }),
    db.staff.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    }),
  ]);

  if (patient) {
    return {
      email: patient.email,
      name: `${patient.first_name} ${patient.last_name}`.trim(),
    };
  }

  if (doctor) {
    return { email: doctor.email, name: `Dr ${doctor.name}`.trim() };
  }

  if (staff) {
    return { email: staff.email, name: staff.name };
  }

  return null;
}

function getAppNotificationsUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (!appUrl) return null;

  return `${appUrl.replace(/\/$/, "")}/notifications`;
}

function buildNotificationEmailHtml({
  recipientName,
  title,
  message,
  notificationsUrl,
}: {
  recipientName?: string;
  title: string;
  message: string;
  notificationsUrl: string | null;
}) {
  const safeName = recipientName ? escapeEmailHtml(recipientName) : "";
  const safeTitle = escapeEmailHtml(title);
  const safeMessage = escapeEmailHtml(message);
  const safeUrl = notificationsUrl ? escapeEmailHtml(notificationsUrl) : null;

  const greeting = safeName
    ? `<p style="margin:0 0 12px;font-size:15px">Bonjour ${safeName},</p>`
    : "";
  const cta = safeUrl
    ? `<p style="margin:0 0 20px"><a href="${safeUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:6px;padding:10px 14px;font-size:14px">Voir mes notifications</a></p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;background:#f7fafc;padding:24px;color:#102030">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5edf3;border-radius:8px;padding:24px">
        <p style="margin:0 0 16px;font-size:14px;color:#52616b">MedFlow</p>
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0f172a">${safeTitle}</h1>
        ${greeting}
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6">${safeMessage}</p>
        ${cta}
        <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#64748b">
          Ce message concerne votre suivi dans MedFlow. Pour proteger les donnees de sante, connectez-vous a l'application pour consulter les details complets.
        </p>
      </div>
    </div>
  `;
}

export async function envoyerEmailNotification(
  data: EmailNotificationData,
  notificationId: number
) {
  if (!isEmailConfigured() || !EMAIL_NOTIFICATION_TYPES.includes(data.type)) {
    return;
  }

  const recipient = await getNotificationRecipient(data.user_id);

  if (!recipient?.email) {
    console.warn(
      `[Email] Aucun destinataire trouve pour la notification #${notificationId}.`
    );
    return;
  }

  const notificationsUrl = getAppNotificationsUrl();
  const text = [
    recipient.name ? `Bonjour ${recipient.name},` : "Bonjour,",
    "",
    data.message,
    "",
    notificationsUrl
      ? `Voir vos notifications : ${notificationsUrl}`
      : "Connectez-vous a MedFlow pour consulter les details.",
    "",
    "Pour proteger les donnees de sante, les details complets sont disponibles uniquement dans l'application.",
  ].join("\n");

  await envoyerEmail({
    to: recipient.email,
    subject: `MedFlow - ${data.title}`,
    text,
    html: buildNotificationEmailHtml({
      recipientName: recipient.name,
      title: data.title,
      message: data.message,
      notificationsUrl,
    }),
    idempotencyKey: `notification-${notificationId}`,
  });
}
