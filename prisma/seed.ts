import "dotenv/config";
import { Prisma, PrismaClient, PaymentMethod, MedicationForm } from "@prisma/client";
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
// PHARMACIE — fournisseurs & catalogue médicaments courants (contexte RDC)
// ─────────────────────────────────────────────────────────────────────────────

const suppliers: Array<{
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
}> = [
  {
    name: "PharmaKin Distribution",
    contact_person: "Christian Mbuyi",
    email: "contact@pharmakin.cd",
    phone: "+243 810 000 001",
    address: "Avenue du Commerce 12, Kinshasa/Gombe",
    tax_id: "A0801234N",
  },
  {
    name: "SOCOPHARMA",
    contact_person: "Nadine Ilunga",
    email: "commandes@socopharma.cd",
    phone: "+243 820 000 002",
    address: "Boulevard du 30 Juin 88, Kinshasa/Gombe",
    tax_id: "A0805678M",
  },
];

const medications: Array<{
  name: string;
  dci: string;
  form: MedicationForm;
  dosage: string;
  unit: string;
  category: string;
  prescription_required: boolean;
  reorder_level: number;
  unit_cost: number;
  selling_price: number;
  initial_quantity: number;
  expiry_months: number;
}> = [
  { name: "Paracétamol Denk", dci: "Paracétamol", form: MedicationForm.COMPRIME, dosage: "500 mg", unit: "boîte de 20", category: "Antalgique",  prescription_required: false, reorder_level: 30, unit_cost: 1500, selling_price: 2500, initial_quantity: 120, expiry_months: 24 },
  { name: "Ibuprofène Cinfa",  dci: "Ibuprofène",  form: MedicationForm.COMPRIME, dosage: "400 mg", unit: "boîte de 20", category: "AINS",        prescription_required: false, reorder_level: 25, unit_cost: 2500, selling_price: 4000, initial_quantity: 80,  expiry_months: 24 },
  { name: "Amoxicilline Sandoz", dci: "Amoxicilline", form: MedicationForm.GELULE, dosage: "500 mg", unit: "boîte de 16", category: "Antibiotique", prescription_required: true, reorder_level: 20, unit_cost: 3500, selling_price: 5500, initial_quantity: 60, expiry_months: 18 },
  { name: "Coartem",           dci: "Artéméther + Luméfantrine", form: MedicationForm.COMPRIME, dosage: "20 mg / 120 mg", unit: "boîte de 24", category: "Antipaludique", prescription_required: true, reorder_level: 40, unit_cost: 4000, selling_price: 6500, initial_quantity: 150, expiry_months: 24 },
  { name: "SRO OMS",           dci: "Sels de réhydratation orale", form: MedicationForm.SACHET, dosage: "20,5 g / L", unit: "sachet", category: "Réhydratation", prescription_required: false, reorder_level: 50, unit_cost: 500, selling_price: 1000, initial_quantity: 200, expiry_months: 24 },
  { name: "Bactrim",           dci: "Sulfaméthoxazole + Triméthoprime", form: MedicationForm.COMPRIME, dosage: "400 mg / 80 mg", unit: "boîte de 20", category: "Antibiotique", prescription_required: true, reorder_level: 20, unit_cost: 3000, selling_price: 4800, initial_quantity: 50, expiry_months: 18 },
  { name: "Flagyl",            dci: "Métronidazole", form: MedicationForm.COMPRIME, dosage: "500 mg", unit: "boîte de 20", category: "Antibactérien", prescription_required: true, reorder_level: 20, unit_cost: 2500, selling_price: 4000, initial_quantity: 45, expiry_months: 24 },
  { name: "Mopral",            dci: "Oméprazole",    form: MedicationForm.GELULE,   dosage: "20 mg", unit: "boîte de 14", category: "IPP", prescription_required: true, reorder_level: 15, unit_cost: 4500, selling_price: 7000, initial_quantity: 40, expiry_months: 24 },
  { name: "Ventoline",         dci: "Salbutamol",    form: MedicationForm.INHALATEUR, dosage: "100 µg/dose", unit: "aérosol", category: "Bronchodilatateur", prescription_required: true, reorder_level: 10, unit_cost: 8000, selling_price: 12500, initial_quantity: 20, expiry_months: 18 },
  { name: "Actrapid",          dci: "Insuline humaine rapide", form: MedicationForm.INJECTION, dosage: "100 UI/mL", unit: "flacon 10 mL", category: "Antidiabétique", prescription_required: true, reorder_level: 8,  unit_cost: 15000, selling_price: 22000, initial_quantity: 15, expiry_months: 12 },
  { name: "Solupred",          dci: "Prednisolone",  form: MedicationForm.COMPRIME, dosage: "20 mg", unit: "boîte de 20", category: "Corticoïde", prescription_required: true, reorder_level: 15, unit_cost: 3500, selling_price: 5500, initial_quantity: 30, expiry_months: 24 },
  { name: "Rocéphine",         dci: "Ceftriaxone",   form: MedicationForm.INJECTION, dosage: "1 g", unit: "flacon", category: "Antibiotique", prescription_required: true, reorder_level: 20, unit_cost: 5000, selling_price: 8000, initial_quantity: 50, expiry_months: 18 },
  { name: "Vibramycine",       dci: "Doxycycline",   form: MedicationForm.GELULE,   dosage: "100 mg", unit: "boîte de 20", category: "Antibiotique", prescription_required: true, reorder_level: 15, unit_cost: 3000, selling_price: 5000, initial_quantity: 35, expiry_months: 24 },
  { name: "Quinimax",          dci: "Quinine",       form: MedicationForm.COMPRIME, dosage: "500 mg", unit: "boîte de 10", category: "Antipaludique", prescription_required: true, reorder_level: 15, unit_cost: 3500, selling_price: 5500, initial_quantity: 30, expiry_months: 24 },
  { name: "Doliprane sirop",   dci: "Paracétamol",   form: MedicationForm.SIROP,    dosage: "2,4 %", unit: "flacon 100 mL", category: "Antalgique pédiatrique", prescription_required: false, reorder_level: 20, unit_cost: 2000, selling_price: 3500, initial_quantity: 60, expiry_months: 24 },
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

  // Pharmacie — fournisseurs
  console.log("\n🏭  Fournisseurs pharmacie…");
  const supplierMap = new Map<string, number>();
  for (const s of suppliers) {
    const record = await prisma.supplier.upsert({
      where: { name: s.name },
      update: {
        contact_person: s.contact_person,
        email: s.email,
        phone: s.phone,
        address: s.address,
        tax_id: s.tax_id,
        is_active: true,
      },
      create: { ...s, is_active: true },
    });
    supplierMap.set(s.name, record.id);
    console.log(`   [${String(record.id).padStart(3)}]  ${record.name}`);
  }

  // Pharmacie — catalogue + un lot par médicament
  console.log("\n💊  Catalogue médicaments + stocks initiaux…");
  const defaultSupplierId = supplierMap.get("PharmaKin Distribution")!;
  for (const m of medications) {
    const med = await prisma.medication.upsert({
      where: { dci_dosage_form: { dci: m.dci, dosage: m.dosage, form: m.form } },
      update: {
        name: m.name,
        unit: m.unit,
        category: m.category,
        prescription_required: m.prescription_required,
        reorder_level: m.reorder_level,
        is_active: true,
      },
      create: {
        name: m.name,
        dci: m.dci,
        form: m.form,
        dosage: m.dosage,
        unit: m.unit,
        category: m.category,
        prescription_required: m.prescription_required,
        reorder_level: m.reorder_level,
        is_active: true,
      },
    });

    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + m.expiry_months);
    const batchNumber = `LOT-${new Date().getFullYear()}-${String(med.id).padStart(4, "0")}`;

    await prisma.medicationStock.upsert({
      where: {
        medication_id_batch_number: {
          medication_id: med.id,
          batch_number: batchNumber,
        },
      },
      update: {
        quantity: m.initial_quantity,
        unit_cost: m.unit_cost,
        selling_price: m.selling_price,
        expiry_date: expiry,
        supplier_id: defaultSupplierId,
      },
      create: {
        medication_id: med.id,
        batch_number: batchNumber,
        quantity: m.initial_quantity,
        unit_cost: m.unit_cost,
        selling_price: m.selling_price,
        expiry_date: expiry,
        supplier_id: defaultSupplierId,
      },
    });

    console.log(
      `   [${String(med.id).padStart(3)}]  ${m.name.padEnd(22)} ${m.dosage.padEnd(18)} qty=${m.initial_quantity}`
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
