#!/usr/bin/env node
/**
 * Génère la documentation complète MedFlow en PDF.
 * Usage: node scripts/generate-docs-pdf.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join, relative, extname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const OUT_DIR = join(ROOT, "docs");
const HTML_PATH = join(OUT_DIR, "medflow-documentation.html");
const PDF_PATH = join(OUT_DIR, "MedFlow-Documentation-Complete.pdf");

const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "lib/generated", "docs", "public",
]);
const SKIP_FILES = new Set(["next-env.d.ts"]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (SKIP_DIRS.has(entry) || rel.startsWith("lib/generated")) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry) && !SKIP_FILES.has(entry)) files.push(full);
  }
  return files.sort();
}

function explainLine(line, lineNum, filePath) {
  const trimmed = line.trim();
  if (!trimmed) return "Ligne vide (séparation visuelle du code).";
  if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*"))
    return `Commentaire : ${trimmed.replace(/^\/\/\s*|\/\*\s*|\*\s*/g, "").slice(0, 120)}`;
  if (trimmed.startsWith("import "))
    return `Import de module : charge une dépendance externe ou interne pour l'utiliser dans ce fichier.`;
  if (trimmed.startsWith("export default"))
    return `Export par défaut : composant ou fonction principale exposée à d'autres modules.`;
  if (trimmed.startsWith("export "))
    return `Export nommé : expose une fonction, type ou constante réutilisable.`;
  if (/^"use (client|server)";?$/.test(trimmed))
    return trimmed.includes("client")
      ? "Directive Next.js : ce fichier s'exécute côté navigateur (composant client)."
      : "Directive Next.js : ce fichier s'exécute uniquement côté serveur.";
  if (trimmed.startsWith("const ") && trimmed.includes("= useState"))
    return "Hook React useState : déclare un état local réactif dans le composant.";
  if (trimmed.startsWith("const ") && trimmed.includes("= useEffect"))
    return "Hook React useEffect : exécute un effet de bord au montage ou quand les dépendances changent.";
  if (trimmed.startsWith("const ") && trimmed.includes("= useCallback"))
    return "Hook React useCallback : mémorise une fonction pour éviter des re-renders inutiles.";
  if (trimmed.startsWith("const ") && trimmed.includes("= useContext"))
    return "Hook React useContext : lit une valeur depuis un contexte React parent.";
  if (trimmed.startsWith("async function") || /^export async function/.test(trimmed))
    return "Fonction asynchrone : peut utiliser await pour des opérations (BDD, API, etc.).";
  if (trimmed.startsWith("function ") || /^const \w+ = \([^)]*\) =>/.test(trimmed))
    return "Définition de fonction : bloc de logique réutilisable.";
  if (trimmed.startsWith("return "))
    return "Retour de valeur : renvoie un résultat (JSX, objet, booléen…) à l'appelant.";
  if (trimmed.startsWith("if ") || trimmed.startsWith("} else"))
    return "Condition : branchement selon une expression booléenne.";
  if (trimmed.startsWith("try ") || trimmed === "try {")
    return "Bloc try : tente une opération pouvant échouer (erreurs capturées dans catch).";
  if (trimmed.startsWith("catch "))
    return "Bloc catch : gère les erreurs levées dans le try associé.";
  if (trimmed.startsWith("await "))
    return "Await : attend la résolution d'une Promise avant de continuer.";
  if (trimmed.includes("db.") || trimmed.includes("prisma"))
    return "Requête Prisma : interaction avec la base de données PostgreSQL (Neon).";
  if (trimmed.includes("auth()") || trimmed.includes("useAuth"))
    return "Authentification Clerk : récupère l'utilisateur connecté ou sa session.";
  if (trimmed.includes("NextResponse") || trimmed.includes("redirect("))
    return "Réponse ou redirection Next.js : contrôle le flux HTTP ou la navigation.";
  if (trimmed.includes("creerNotification") || trimmed.includes("pusher"))
    return "Notification temps réel : crée ou diffuse une notification via Pusher.";
  if (trimmed.includes("logAudit"))
    return "Audit : enregistre l'action utilisateur dans les journaux d'audit.";
  if (trimmed.startsWith("<") || trimmed.startsWith("</"))
    return "JSX : élément ou composant React rendu dans l'interface utilisateur.";
  if (trimmed.startsWith("className="))
    return "Classes Tailwind CSS : style et mise en page du composant.";
  if (trimmed === "}" || trimmed === "};" || trimmed === "});")
    return "Fermeture de bloc (fonction, objet, hook, JSX…).";
  if (trimmed.startsWith("interface ") || trimmed.startsWith("type "))
    return "Définition de type TypeScript : contrat de structure des données.";
  if (trimmed.startsWith("enum "))
    return "Énumération TypeScript : ensemble de constantes nommées.";
  if (filePath.includes("schema.prisma") && trimmed.startsWith("model "))
    return "Modèle Prisma : table de la base de données et ses relations.";
  return "Instruction ou expression du langage (TypeScript/JSX).";
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderFileSection(filePath) {
  const rel = relative(ROOT, filePath);
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const rows = lines
    .map((line, i) => {
      const num = i + 1;
      const exp = explainLine(line, num, rel);
      return `<tr>
        <td class="ln">${num}</td>
        <td class="code"><pre>${escapeHtml(line || " ")}</pre></td>
        <td class="exp">${escapeHtml(exp)}</td>
      </tr>`;
    })
    .join("\n");

  return `
    <section class="file-section" id="${rel.replace(/[^a-zA-Z0-9]/g, "-")}">
      <h2>${escapeHtml(rel)}</h2>
      <p class="meta">${lines.length} lignes · ${extname(filePath).slice(1).toUpperCase()}</p>
      <table class="code-table">
        <thead><tr><th>#</th><th>Code</th><th>Explication</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

const overview = `
<h1>MedFlow — Documentation technique complète</h1>
<p class="subtitle">Système de gestion électronique des dossiers patients (GEDP)</p>
<p><strong>Date :</strong> ${new Date().toLocaleDateString("fr-FR", { dateStyle: "full" })}</p>

<h2>1. Vue d'ensemble</h2>
<p>MedFlow est une application web de gestion hospitalière construite avec <strong>Next.js 15</strong> (App Router), <strong>React 18</strong>, <strong>TypeScript</strong>, <strong>Prisma 6</strong> et <strong>PostgreSQL</strong> (Neon serverless). L'authentification est gérée par <strong>Clerk</strong> avec un contrôle d'accès par rôles (RBAC).</p>

<h3>1.1 Stack technique</h3>
<ul>
  <li><strong>Frontend :</strong> React, Tailwind CSS, shadcn/ui (Radix), Recharts, next-themes</li>
  <li><strong>Backend :</strong> Next.js Server Actions, API Routes, Prisma ORM</li>
  <li><strong>Base de données :</strong> PostgreSQL via Neon (adaptateur HTTP @prisma/adapter-neon)</li>
  <li><strong>Auth :</strong> Clerk — rôles dans sessionClaims.metadata.role</li>
  <li><strong>Temps réel :</strong> Pusher (notifications push)</li>
  <li><strong>PDF :</strong> @react-pdf/renderer (factures)</li>
  <li><strong>Validation :</strong> Zod + React Hook Form</li>
  <li><strong>i18n :</strong> Contexte React custom FR/EN</li>
</ul>

<h3>1.2 Rôles utilisateurs</h3>
<table class="summary-table">
  <tr><th>Rôle Clerk</th><th>Dashboard</th><th>Permissions principales</th></tr>
  <tr><td>admin</td><td>/admin</td><td>Gestion complète : utilisateurs, médecins, staff, paramètres, audit</td></tr>
  <tr><td>doctor</td><td>/doctor</td><td>RDV, diagnostics, dossiers médicaux, patients</td></tr>
  <tr><td>patient</td><td>/patient</td><td>Profil, RDV, ordonnances, évaluations</td></tr>
  <tr><td>nurse</td><td>/nurse</td><td>Patients, médicaments, dossiers</td></tr>
  <tr><td>cashier</td><td>/cashier/dashboard</td><td>Sessions de caisse, encaissements</td></tr>
  <tr><td>lab technician</td><td>—</td><td>Accès staff, examens laboratoire</td></tr>
</table>

<h3>1.3 Flux d'authentification et routage</h3>
<ol>
  <li><code>middleware.ts</code> intercepte chaque requête (sauf assets statiques)</li>
  <li>Clerk vérifie la session et extrait le rôle JWT</li>
  <li><code>lib/routes.ts</code> définit quels rôles accèdent à quelles routes</li>
  <li>Si non autorisé → redirection vers <code>/{role}</code></li>
  <li>Page d'accueil <code>/</code> : connecté → dashboard du rôle, sinon landing</li>
</ol>

<h3>1.4 Architecture des couches</h3>
<pre class="diagram">
Navigateur (React Client Components)
    ↓ fetch / hooks
API Routes (/app/api/*)  +  Server Actions (/app/actions/*)
    ↓
lib/* (notifications, audit, permissions, sessions-caisse)
utils/services/* (requêtes Prisma métier)
    ↓
lib/db.ts (PrismaClient + adaptateur Neon HTTP)
    ↓
PostgreSQL (Neon)
</pre>

<h3>1.5 Modèles de données principaux</h3>
<ul>
  <li><strong>Patient</strong> — dossier patient (id = Clerk userId)</li>
  <li><strong>Doctor / Staff</strong> — personnel médical et administratif</li>
  <li><strong>Appointment</strong> — rendez-vous (PENDING → SCHEDULED → COMPLETED/CANCELLED)</li>
  <li><strong>MedicalRecords</strong> — dossier par RDV (signes vitaux, diagnostics, lab)</li>
  <li><strong>Payment / PatientBills</strong> — facturation liée au RDV</li>
  <li><strong>CashierSession</strong> — sessions de caisse (ouverture/clôture)</li>
  <li><strong>Notification</strong> — notifications temps réel</li>
  <li><strong>AuditLog</strong> — traçabilité des actions</li>
</ul>

<h3>1.6 Routes API</h3>
<ul>
  <li>GET/PATCH/DELETE <code>/api/notifications</code> — gestion notifications</li>
  <li>POST <code>/api/pusher/auth</code> — auth canaux privés Pusher</li>
  <li>GET/POST/PATCH <code>/api/sessions-caisse/*</code> — sessions caisse</li>
  <li>GET/PATCH <code>/api/cashier/*</code> — encaissements caissier</li>
  <li>GET <code>/api/paiements/[id]/pdf</code> — téléchargement facture PDF</li>
</ul>

<h2>2. Documentation ligne par ligne</h2>
<p>Chaque fichier source du projet est documenté ci-dessous avec une explication pour chaque ligne de code.</p>
`;

mkdirSync(OUT_DIR, { recursive: true });

const sourceFiles = walk(ROOT);
const prismaSchema = join(ROOT, "prisma", "schema.prisma");
if (!sourceFiles.includes(prismaSchema)) sourceFiles.push(prismaSchema);
sourceFiles.sort();

console.log(`Génération de la documentation pour ${sourceFiles.length} fichiers...`);

const fileSections = sourceFiles.map(renderFileSection).join("\n");

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>MedFlow — Documentation complète</title>
  <style>
    @page { margin: 15mm 12mm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 9pt;
      line-height: 1.4;
      color: #1a1a2e;
      max-width: 100%;
      margin: 0;
      padding: 16px;
    }
    h1 { font-size: 22pt; color: #0f766e; border-bottom: 3px solid #0f766e; padding-bottom: 8px; }
    h2 { font-size: 13pt; color: #134e4a; margin-top: 24px; page-break-after: avoid; }
    h3 { font-size: 11pt; color: #115e59; }
    .subtitle { font-size: 12pt; color: #64748b; margin-top: -8px; }
    .file-section { page-break-before: always; }
    .file-section:first-of-type { page-break-before: auto; }
    .meta { color: #64748b; font-size: 8pt; margin-bottom: 8px; }
    .code-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
    .code-table th { background: #0f766e; color: white; padding: 4px 6px; text-align: left; }
    .code-table td { border: 1px solid #e2e8f0; vertical-align: top; padding: 2px 4px; }
    .code-table tr:nth-child(even) { background: #f8fafc; }
    .ln { width: 28px; text-align: right; color: #94a3b8; font-family: monospace; }
    .code { width: 42%; }
    .code pre { margin: 0; white-space: pre-wrap; word-break: break-all; font-family: "Consolas", monospace; font-size: 7pt; }
    .exp { width: 48%; color: #475569; }
    .summary-table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    .summary-table th, .summary-table td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
    .summary-table th { background: #f1f5f9; }
    .diagram { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; font-family: monospace; font-size: 8pt; white-space: pre; }
    code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 8pt; }
    ul, ol { padding-left: 20px; }
    li { margin-bottom: 4px; }
  </style>
</head>
<body>
${overview}
${fileSections}
<footer style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:8pt;">
  MedFlow Documentation — ${sourceFiles.length} fichiers — Généré automatiquement le ${new Date().toISOString()}
</footer>
</body>
</html>`;

writeFileSync(HTML_PATH, html);
console.log(`HTML écrit : ${HTML_PATH}`);

// Convertir en PDF avec Chrome headless
try {
  execSync(
    `google-chrome --headless --disable-gpu --no-sandbox --print-to-pdf="${PDF_PATH}" --no-pdf-header-footer "file://${HTML_PATH}"`,
    { stdio: "inherit", timeout: 300000 }
  );
  console.log(`\n✅ PDF généré : ${PDF_PATH}`);
} catch (e) {
  console.error("Échec conversion PDF Chrome, HTML disponible :", HTML_PATH);
  process.exit(1);
}
