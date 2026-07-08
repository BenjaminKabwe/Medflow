import "server-only";

interface SendEmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
  idempotencyKey?: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.MEDFLOW_EMAIL_FROM ??
    process.env.EMAIL_FROM ??
    process.env.RESEND_EMAIL_FROM;

  if (!apiKey || !from) return null;

  return { apiKey, from };
}

export function isEmailConfigured() {
  return Boolean(getEmailConfig());
}

export function escapeEmailHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function envoyerEmail({
  to,
  subject,
  text,
  html,
  idempotencyKey,
}: SendEmailData) {
  const config = getEmailConfig();

  if (!config) {
    console.warn(
      "[Email] RESEND_API_KEY et MEDFLOW_EMAIL_FROM/EMAIL_FROM non configures. Envoi ignore."
    );
    return { skipped: true };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: config.from,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `[Email] Resend a refuse l'envoi (${response.status}): ${details}`
    );
  }

  return response.json();
}
