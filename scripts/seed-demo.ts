import "dotenv/config";
import db from "../lib/db";

/**
 * Seed de DÉMONSTRATION — remplit tous les modules avec des données cohérentes
 * (contexte hôpital à Kinshasa) pour une soutenance. Rejouable : supprime
 * d'abord toutes les entités préfixées « demo_ » (cascade FK patient).
 *
 *   NODE_OPTIONS='--dns-result-order=ipv6first' npx tsx scripts/seed-demo.ts
 */

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (d: number) =>
  new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d: number) =>
  new Date(Date.now() + d * 24 * 60 * 60 * 1000);

const FIRST_M = ["Jean", "Patrick", "Gédéon", "Emmanuel", "Christian", "Serge", "Blaise", "Dieudonné"];
const FIRST_F = ["Marie", "Grâce", "Esther", "Nadège", "Cathy", "Bernadette", "Chantal", "Divine"];
const LAST = ["Mbuyi", "Kabongo", "Ilunga", "Tshibangu", "Kasongo", "Mukendi", "Nkulu", "Lukusa", "Mwamba", "Kalala", "Ngoy", "Banza", "Kabeya", "Mutombo", "Kanku"];
const COMMUNES = ["Gombe", "Lemba", "Limete", "Ngaliema", "Matete", "Kalamu", "Bandalungwa", "Masina"];
const BLOOD = ["O+", "A+", "B+", "AB+", "O-", "A-"];

const DIAGNOSES = [
  { s: "Fièvre, frissons, céphalées depuis 3 jours", d: "Paludisme simple à Plasmodium falciparum", f: "Contrôle goutte épaisse à J3" },
  { s: "Fièvre prolongée, douleurs abdominales, diarrhée", d: "Fièvre typhoïde", f: "Repos, hydratation, réévaluation à 5 jours" },
  { s: "Céphalées, vertiges, TA élevée", d: "Hypertension artérielle stade 1", f: "Régime hyposodé, contrôle TA hebdomadaire" },
  { s: "Toux productive, fièvre, douleur thoracique", d: "Infection respiratoire basse", f: "Réévaluation clinique à 7 jours" },
  { s: "Diarrhée aqueuse, vomissements, déshydratation légère", d: "Gastro-entérite aiguë", f: "SRO, surveillance de l'hydratation" },
  { s: "Polyurie, polydipsie, amaigrissement", d: "Diabète sucré de type 2 nouvellement diagnostiqué", f: "Éducation nutritionnelle, contrôle glycémie" },
  { s: "Brûlures mictionnelles, pollakiurie", d: "Infection urinaire basse", f: "ECBU de contrôle après traitement" },
  { s: "Douleurs articulaires, fièvre modérée", d: "Arthralgie fébrile d'origine virale", f: "Antalgiques, repos" },
];

const LAB_RESULTS: Record<string, string[]> = {
  "Hémogramme (NFS)": ["GB 7.2 G/L, Hb 12.8 g/dL, Plaquettes 240 G/L — normal", "GB 11.4 G/L (hyperleucocytose), Hb 11.2 g/dL, Plaquettes 180 G/L"],
  "Glycémie à jeun": ["0.92 g/L — normale", "1.48 g/L — hyperglycémie, à recontrôler"],
  "Goutte épaisse (Paludisme)": ["Positive — Plasmodium falciparum, densité +++", "Négative"],
  "Test de Widal": ["TO 1/160, TH 1/320 — évocateur de typhoïde", "Négatif"],
  "Créatininémie": ["9 mg/L — fonction rénale normale", "14 mg/L — légèrement élevée"],
  "Examen d'urine (ECBU)": ["Leucocytes +++, présence d'E. coli > 10^5 UFC/mL", "Stérile, absence de germe"],
  "Test VIH": ["Négatif", "Négatif"],
  "Ionogramme sanguin": ["Na 139, K 4.1, Cl 102 mmol/L — normal", "Na 133, K 3.2 mmol/L — hypokaliémie modérée"],
};

