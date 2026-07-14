import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { routeAccess } from "./lib/routes";

const matchers = Object.keys(routeAccess).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccess[route],
}));

// Routes accessibles sans authentification. TOUT le reste exige une connexion
// (modèle « fail-closed » : une page non listée n'est jamais publique par défaut).
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

// Les routes API gèrent elles-mêmes leur autorisation (et doivent renvoyer un
// statut 401, pas une redirection HTML vers la page de connexion).
const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const url = new URL(req.url);

  // 1. Routes publiques et API : laisser passer.
  if (isPublicRoute(req) || isApiRoute(req)) {
    return NextResponse.next();
  }

  // 2. Fail-closed : toute page protégée exige une authentification.
  //    Un visiteur non connecté est renvoyé vers la page de connexion.
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", url.origin));
  }

  // 3. Contrôle d'accès par rôle (défense en profondeur).
  const role = (sessionClaims?.metadata?.role as string | undefined) ?? "patient";
  const matchingRoute = matchers.find(({ matcher }) => matcher(req));

  if (matchingRoute && !matchingRoute.allowedRoles.includes(role)) {
    // Rôle authentifié mais non autorisé → redirection vers son tableau de bord.
    return NextResponse.redirect(new URL(`/${role}`, url.origin));
  }

  // Utilisateur authentifié et autorisé.
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
