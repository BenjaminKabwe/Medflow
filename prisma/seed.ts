import "dotenv/config";
import { Prisma, PrismaClient, PaymentMethod } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

const getDirectUrl = () =>
  process.env.DATABASE_URL!.replace("-pooler.", ".")
    .replace("&pgbouncer=true", "")
    .replace(/&pool_timeout=\d+/, "")
    .replace(/&connection_limit=\d+/, "");

const adapter = new PrismaNeonHTTP(getDirectUrl(), {});
const prisma = new PrismaClient({ adapter } as never);

// ─────────────────────────────────────────────────────────────────────────────
// Données de seed — contexte hôpital à Kinshasa, RDC
// ─────────────────────────────────────────────────────────────────────────────

const paymentMethodConfigs: {
  method: PaymentMethod;
  label: string;
  description: string;
  icon: string;
  isActive: boolean;
  fees: number;
  metadata: object | null;
}[] = [
  {
    method: PaymentMethod.CASH,
    label: "Espèces",
    description:
      "Paiement en argent liquide (francs congolais ou dollars US) directement au guichet de la caisse.",
    icon: "Banknote",
    isActive: true,
    fees: 0,
    metadata: {
      currencies: ["CDF", "USD"],
      note: "Le caissier remet systématiquement un reçu signé et tamponné.",
    },
  },
  {
    method: PaymentMethod.CARD,
    label: "Carte bancaire",
    description:
      "Paiement par carte de débit ou de crédit via terminal de paiement électronique (TPE).",
    icon: "CreditCard",
    isActive: true,
    fees: 0,
    metadata: {
      networks: ["Visa", "Mastercard"],
      currencies: ["USD", "CDF"],
      tpeAvailable: true,
    },
  },
  {
    method: PaymentMethod.MOBILE_MONEY,
    label: "Mobile Money",
    description:
      "Paiement via portefeuille mobile. Transfert vers le numéro marchand de l'hôpital.",
    icon: "Smartphone",
    isActive: true,
    fees: 1.5,
    metadata: {
      merchantNumber: "0820000000",
      operators: [
        {
          code: "airtel",
          name: "Airtel Money",
          ussd: "*555#",
          logo: "airtel-money",
          active: true,
        },
        {
          code: "orange",
          name: "Orange Money",
          ussd: "*144#",
          logo: "orange-money",
          active: true,
        },
        {
          code: "mpesa",
          name: "M-Pesa (Vodacom)",
          ussd: "*150*00#",
          logo: "mpesa",
          active: true,
        },
      ],
      instructions:
        "Le patient effectue le transfert depuis son téléphone et présente la confirmation SMS au caissier.",
    },
  },
  {
    method: PaymentMethod.INSURANCE,
    label: "Assurance maladie",
    description:
      "Prise en charge partielle ou totale par un organisme d'assurance. Présentation de la carte d'assuré obligatoire.",
    icon: "Shield",
    isActive: true,
    fees: 0,
    metadata: {
      requiresApproval: true,
      claimDeadlineDays: 30,
      providers: [
        {
          code: "cnss",
          name: "CNSS (Caisse Nationale de Sécurité Sociale)",
          coveragePercent: 80,
          active: true,
        },
        {
          code: "sonas",
          name: "SONAS (Société Nationale d'Assurances)",
          coveragePercent: 70,
          active: true,
        },
        {
          code: "activa",
          name: "Activa Assurances",
          coveragePercent: 100,
          active: true,
        },
        {
          code: "sanlam",
          name: "Sanlam Assurances Congo",
          coveragePercent: 90,
          active: true,
        },
        {
          code: "jubilee",
          name: "Jubilee Insurance RDC",
          coveragePercent: 85,
          active: true,
        },
        {
          code: "rawsur",
          name: "RawSur",
          coveragePercent: 75,
          active: false,
        },
      ],
    },
  },
  {
    method: PaymentMethod.BANK_TRANSFER,
    label: "Virement bancaire",
    description:
      "Virement depuis un compte bancaire vers le compte de l'hôpital. Délai de validation : 24 à 48 h ouvrables.",
    icon: "Building2",
    isActive: true,
    fees: 0,
    metadata: {
      hospitalAccount: {
        bank: "Rawbank",
        iban: "CD00 0000 0000 0000 0000 0000",
        swift: "RAWBCDKI",
        accountName: "Hôpital MedFlow",
      },
      banks: [
        { code: "rawbank", name: "Rawbank", active: true },
        { code: "equity", name: "Equity BCDC", active: true },
        { code: "tmb", name: "Trust Merchant Bank (TMB)", active: true },
        {
          code: "uba",
          name: "United Bank for Africa (UBA)",
          active: true,
        },
        { code: "stanbic", name: "Stanbic Bank Congo", active: true },
        { code: "fbn", name: "FBNBank Congo", active: false },
      ],
      processingNote:
        "Joindre la preuve de virement (relevé ou capture d'écran) pour validation immédiate.",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Démarrage du seed MedFlow…\n");

  // PaymentMethodConfig — upsert idempotent sur method (clé unique)
  console.log("📋  PaymentMethodConfig…");
  for (const config of paymentMethodConfigs) {
    const record = await prisma.paymentMethodConfig.upsert({
      where: { method: config.method },
      update: {
        label: config.label,
        description: config.description,
        icon: config.icon,
        isActive: config.isActive,
        fees: config.fees,
        metadata: config.metadata === null ? Prisma.JsonNull : (config.metadata as Prisma.InputJsonValue),
      },
      create: {
        ...config,
        metadata: config.metadata === null ? Prisma.JsonNull : (config.metadata as Prisma.InputJsonValue),
      },
    });
    const status = config.isActive ? "✅ actif" : "⏸  inactif";
    console.log(
      `   [${record.method.padEnd(14)}]  ${record.label.padEnd(20)} — ${status}  (frais : ${config.fees > 0 ? `${config.fees} %` : "aucun"})`
    );
  }

  console.log("\n✔  Seed terminé avec succès.");
}

main()
  .catch((e) => {
    console.error("❌  Erreur durant le seed :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
