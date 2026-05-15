import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

// DATABASE_URL points to the PgBouncer pooled endpoint — strip it to get the
// direct endpoint required by the Neon serverless HTTP adapter.
const getDirectUrl = () =>
  process.env.DATABASE_URL!
    .replace("-pooler.", ".")
    .replace("&pgbouncer=true", "")
    .replace(/&pool_timeout=\d+/, "")
    .replace(/&connection_limit=\d+/, "");

const prismaClientSingleton = () => {
  const adapter = new PrismaNeonHTTP(getDirectUrl(), {});
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = db;