async function main() {
  // 1) Nettoyage des données de démo précédentes (cascade via patient)
  const prior = await db.patient.findMany({
    where: { id: { startsWith: "demo_" } },
    select: { id: true },
  });
  if (prior.length) {
    await db.patient.deleteMany({ where: { id: { startsWith: "demo_" } } });
    console.log(`Nettoyage : ${prior.length} patient(s) démo supprimé(s) (cascade).`);
  }

  const doctors = await db.doctor.findMany({ select: { id: true, name: true } });
  if (doctors.length === 0) throw new Error("Aucun médecin en base.");
  const meds = await db.medication.findMany({
    where: { is_active: true },
    select: { id: true, name: true, dosage: true, stocks: { select: { id: true, selling_price: true }, take: 1 } },
  });
  const labServices = await db.services.findMany({
    where: { category: "LABORATORY" },
    select: { id: true, service_name: true, price: true },
  });

  // Service de consultation pour les factures
  const consult = await db.services.upsert({
    where: { service_name: "Consultation générale" },
    update: {},
    create: { service_name: "Consultation générale", description: "Consultation médicale standard", price: 20000, category: "CONSULTATION" },
  });

  const APPT_TYPES = ["Consultation générale", "Suivi", "Urgence", "Consultation spécialisée"];
  let apptCount = 0, recCount = 0, rxCount = 0, labCount = 0, payCount = 0, dispCount = 0;

  // 2) Patients
  for (let i = 1; i <= 15; i++) {
    const isM = Math.random() > 0.5;
    const first = isM ? rand(FIRST_M) : rand(FIRST_F);
    const last = rand(LAST);
    const pid = `demo_p${String(i).padStart(2, "0")}`;
    const age = randInt(3, 78);

    await db.patient.create({
      data: {
        id: pid,
        first_name: first,
        last_name: last,
        date_of_birth: daysAgo(age * 365),
        gender: isM ? "MALE" : "FEMALE",
        phone: `08${randInt(10000000, 99999999)}`,
        email: `${pid}@demo.medflow.cd`,
        marital_status: rand(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]) as never,
        address: `Q. ${rand(COMMUNES)}, Kinshasa`,
        emergency_contact_name: `${rand(FIRST_F)} ${last}`,
        emergency_contact_number: `09${randInt(10000000, 99999999)}`,
        relation: rand(["Époux/se", "Parent", "Frère/Sœur", "Ami(e)"]),
        blood_group: rand(BLOOD),
        allergies: Math.random() > 0.7 ? "Pénicilline" : null,
        privacy_consent: true,
        service_consent: true,
        medical_consent: true,
        colorCode: rand(["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]),
      },
    });

    // 3) Rendez-vous (1 à 3)
    const nAppt = randInt(1, 3);
    for (let a = 0; a < nAppt; a++) {
      const doctor = rand(doctors);
      const upcoming = a === 0 && Math.random() > 0.6;
      const when = upcoming ? daysFromNow(randInt(1, 20)) : daysAgo(randInt(2, 170));
      const status = upcoming
        ? rand(["PENDING", "SCHEDULED"])
        : rand(["COMPLETED", "COMPLETED", "COMPLETED", "CANCELLED"]);
      const appt = await db.appointment.create({
        data: {
          patient_id: pid,
          doctor_id: doctor.id,
          appointment_date: when,
          time: `${String(randInt(8, 16)).padStart(2, "0")}:${rand(["00", "30"])}`,
          type: rand(APPT_TYPES),
          status: status as never,
          reason: rand(["Fièvre", "Douleurs abdominales", "Contrôle de routine", "Toux persistante", "Fatigue", "Céphalées"]),
        },
      });
      apptCount++;

      // 4) Consultation terminée → dossier + constantes + diagnostic
      if (status === "COMPLETED") {
        const rec = await db.medicalRecords.create({
          data: {
            patient_id: pid,
            appointment_id: appt.id,
            doctor_id: doctor.id,
            notes: "Consultation réalisée.",
          },
        });
        recCount++;

        await db.vitalSigns.create({
          data: {
            patient_id: pid,
            medical_id: rec.id,
            body_temperature: Number((36 + Math.random() * 3).toFixed(1)),
            systolic: randInt(105, 160),
            diastolic: randInt(65, 100),
            heartRate: String(randInt(60, 105)),
            respiratory_rate: randInt(14, 22),
            oxygen_saturation: randInt(94, 99),
            weight: Number((45 + Math.random() * 45).toFixed(1)),
            height: Number((150 + Math.random() * 40).toFixed(0)),
          },
        });

        const dx = rand(DIAGNOSES);
        await db.diagnosis.create({
          data: {
            patient_id: pid,
            medical_id: rec.id,
            doctor_id: doctor.id,
            symptoms: dx.s,
            diagnosis: dx.d,
            follow_up_plan: dx.f,
          },
        });

        // 5) Ordonnance (~70%)
        if (meds.length && Math.random() > 0.3) {
          const nItems = randInt(1, 3);
          const chosen = [...meds].sort(() => Math.random() - 0.5).slice(0, nItems);
          const rx = await db.prescription.create({
            data: {
              reference: `RX-DEMO-${pid}-${appt.id}`,
              patient_id: pid,
              medical_record_id: rec.id,
              appointment_id: appt.id,
              doctor_id: doctor.id,
              doctor_name: doctor.name,
              status: rand(["PENDING", "PENDING", "DISPENSED", "PARTIALLY_DISPENSED"]) as never,
              items: {
                create: chosen.map((m) => ({
                  medication_id: m.id,
                  quantity_prescribed: randInt(1, 3),
                  dosage: rand(["1 cp x3/j", "1 cp matin et soir", "2 cp/j pendant 5 jours", "1 sachet x3/j"]),
                  duration: rand(["5 jours", "7 jours", "3 jours", "10 jours"]),
                })),
              },
            },
          });
          rxCount++;

          // 8) Dispensation pour certaines ordonnances délivrées
          const stockMed = chosen.find((m) => m.stocks.length);
          if (stockMed && Math.random() > 0.6) {
            const st = stockMed.stocks[0];
            const qty = randInt(1, 2);
            await db.dispensation.create({
              data: {
                reference: `DISP-DEMO-${pid}-${appt.id}`,
                patient_id: pid,
                medical_record_id: rec.id,
                prescription_id: rx.id,
                dispensed_by: doctor.id,
                dispensed_by_name: "Pharmacie centrale",
                total_amount: st.selling_price * qty,
                items: {
                  create: [{
                    stock_id: st.id,
                    medication_id: stockMed.id,
                    quantity: qty,
                    unit_price: st.selling_price,
                    total_price: st.selling_price * qty,
                  }],
                },
              },
            });
            dispCount++;
          }
        }

        // 6) Analyses (~65%)
        if (labServices.length && Math.random() > 0.35) {
          const nLab = randInt(1, 3);
          const chosen = [...labServices].sort(() => Math.random() - 0.5).slice(0, nLab);
          for (const svc of chosen) {
            const st = rand(["REQUESTED", "IN_PROGRESS", "COMPLETED", "COMPLETED"]);
            const done = st === "COMPLETED";
            const results = LAB_RESULTS[svc.service_name];
            await db.labTest.create({
              data: {
                record_id: rec.id,
                service_id: svc.id,
                status: st as never,
                requested_by: doctor.id,
                requested_by_name: doctor.name,
                result: done ? (results ? rand(results) : "Résultat dans les normes") : null,
                performed_by_name: done ? "Laboratoire central" : (st === "IN_PROGRESS" ? "Laboratoire central" : null),
                test_date: done ? daysAgo(randInt(0, 3)) : null,
                completed_at: done ? daysAgo(randInt(0, 3)) : null,
              },
            });
            labCount++;
          }
        }

        // 7) Facture (~60%)
        if (Math.random() > 0.4) {
          const status = rand(["PAID", "PAID", "UNPAID", "PART"]);
          const total = consult.price + randInt(0, 3) * 12000;
          const paid = status === "PAID" ? total : status === "PART" ? Math.round(total / 2) : 0;
          await db.payment.create({
            data: {
              patient_id: pid,
              appointment_id: appt.id,
              bill_date: when,
              payment_date: when,
              total_amount: total,
              amount_paid: paid,
              discount: 0,
              status: status as never,
              payment_method: rand(["CASH", "MOBILE_MONEY", "CARD"]) as never,
              receipt_number: `RCP-DEMO-${pid}-${appt.id}`,
              cashier_name: "Caisse principale",
              bills: {
                create: [{
                  service_id: consult.id,
                  service_date: when,
                  quantity: 1,
                  unit_cost: consult.price,
                  total_cost: consult.price,
                }],
              },
            },
          });
          payCount++;
        }
      }
    }
  }

  // 9) Déclencher quelques alertes de stock (stock bas + péremption proche)
  const someStocks = await db.medicationStock.findMany({ take: 3, orderBy: { id: "asc" } });
  if (someStocks[0]) await db.medicationStock.update({ where: { id: someStocks[0].id }, data: { quantity: 4 } });
  if (someStocks[1]) await db.medicationStock.update({ where: { id: someStocks[1].id }, data: { expiry_date: daysFromNow(20) } });

  console.log("─── Seed de démo terminé ───");
  console.log({ patients: 15, appointments: apptCount, dossiers: recCount, ordonnances: rxCount, analyses: labCount, dispensations: dispCount, factures: payCount });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed démo échec:", e);
    process.exit(1);
  });
