---
name: MedFlow — Architecture & état du projet
description: Architecture complète, bugs corrigés et design system du projet MedFlow (gestion électronique de dossiers patients)
type: project
---

Projet MedFlow — Système de gestion électronique des dossiers patients (GEDP).

**Stack**: Next.js 15 (App Router), Prisma 6 (prisma-client provider), PostgreSQL Neon, Clerk Auth, Tailwind CSS, Shadcn UI, Recharts, Zod + React Hook Form.

**Design system premium implémenté le 2026-05-06**:
- Palette médicale: sky-500 (primary), emerald-500 (accent), indigo-600 (gradient)
- Sidebar dark navy `hsl(222,47%,8%)` avec SidebarLink client component (active state via usePathname)
- Navbar avec breadcrumb hiérarchique, recherche, notifications
- CSS variables dans globals.css, couleurs custom dans tailwind.config.ts

**Bugs critiques corrigés**:
1. `app/actions/general.ts` — Switch fall-through (manque de `break`) + case "bill" manquant
2. `components/navbar.tsx` — Violation React hooks (usePathname dans fonction imbriquée)
3. `lib/schema.ts` — Typo "dLast name" + marital_status cast minuscule vs MAJUSCULE enum
4. `components/charts/stat-summary.tsx` — Division par zéro (NaN) quand total = 0
5. `app/actions/admin.ts` — `department` string → relation Prisma (connect by id), WeekDay enum minuscule → MAJUSCULE, spread de `validatedValues` incluant `password` dans Prisma
6. `app/actions/medical.ts` — `bills` traitée comme tableau alors que c'est une relation one-to-one Payment?; `receipt_number` manquant (champ @unique requis)
7. `utils/services/admin.ts`, `doctor.ts`, `patient.ts` — `mode: "insensitive"` incompatible avec enum WeekDay Prisma 6; jours en minuscules → `.toUpperCase()` avant requête

**Architecture clé**:
- 2 clients Prisma: `@prisma/client` (via lib/db.ts standard) ET `@/lib/generated/prisma/client` (client natif Prisma 6, utilisé dans new-patient.tsx)
- Prisma schema: `output = ""` (comportement Prisma 6 natif)
- Middleware Clerk avec routeAccess dans lib/routes.ts
- Rôles: admin, doctor, nurse, lab technician, patient, cashier

**Features ajoutées le 2026-05-06**:
- Dark/Light mode via `next-themes` (ThemeProvider dans components/providers.tsx, toggle dans navbar)
- Système i18n FR/EN via React context (LanguageProvider dans components/providers.tsx, hook `useLanguage()`, traductions dans lib/i18n.ts)
- SidebarNav (client component) séparé du Sidebar (server component) pour permettre les traductions
- Toutes les classes Tailwind `dark:` ajoutées sur les composants clés

**Why:** Système médical complet avec 16 modèles Prisma.
**How to apply:** Toujours passer par `import("@prisma/client").WeekDay` pour les enums de type jour; utiliser `as unknown as Type` pour les casts Prisma vers types custom.
