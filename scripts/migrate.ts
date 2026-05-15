/**
 * Custom migration runner for Neon serverless.
 *
 * Prisma's Rust migration engine needs raw TCP on port 5432, which is blocked
 * in some environments. This script uses @neondatabase/serverless in WebSocket
 * mode (WSS port 443) to apply migrations and track them in _prisma_migrations.
 *
 * Usage:
 *   migrate:dev    → detect schema changes, create + apply migration
 *   migrate:deploy → apply pending migration files only
 */

import "dotenv/config";
import { Client, neonConfig } from "@neondatabase/serverless";
import { execSync } from "child_process";
import {
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  existsSync,
} from "fs";
import path from "path";
import crypto from "crypto";

// Node.js 21+ has WebSocket built-in; WSS goes over port 443, not 5432.
neonConfig.webSocketConstructor = WebSocket;

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma/migrations");
const DB_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;

async function connect() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  return client;
}

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id                   VARCHAR(36)  NOT NULL PRIMARY KEY,
      checksum             VARCHAR(64)  NOT NULL,
      finished_at          TIMESTAMPTZ,
      migration_name       VARCHAR(255) NOT NULL,
      logs                 TEXT,
      rolled_back_at       TIMESTAMPTZ,
      started_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
      applied_steps_count  INTEGER      NOT NULL DEFAULT 0
    )
  `);
}

async function getApplied(client: Client): Promise<Set<string>> {
  const { rows } = await client.query(
    "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL"
  );
  return new Set(rows.map((r: any) => r.migration_name));
}

function getMigrationFolders(): string[] {
  if (!existsSync(MIGRATIONS_DIR)) return [];
  return readdirSync(MIGRATIONS_DIR)
    .filter(
      (e) =>
        e !== "migration_lock.toml" &&
        existsSync(path.join(MIGRATIONS_DIR, e, "migration.sql"))
    )
    .sort();
}

async function applyMigration(
  client: Client,
  name: string,
  sqlContent: string
) {
  const id = crypto.randomUUID();
  const checksum = crypto
    .createHash("sha256")
    .update(sqlContent)
    .digest("hex");

  await client.query(
    `INSERT INTO _prisma_migrations (id, checksum, started_at, migration_name, applied_steps_count)
    VALUES ($1, $2, NOW(), $3, 0)`,
    [id, checksum, name]
  );

  try {
    await client.query("BEGIN");
    await client.query(sqlContent);
    await client.query("COMMIT");
    await client.query(
      `UPDATE _prisma_migrations SET finished_at = NOW(), applied_steps_count = 1 WHERE id = $1`,
      [id]
    );
    console.log(`  ✓ ${name}`);
  } catch (err) {
    await client.query("ROLLBACK");
    await client.query(
      `UPDATE _prisma_migrations SET logs = $1, rolled_back_at = NOW() WHERE id = $2`,
      [String(err), id]
    );
    throw err;
  }
}

function generateDiff(): string {
  try {
    const out = execSync(
      `npx prisma migrate diff --from-migrations ${MIGRATIONS_DIR} --to-schema-datamodel prisma/schema.prisma --script 2>&1`,
      { encoding: "utf-8", stdio: "pipe" }
    ).trim();
    return out.startsWith("-- This is an empty migration") ? "" : out;
  } catch {
    return "";
  }
}

function createMigrationFile(name: string, sqlContent: string): string {
  const ts = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);
  const dir = `${ts}_${name.replace(/\s+/g, "_").toLowerCase()}`;
  const dirPath = path.join(MIGRATIONS_DIR, dir);
  mkdirSync(dirPath, { recursive: true });
  writeFileSync(path.join(dirPath, "migration.sql"), sqlContent + "\n");
  return dir;
}

async function main() {
  const isDeploy = process.argv.includes("--deploy");
  const nameArg =
    process.argv[process.argv.indexOf("--name") + 1] ?? "migration";

  console.log("Connecting via WebSocket…");
  const client = await connect();

  try {
    await ensureMigrationsTable(client);

    if (!isDeploy) {
      process.stdout.write("Checking for schema changes… ");
      const diff = generateDiff();

      if (diff) {
        const dir = createMigrationFile(nameArg, diff);
        console.log(`new migration created: ${dir}`);
      } else {
        console.log("no changes.");
      }
    }

    const applied = await getApplied(client);
    const pending = getMigrationFolders().filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log("Database is up to date.");
    } else {
      console.log(`Applying ${pending.length} migration(s):`);
      for (const name of pending) {
        const sql = readFileSync(
          path.join(MIGRATIONS_DIR, name, "migration.sql"),
          "utf-8"
        );
        await applyMigration(client, name, sql);
      }
      console.log("Done.");
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
