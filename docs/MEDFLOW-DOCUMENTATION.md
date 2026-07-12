# MedFlow — Documentation complète du projet

> **Système de gestion électronique des dossiers patients (GEDP)**  
> Version : 0.1.0 · Dernière mise à jour : juin 2026

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Architecture](#3-architecture)
4. [Installation et configuration](#4-installation-et-configuration)
5. [Authentification et rôles](#5-authentification-et-rôles)
6. [Pages et routes](#6-pages-et-routes)
7. [API Routes](#7-api-routes)
8. [Server Actions](#8-server-actions)
9. [Modèle de données (Prisma)](#9-modèle-de-données-prisma)
10. [Services métier](#10-services-métier)
11. [Modules fonctionnels](#11-modules-fonctionnels)
12. [Notifications temps réel](#12-notifications-temps-réel)
13. [Module caisse](#13-module-caisse)
14. [Interface utilisateur](#14-interface-utilisateur)
15. [Internationalisation](#15-internationalisation)
16. [Structure du projet](#16-structure-du-projet)
17. [Scripts et commandes](#17-scripts-et-commandes)
18. [Migrations de base de données](#18-migrations-de-base-de-données)

---

## 1. Vue d'ensemble

**MedFlow** est une application web de gestion hospitalière destinée aux établissements de santé. Elle couvre l'ensemble du cycle de vie patient : inscription, prise de rendez-vous, consultation, dossier médical, facturation et encaissement.

### Objectifs principaux

- Centraliser les dossiers patients numériques
- Gérer les rendez-vous et le personnel médical
- Suivre les consultations, diagnostics et signes vitaux
- Facturer les prestations et encaisser les paiements
- Notifier les acteurs en temps réel
- Tracer les actions sensibles via des journaux d'audit

### Contexte métier

Le projet est configuré pour un contexte hospitalier à **Kinshasa (RDC)** : modes de paiement Mobile Money (Airtel, Orange, M-Pesa), devises CDF/USD, libellés en français.

---

## 2. Stack technique

| Couche | Technologies |
|--------|-------------|
| **Framework** | Next.js 15 (App Router), React 18, TypeScript 5 |
| **Base de données** | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| **ORM** | Prisma 6 (`prisma-client` provider + client généré) |
| **Authentification** | Clerk (`@clerk/nextjs`) avec RBAC par métadonnées JWT |
| **UI** | Tailwind CSS 3, shadcn/ui (Radix UI), Lucide React |
| **Formulaires** | React Hook Form + Zod |
| **Graphiques** | Recharts |
| **Thème** | next-themes (mode clair/sombre) |
| **Temps réel** | Pusher (notifications push) |
| **PDF** | @react-pdf/renderer (factures) |
| **Données de test** | @faker-js/faker (seed) |

### Dépendances clés

```
@clerk/nextjs          — Authentification
@prisma/client         — ORM
@prisma/adapter-neon   — Adaptateur HTTP Neon serverless
@react-pdf/renderer    — Génération PDF
pusher / pusher-js     — Temps réel
recharts               — Visualisations
sonner                 — Toasts
zod                    — Validation schémas
```

---

## 3. Architecture

### 3.1 Schéma des couches

```
┌─────────────────────────────────────────────────────────┐
│  Navigateur (React Client Components)                   │
│  — formulaires, graphiques, notifications, thème        │
└────────────────────────┬────────────────────────────────┘
                         │ fetch / Server Actions
┌────────────────────────▼────────────────────────────────┐
│  Next.js App Router                                     │
│  — Pages (Server Components)                            │
│  — API Routes (/app/api/*)                              │
│  — Server Actions (/app/actions/*)                      │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  Couche métier                                          │
│  — lib/* (notifications, audit, permissions, sessions)  │
│  — utils/services/* (requêtes Prisma par domaine)       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  lib/db.ts — PrismaClient + adaptateur Neon HTTP        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  PostgreSQL (Neon)                                      │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Clients Prisma

Le projet utilise **deux points d'entrée Prisma** :

| Client | Chemin | Usage |
|--------|--------|-------|
| Standard | `@prisma/client` via `lib/db.ts` | Majorité du code (services, actions, API) |
| Généré natif | `@/lib/generated/prisma/client` | Certains composants (ex. `new-patient.tsx`) |

La connexion passe par l'adaptateur **PrismaNeonHTTP** qui convertit l'URL poolée PgBouncer en endpoint direct Neon.

### 3.3 Flux d'authentification

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant M as middleware.ts
    participant C as Clerk
    participant R as routeAccess (lib/routes.ts)
    participant P as Page

    U->>M: Requête HTTP
    M->>C: Vérifier session JWT
    C-->>M: userId + metadata.role
    M->>R: Matcher route / rôle
    alt Rôle autorisé
        M->>P: NextResponse.next()
    else Rôle non autorisé
        M->>U: Redirect /{role}
    end
```

1. `middleware.ts` intercepte chaque requête (sauf assets statiques)
2. Clerk extrait `sessionClaims.metadata.role`
3. `lib/routes.ts` définit les rôles autorisés par pattern de route
4. Si non autorisé → redirection vers `/{role}` (dashboard du rôle)
5. Page `/` : utilisateur connecté → redirect dashboard ; sinon → landing page

---

## 4. Installation et configuration

### 4.1 Prérequis

- Node.js 18+
- Compte [Clerk](https://clerk.com)
- Base PostgreSQL [Neon](https://neon.tech)
- Compte [Pusher](https://pusher.com) (notifications temps réel)

### 4.2 Installation

```bash
git clone <repo>
cd medflow
npm install
```

### 4.3 Variables d'environnement

Créer un fichier `.env` à la racine :

```env
# Base de données Neon
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Pusher (serveur)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=

# Pusher (client)
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```

### 4.4 Initialisation de la base

```bash
# Appliquer les migrations
npm run migrate:deploy

# Peupler les données initiales (services, modes de paiement…)
npx prisma db seed
```

### 4.5 Lancement

```bash
npm run dev     # http://localhost:3000
npm run build   # Build production
npm run start   # Serveur production
```

---

## 5. Authentification et rôles

### 5.1 Rôles utilisateurs

Les rôles sont stockés dans les métadonnées JWT Clerk (`sessionClaims.metadata.role`) en **minuscules**, puis normalisés en enum Prisma `Role` (majuscules).

| Rôle Clerk | Enum Prisma | Dashboard par défaut | Description |
|------------|-------------|----------------------|-------------|
| `admin` | `ADMIN` | `/admin` | Gestion complète : utilisateurs, paramètres, audit |
| `doctor` | `DOCTOR` | `/doctor` | Consultations, diagnostics, dossiers |
| `patient` | `PATIENT` | `/patient` | Profil, RDV, ordonnances, évaluations |
| `nurse` | `NURSE` | `/nurse` | Patients, médicaments, signes vitaux |
| `cashier` | `CASHIER` | `/cashier/dashboard` | Sessions de caisse, encaissements |
| `lab technician` | `LAB_TECHNICIAN` | — | Accès staff, examens laboratoire |

### 5.2 Contrôle d'accès (middleware)

Fichier : `lib/routes.ts`

| Pattern de route | Rôles autorisés |
|-----------------|-----------------|
| `/admin(.*)` | admin |
| `/administration(.*)` | admin |
| `/cashier(.*)` | cashier, admin |
| `/patient(.*)` | patient, admin, doctor, nurse |
| `/doctor(.*)` | doctor |
| `/nurse(.*)` | nurse, admin |
| `/staff(.*)` | nurse, lab_technician, cashier |
| `/record/users` | admin |
| `/record/doctors` | admin |
| `/record/doctors(.*)` | admin, doctor |
| `/record/staffs` | admin, doctor |
| `/record/patients` | admin, doctor, nurse |
| `/patient/registrations` | patient |

### 5.3 Helpers de permissions

Fichier : `lib/permissions.ts`

| Fonction | Usage |
|----------|-------|
| `checkRole(userId, allowedRoles)` | Vérifie l'accès (booléen) |
| `requireRole(allowedRoles)` | Assert + lève 401/403 |
| `getCurrentUser()` | Retourne `{ userId, role }` ou `null` |

---

## 6. Pages et routes

### 6.1 Pages publiques

| Route | Fichier | Description |
|-------|---------|-------------|
| `/` | `app/page.tsx` | Landing page ou redirect vers dashboard |
| `/sign-in` | `app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Connexion Clerk |
| `/sign-up` | `app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Inscription Clerk |

### 6.2 Dashboards par rôle

| Route | Fichier | Contenu |
|-------|---------|---------|
| `/admin` | `app/(protected)/admin/page.tsx` | Stats, graphiques RDV, médecins disponibles |
| `/doctor` | `app/(protected)/doctor/page.tsx` | Espace médecin |
| `/patient` | `app/(protected)/patient/page.tsx` | Espace patient |
| `/nurse` | — | Redirect / gestion infirmière |
| `/cashier/dashboard` | `app/(protected)/cashier/dashboard/page.tsx` | Sessions caisse, paiements impayés |

### 6.3 Gestion des dossiers (`/record`)

| Route | Description |
|-------|-------------|
| `/record/users` | Gestion des utilisateurs (admin) |
| `/record/doctors` | Liste des médecins |
| `/record/doctors/[id]` | Fiche médecin détaillée |
| `/record/staffs` | Personnel (infirmiers, caissiers, labo) |
| `/record/patients` | Liste des patients |
| `/record/appointments` | Tous les rendez-vous |
| `/record/appointments/[id]` | Détail RDV (diagnostic, signes vitaux, facture) |
| `/record/medical-records` | Dossiers médicaux |
| `/record/billing` | Facturation |

### 6.4 Espace patient

| Route | Description |
|-------|-------------|
| `/patient/registration` | Inscription patient |
| `/patient/prescription` | Ordonnances |
| `/patient/[patientId]` | Profil patient |
| `/patient/self` | Mon profil (avec onglet paiements) |

### 6.5 Administration

| Route | Description |
|-------|-------------|
| `/admin/system-settings` | Paramètres système (services, modes de paiement) |
| `/admin/audit-logs` | Journaux d'audit |
| `/admin/cashier-sessions` | Historique sessions de caisse |
| `/admin/cashier-sessions/[id]` | Détail d'une session |
| `/administration/sessions-de-caisse` | Vue alternative sessions |
| `/notifications` | Centre de notifications |

### 6.6 Infirmier

| Route | Description |
|-------|-------------|
| `/nurse/administer-medications` | Administration des médicaments |

### 6.7 Navigation sidebar

La sidebar (`components/sidebar-nav.tsx`) affiche dynamiquement les liens selon le rôle :

- **Principal** : Dashboard, Mon profil
- **Gestion** : Utilisateurs, Médecins, Personnels, Patients, RDV, Dossiers, Facturation, Caisse…
- **Système** : Notifications, Audit, Sessions caisse, Paramètres

---

## 7. API Routes

### 7.1 Notifications

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/notifications` | Liste des notifications de l'utilisateur |
| `PATCH` | `/api/notifications/[id]/lire` | Marquer une notification comme lue |
| `POST` | `/api/notifications/lire-tout` | Tout marquer comme lu |
| `DELETE` | `/api/notifications/[id]` | Supprimer une notification |

### 7.2 Caisse (cashier)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/cashier/session/current` | Session active du caissier |
| `POST` | `/api/cashier/session/open` | Ouvrir une session |
| `POST` | `/api/cashier/session/close` | Clôturer une session |
| `GET` | `/api/cashier/payments` | Paiements impayés |
| `POST` | `/api/cashier/payments/[id]/collect` | Encaisser un paiement |

### 7.3 Sessions de caisse (admin)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/sessions-caisse` | Liste des sessions |
| `GET` | `/api/sessions-caisse/active` | Session active |
| `GET` | `/api/sessions-caisse/[id]/paiements` | Paiements d'une session |
| `POST` | `/api/sessions-caisse/[id]/cloturer` | Clôturer (admin) |
| `GET` | `/api/admin/cashier-sessions` | Vue admin sessions |

### 7.4 Administration

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/admin/payment-methods` | Modes de paiement configurés |
| `PATCH` | `/api/admin/payment-methods/[method]` | Modifier un mode de paiement |

### 7.5 Autres

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/pusher/auth` | Authentification canaux privés Pusher |
| `GET` | `/api/paiements/[id]/pdf` | Téléchargement facture PDF |

---

## 8. Server Actions

Fichiers dans `app/actions/` :

### 8.1 `admin.ts`

| Action | Description |
|--------|-------------|
| `createNewStaff(data)` | Créer un membre du personnel |
| `createNewDoctor(data)` | Créer un médecin (département, horaires) |
| `addNewService(data)` | Ajouter une prestation facturable |

### 8.2 `appointment.ts`

| Action | Description |
|--------|-------------|
| `createNewAppointment(data)` | Créer un rendez-vous |
| `appointmentAction(id, action)` | Confirmer / annuler / compléter un RDV |
| `addVitalSigns(data)` | Enregistrer les signes vitaux |

### 8.3 `patient.ts`

| Action | Description |
|--------|-------------|
| `createNewPatient(data, pid)` | Créer un dossier patient (id = Clerk userId) |
| `updatePatient(data, pid)` | Mettre à jour le profil patient |

### 8.4 `medical.ts`

| Action | Description |
|--------|-------------|
| `addNewBill(data)` | Ajouter des lignes de facturation |
| `generateBill(data)` | Générer la facture finale d'un RDV |

### 8.5 `cashier.ts`

| Action | Description |
|--------|-------------|
| `openSession(data)` | Ouvrir une session de caisse |
| `closeSession(data)` | Clôturer une session |
| `collectPayment(data)` | Encaisser un paiement |
| `adminCloseSession(sessionId)` | Clôture forcée (admin) |
| `getCurrentSession(cashierId)` | Session active |
| `getUnpaidPayments()` | Liste des impayés |
| `getSessionPayments(sessionId)` | Paiements d'une session |
| `getAllCashierSessions(filters)` | Historique sessions |

### 8.6 `payment-methods.ts`

| Action | Description |
|--------|-------------|
| `togglePaymentMethod(method)` | Activer/désactiver un mode |
| `updatePaymentMethodConfig(data)` | Modifier configuration |
| `getPaymentMethodConfigs()` | Tous les modes |
| `getActivePaymentMethods()` | Modes actifs uniquement |

### 8.7 Autres

| Fichier | Actions |
|---------|---------|
| `notification.ts` | `markAsRead`, `markAllAsRead` |
| `general.ts` | `deleteDataById`, `createReview` |

---

## 9. Modèle de données (Prisma)

Fichier : `prisma/schema.prisma` — **18 modèles**, **12 enums**.

### 9.1 Diagramme entité-relation (simplifié)

```
Department ──┬── Doctor ──┬── Appointment ──┬── MedicalRecords ──┬── Diagnosis
             │            │                 │                    ├── VitalSigns
             │            │                 │                    └── LabTest
             │            │                 └── Payment ── PatientBills ── Services
             │            ├── WorkingDays
             │            ├── DoctorLeave
             │            └── Rating
             └── Staff

Patient ──┬── Appointment
          ├── MedicalRecords
          ├── Diagnosis
          ├── Payment
          ├── Rating
          └── VitalSigns

CashierSession ── Payment
PaymentMethodConfig (standalone)
Notification ── Appointment?
AuditLog (standalone)
```

### 9.2 Modèles principaux

#### Patient
- `id` = Clerk `userId` (String)
- Informations personnelles, contacts d'urgence, consentements
- Antécédents médicaux, allergies, groupe sanguin
- Assurance (provider, numéro)

#### Doctor
- Spécialisation, numéro de licence
- Département, disponibilité (`AVAILABLE`, `UNAVAILABLE`, `ON_LEAVE`)
- Type d'emploi (`FULL`, `PART`)
- Relations : horaires (`WorkingDays`), congés (`DoctorLeave`)

#### Appointment
- Patient + Médecin + date/heure
- Statuts : `PENDING` → `SCHEDULED` → `COMPLETED` / `CANCELLED`
- Contraintes d'unicité : un RDV par créneau médecin ET par créneau patient

#### MedicalRecords
- Lié à un RDV unique
- Plan de traitement, prescriptions, demandes labo
- Contient : diagnostics, signes vitaux, examens labo

#### Payment
- Relation 1:1 avec `Appointment`
- Montants : `total_amount`, `amount_paid`, `discount`
- Méthode : `CASH`, `CARD`, `MOBILE_MONEY`, `INSURANCE`, `BANK_TRANSFER`
- Statut : `PAID`, `UNPAID`, `PART`
- Champs caissier : `cashier_id`, `cashier_name`, `session_id`
- `receipt_number` unique (reçu)

#### CashierSession
- Ouverture/clôture avec montants par mode de paiement
- Totaux : cash, card, mobile, insurance, transfer
- Statut : `OPEN` / `CLOSED`

#### Notification
- Types : `INFO`, `NOUVEAU_RENDEZ_VOUS`, `RENDEZ_VOUS_CONFIRME`, `RENDEZ_VOUS_ANNULE`, `RENDEZ_VOUS_MODIFIE`, `PAIEMENT_RECU`
- Lien optionnel vers un RDV

#### AuditLog
- Actions : `CREATE`, `UPDATE`, `DELETE`, `VIEW`, `LOGIN`, `LOGOUT`
- Stocke `old_values` / `new_values` en JSON stringifié

### 9.3 Enums

| Enum | Valeurs |
|------|---------|
| `Role` | ADMIN, NURSE, DOCTOR, LAB_TECHNICIAN, PATIENT, CASHIER |
| `Status` | ACTIVE, INACTIVE, DORMANT |
| `Gender` | MALE, FEMALE |
| `AppointmentStatus` | PENDING, SCHEDULED, CANCELLED, COMPLETED |
| `PaymentMethod` | CASH, CARD, MOBILE_MONEY, INSURANCE, BANK_TRANSFER |
| `PaymentStatus` | PAID, UNPAID, PART |
| `SessionStatus` | OPEN, CLOSED |
| `WeekDay` | MONDAY … SUNDAY |
| `LabTestStatus` | REQUESTED, IN_PROGRESS, COMPLETED, CANCELLED |
| `MaritalStatus` | SINGLE, MARRIED, DIVORCED, WIDOWED |
| `AvailabilityStatus` | AVAILABLE, UNAVAILABLE, ON_LEAVE |
| `AuditAction` | CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT |
| `NotificationType` | INFO, NOUVEAU_RENDEZ_VOUS, RENDEZ_VOUS_CONFIRME, … |

---

## 10. Services métier

Fichiers dans `utils/services/` — couche d'accès données Prisma par domaine :

| Service | Fichier | Responsabilités |
|---------|---------|-----------------|
| Admin | `admin.ts` | Stats dashboard, CRUD staff/doctors |
| Patient | `patient.ts` | Recherche, filtres, profils patients |
| Doctor | `doctor.ts` | Médecins disponibles, horaires |
| Staff | `staff.ts` | Gestion du personnel |
| Appointment | `appointment.ts` | CRUD rendez-vous, filtres par statut |
| Medical | `medical.ts` | Diagnostics, prescriptions |
| Medical Record | `medical-record.ts` | Dossiers médicaux |
| Payments | `payments.ts` | Facturation, historique paiements |
| Cashier Sessions | `cashier-sessions.ts` | Sessions de caisse |
| Notifications | `notification.ts` | Requêtes notifications |
| Medications | `medications.ts` | Administration médicaments |

---

## 11. Modules fonctionnels

### 11.1 Gestion des patients

- Inscription avec consentements (privacy, service, medical)
- Profil complet : antécédents, allergies, assurance
- Recherche et pagination
- Évaluations des médecins (ratings)

### 11.2 Rendez-vous

- Prise de RDV par le patient ou le staff
- Workflow : `PENDING` → confirmation → `SCHEDULED` → consultation → `COMPLETED`
- Annulation avec notification
- Détail RDV : signes vitaux, diagnostic, facturation, historique

### 11.3 Dossier médical

- Créé automatiquement par RDV
- Signes vitaux : température, tension, fréquence cardiaque, SpO2, poids, taille
- Diagnostics avec symptômes, médicaments prescrits, plan de suivi
- Examens laboratoire (`LabTest`) liés aux services

### 11.4 Facturation

- Services configurables (nom, description, prix)
- Lignes de facturation (`PatientBills`) par prestation
- Génération facture finale avec numéro de reçu unique
- Export PDF (`components/pdf/FacturePDF.ts`)
- Remises et paiements partiels

### 11.5 Évaluations

- Patients peuvent noter les médecins (1-5 étoiles + commentaire)
- Graphiques de satisfaction (`rating-chart.tsx`)

### 11.6 Audit

- Journalisation fire-and-forget (`lib/audit.ts`)
- Enregistre CREATE/UPDATE/DELETE/VIEW/LOGIN/LOGOUT
- Consultation admin via `/admin/audit-logs`

---

## 12. Notifications temps réel

### Architecture

1. **Création** : `lib/notifications.ts` → `creerNotification()`
2. **Persistance** : table `Notification` en base
3. **Push** : Pusher trigger sur canal `private-user-{userId}`
4. **Réception** : `NotificationBell` (client) via `pusher-js`
5. **Auth canal** : `/api/pusher/auth`

### Types de notifications

| Type | Déclencheur |
|------|-------------|
| `NOUVEAU_RENDEZ_VOUS` | Nouveau RDV créé |
| `RENDEZ_VOUS_CONFIRME` | RDV confirmé |
| `RENDEZ_VOUS_ANNULE` | RDV annulé |
| `RENDEZ_VOUS_MODIFIE` | RDV modifié |
| `PAIEMENT_RECU` | Paiement encaissé |
| `INFO` | Message générique |

---

## 13. Module caisse

### Workflow session

```
1. Caissier ouvre session (montant d'ouverture)
   ↓
2. Session status = OPEN
   ↓
3. Encaissement des paiements impayés
   (liés à la session via session_id)
   ↓
4. Clôture session (montants par mode de paiement)
   ↓
5. Session status = CLOSED
```

### Modes de paiement configurables

Table `PaymentMethodConfig` — chaque mode peut être activé/désactivé avec :
- Label, description, icône
- Frais (%)
- Métadonnées JSON (opérateurs Mobile Money, devises…)

Données seedées pour Kinshasa : Espèces (CDF/USD), Carte (Visa/Mastercard), Mobile Money (Airtel, Orange, M-Pesa), Assurance, Virement bancaire.

### Composants caisse

| Composant | Rôle |
|-----------|------|
| `session-header.tsx` | Statut session, boutons ouvrir/clôturer |
| `open-session-dialog.tsx` | Formulaire ouverture |
| `close-session-dialog.tsx` | Formulaire clôture avec totaux |
| `unpaid-payments-list.tsx` | Liste des impayés à encaisser |
| `collect-payment-dialog.tsx` | Encaissement avec choix du mode |
| `session-history.tsx` | Historique paiements de la session |

---

## 14. Interface utilisateur

### 14.1 Design system

| Élément | Valeur |
|---------|--------|
| Couleur primaire | `sky-500` |
| Couleur accent | `emerald-500` |
| Gradient | `sky-500` → `indigo-600` |
| Sidebar (dark) | `hsl(222, 47%, 8%)` |
| Fond (dark) | `hsl(222, 47%, 6%)` |
| Police principale | Inter, DM Sans |
| Police titres | Instrument Serif |

### 14.2 Composants UI (shadcn/ui)

```
components/ui/
├── button.tsx      ├── dialog.tsx     ├── input.tsx
├── card.tsx        ├── form.tsx       ├── label.tsx
├── checkbox.tsx    ├── select.tsx     ├── switch.tsx
├── skeleton.tsx    ├── sheet.tsx      ├── popover.tsx
├── separator.tsx   ├── textarea.tsx   └── radio-group.tsx
```

### 14.3 Layout protégé

```
┌──────────┬────────────────────────────────────┐
│ Sidebar  │  Navbar (breadcrumb, recherche,    │
│ (dark)   │  notifications, thème, langue)     │
│          ├────────────────────────────────────┤
│ Nav par  │                                    │
│ rôle     │  Contenu de la page                │
│          │                                    │
│ Logout   │                                    │
└──────────┴────────────────────────────────────┘
```

- Sidebar repliable (`sidebar-context.tsx`)
- Responsive : sidebar desktop + sheet mobile (`protected-layout-client.tsx`)
- Breadcrumb hiérarchique dans la navbar

### 14.4 Graphiques (Recharts)

| Composant | Données |
|-----------|---------|
| `appointment-chart.tsx` | RDV par mois |
| `stat-summary.tsx` | Répartition par statut |
| `rating-chart.tsx` | Satisfaction patients |
| `heart-rate-chart.tsx` | Fréquence cardiaque |
| `blood-pressure-chart.tsx` | Tension artérielle |

---

## 15. Internationalisation

### Système custom (pas de next-intl)

- Fichier de traductions : `lib/i18n.ts`
- Provider : `LanguageProvider` dans `components/providers.tsx`
- Hook : `useLanguage()` → `{ t, lang, setLang }`
- Langues : **français** (défaut) et **anglais**
- Persistance : cookie `medflow_lang`
- Composant : `language-switcher.tsx`

### Sections traduites

- Navigation sidebar
- Labels navbar et breadcrumbs
- Cartes statistiques dashboard
- Formulaires et messages d'erreur
- Module caisse

---

## 16. Structure du projet

```
medflow/
├── app/
│   ├── (auth)/                    # Pages authentification
│   │   ├── layout.tsx
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (protected)/               # Pages authentifiées
│   │   ├── layout.tsx             # Sidebar + Navbar
│   │   ├── admin/
│   │   ├── administration/
│   │   ├── cashier/
│   │   ├── doctor/
│   │   ├── nurse/
│   │   ├── patient/
│   │   ├── record/
│   │   └── notifications/
│   ├── actions/                   # Server Actions
│   │   ├── admin.ts
│   │   ├── appointment.ts
│   │   ├── cashier.ts
│   │   ├── general.ts
│   │   ├── medical.ts
│   │   ├── notification.ts
│   │   ├── patient.ts
│   │   └── payment-methods.ts
│   ├── api/                       # API Routes
│   │   ├── admin/
│   │   ├── cashier/
│   │   ├── notifications/
│   │   ├── paiements/
│   │   ├── pusher/
│   │   └── sessions-caisse/
│   ├── fonts/
│   ├── globals.css
│   ├── layout.tsx                 # Root layout (Clerk, fonts, providers)
│   └── page.tsx                   # Landing / redirect
├── components/
│   ├── appointment/               # Composants RDV
│   ├── cashier/                   # Module caisse
│   ├── charts/                    # Graphiques Recharts
│   ├── dialogs/                   # Modales (diagnostic, facture…)
│   ├── forms/                     # Formulaires (patient, médecin, RDV)
│   ├── notifications/             # Cloche notifications
│   ├── pdf/                       # Génération PDF
│   ├── settings/                  # Paramètres admin
│   ├── tables/                    # Tableaux de données
│   └── ui/                        # shadcn/ui primitives
├── lib/
│   ├── audit.ts                   # Journalisation
│   ├── db.ts                      # PrismaClient singleton
│   ├── i18n.ts                    # Traductions FR/EN
│   ├── notifications.ts           # Création + push Pusher
│   ├── permissions.ts             # RBAC helpers
│   ├── pusher.ts / pusher-client.ts
│   ├── routes.ts                  # Contrôle d'accès middleware
│   ├── schema.ts                  # Schémas Zod
│   ├── sessions-caisse.ts           # Logique sessions caisse
│   └── generated/prisma/          # Client Prisma généré
├── prisma/
│   ├── schema.prisma              # Schéma de données
│   ├── seed.ts                    # Données initiales
│   └── migrations/                # Migrations SQL
├── scripts/
│   └── migrate.ts                 # Script migration custom
├── types/
│   ├── data-types.ts              # Types métier
│   └── globals.d.ts               # Types Clerk JWT
├── utils/
│   ├── services/                  # Couche données Prisma
│   ├── roles.ts                   # Helpers rôles Clerk
│   └── index.ts
├── docs/                          # Documentation
├── memory/                        # Notes projet (agent)
├── middleware.ts                  # Auth Clerk + RBAC
├── next.config.ts
├── tailwind.config.ts
├── components.json                # Config shadcn
└── package.json
```

---

## 17. Scripts et commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run lint` | Linting Next.js |
| `npm run migrate:dev` | Migration développement |
| `npm run migrate:deploy` | Migration production |
| `npx prisma db seed` | Peupler la base |
| `npx prisma studio` | Interface visuelle BDD |
| `npx prisma generate` | Régénérer le client |

> **Note** : les scripts `dev`, `build` et `start` utilisent `NODE_OPTIONS='--dns-result-order=ipv4first'` pour éviter les problèmes DNS avec Neon.

---

## 18. Migrations de base de données

| Migration | Date | Description |
|-----------|------|-------------|
| `20260314210801_init` | Mars 2026 | Schéma initial (tous les modèles de base) |
| `20260509204022_add_notifications` | Mai 2026 | Table Notification |
| `20260512174838_add_cashier_session_and_payment_method_config` | Mai 2026 | CashierSession + PaymentMethodConfig |
| `20260514000000_update_notifications` | Mai 2026 | Types de notifications enrichis |

---

## Annexes

### A. Validation des formulaires

Schémas Zod dans `lib/schema.ts` — validation côté serveur pour :
- Patients, médecins, staff
- Rendez-vous
- Signes vitaux, diagnostics
- Facturation

### B. Fichiers de configuration

| Fichier | Rôle |
|---------|------|
| `next.config.ts` | Configuration Next.js |
| `tailwind.config.ts` | Thème Tailwind + couleurs custom |
| `components.json` | Configuration shadcn/ui |
| `prisma.config.ts` | URL directe pour migrations |
| `tsconfig.json` | Alias `@/*` → racine projet |

### C. Points d'attention techniques

1. **Enum WeekDay** : toujours passer en `.toUpperCase()` avant requête Prisma
2. **Relation Payment/Appointment** : relation 1:1 (pas un tableau)
3. **receipt_number** : champ `@unique` obligatoire à la création d'un paiement
4. **Adaptateur Neon HTTP** : `updateMany` incompatible → utiliser `$executeRaw` pour les mises à jour en masse
5. **Rôles Clerk** : stockés en minuscules dans JWT, normalisés en majuscules pour Prisma

### D. Documentation complémentaire

- `docs/medflow-documentation.html` — documentation ligne par ligne (export HTML/PDF)
- `docs/MedFlow-Documentation-Complete.pdf` — version PDF
- `memory/project_medflow.md` — notes d'architecture et bugs corrigés

---

*Documentation générée pour le projet MedFlow — Gestion électronique des dossiers patients.*
