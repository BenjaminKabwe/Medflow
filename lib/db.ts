import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

// Le driver Neon en mode WebSocket (Pool) supporte les transactions
// interactives (db.$transaction), contrairement au mode HTTP.
// Node 22+ expose WebSocket en global ; on le fournit au driver.
if (!neonConfig.webSocketConstructor) {
  neonConfig.webSocketConstructor = WebSocket;
}

// Les requêtes simples (count/findMany hors transaction) passent par
// l'endpoint HTTP de Neon plutôt que par le WebSocket. C'est indispensable
// pour la revalidation en arrière-plan d'`unstable_cache` : celle-ci s'exécute
// hors d'une requête vivante, où l'ouverture d'un WebSocket échoue
// (ErrorEvent). L'HTTP est sans état, plus rapide (pas de handshake) et fiable
// dans ce contexte. Les transactions interactives continuent d'utiliser le WS.
neonConfig.poolQueryViaFetch = true;

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
