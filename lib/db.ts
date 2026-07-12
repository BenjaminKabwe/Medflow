import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

// Le driver Neon en mode WebSocket (Pool) supporte les transactions
// interactives (db.$transaction), contrairement au mode HTTP.
// Node 22+ expose WebSocket en global ; on le fournit au driver.
if (!neonConfig.webSocketConstructor) {
  neonConfig.webSocketConstructor = WebSocket;
}

const prismaClientSingleton = () => {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = db;
