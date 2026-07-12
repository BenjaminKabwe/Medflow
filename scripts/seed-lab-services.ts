import "dotenv/config";
import db from "../lib/db";

// Catalogue d'analyses courant — contexte hôpital à Kinshasa (prix en FC).
const LAB_SERVICES: {
  service_name: string;
  description: string;
  price: number;
}[] = [
  { service_name: "Hémogramme (NFS)", description: "Numération formule sanguine complète.", price: 15000 },
  { service_name: "Glycémie à jeun", description: "Dosage du glucose sanguin à jeun.", price: 8000 },
  { service_name: "Goutte épaisse (Paludisme)", description: "Recherche de Plasmodium (paludisme).", price: 10000 },
  { service_name: "Test de Widal", description: "Sérodiagnostic de la fièvre typhoïde.", price: 12000 },
  { service_name: "Groupe sanguin & Rhésus", description: "Détermination du groupe ABO et du facteur Rhésus.", price: 9000 },
  { service_name: "Test VIH", description: "Dépistage sérologique du VIH.", price: 11000 },
  { service_name: "Créatininémie", description: "Évaluation de la fonction rénale.", price: 9000 },
  { service_name: "Transaminases (ASAT/ALAT)", description: "Bilan hépatique.", price: 14000 },
  { service_name: "Examen d'urine (ECBU)", description: "Examen cytobactériologique des urines.", price: 13000 },
  { service_name: "Test de grossesse (β-hCG)", description: "Dosage de l'hormone de grossesse.", price: 8000 },
  { service_name: "Ionogramme sanguin", description: "Dosage des électrolytes (Na, K, Cl).", price: 16000 },
  { service_name: "Selles (coproculture)", description: "Recherche de parasites et bactéries.", price: 12000 },
];

async function main() {
  let created = 0;
  for (const s of LAB_SERVICES) {
    await db.services.upsert({
      where: { service_name: s.service_name },
      update: { category: "LABORATORY", description: s.description, price: s.price },
      create: { ...s, category: "LABORATORY" },
    });
    created += 1;
  }
  const total = await db.services.count({ where: { category: "LABORATORY" } });
  console.log(`Seed labo OK : ${created} services traités, ${total} analyses en catalogue.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed labo échec:", e);
    process.exit(1);
  });
