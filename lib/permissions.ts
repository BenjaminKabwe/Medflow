import { auth } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";

// Clerk stocke les rôles en minuscules dans les JWT metadata ("cashier", "admin"…).
// Prisma Role est en majuscules. On normalise systématiquement.
function parseRole(raw: unknown): Role | null {
  if (typeof raw !== "string" || !raw) return null;
  const upper = raw.toUpperCase();
  return (Object.values(Role) as string[]).includes(upper)
    ? (upper as Role)
    : null;
}

// ─── Erreurs typées ────────────────────────────────────────────────────────────

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Non authentifié") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Accès refusé") {
    super(message);
    this.name = "ForbiddenError";
  }
}

// ─── Fonctions principales ─────────────────────────────────────────────────────

/**
 * Vérifie que l'utilisateur authentifié correspond à `userId`
 * ET possède l'un des `allowedRoles`. Retourne un booléen.
 *
 * Usage type (API route / Server Action) :
 *   const { userId } = await auth();
 *   if (!userId || !(await checkRole(userId, [Role.ADMIN, Role.CASHIER]))) {
 *     return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
 *   }
 */
export async function checkRole(
  userId: string,
  allowedRoles: Role[]
): Promise<boolean> {
  const { userId: authId, sessionClaims } = await auth();
  if (!authId || authId !== userId) return false;

  const role = parseRole(sessionClaims?.metadata?.role);
  if (!role) return false;

  return allowedRoles.includes(role);
}

/**
 * Asserte que l'appelant est authentifié et possède l'un des `allowedRoles`.
 * Lève UnauthorizedError (401) ou ForbiddenError (403) en cas d'échec.
 * Retourne { userId, role } en cas de succès.
 *
 * Pattern recommandé pour les API routes :
 *   const { userId } = await requireRole([Role.CASHIER, Role.ADMIN]);
 */
export async function requireRole(
  allowedRoles: Role[]
): Promise<{ userId: string; role: Role }> {
  const { userId, sessionClaims } = await auth();

  if (!userId) throw new UnauthorizedError();

  const role = parseRole(sessionClaims?.metadata?.role);
  if (!role) throw new ForbiddenError("Rôle non attribué à ce compte");

  if (!allowedRoles.includes(role)) {
    throw new ForbiddenError(
      `Le rôle ${role} n'est pas autorisé pour cette ressource`
    );
  }

  return { userId, role };
}

/**
 * Retourne { userId, role } de l'utilisateur courant, ou null s'il n'est pas
 * authentifié / n'a pas de rôle valide. Pratique dans les Server Components.
 */
export async function getCurrentUser(): Promise<{
  userId: string;
  role: Role;
} | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  const role = parseRole(sessionClaims?.metadata?.role);
  if (!role) return null;
  return { userId, role };
}

// ─── Helper pour les réponses d'erreur API ─────────────────────────────────────

/**
 * Convertit UnauthorizedError / ForbiddenError en objet { status, body }
 * prêt à passer dans NextResponse.json().
 *
 *   const { userId } = await requireRole([Role.ADMIN]).catch(toApiError);
 *   // ou
 *   try { ... } catch (e) { return toApiError(e); }
 */
export function toApiError(error: unknown): never {
  if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
    throw error; // relancé pour être attrapé par le catch de l'appelant
  }
  throw error;
}
