import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

const getDirectUrl = (): string =>
  (process.env.DIRECT_URL || process.env.DATABASE_URL!)
    .replace("-pooler.", ".")
    .replace("&pgbouncer=true", "")
    .replace(/&pool_timeout=\d+/, "")
    .replace(/&connection_limit=\d+/, "");

// Prisma CLI needs a direct (non-pooled) connection for migrations and Studio
process.env.DATABASE_URL = getDirectUrl();

export default defineConfig({
  experimental: { studio: true },
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  studio: {
    adapter: async () => new PrismaNeonHTTP(getDirectUrl(), {}) as never,
  },
});
