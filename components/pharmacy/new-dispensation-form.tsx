"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  User,
  Plus,
  Trash2,
  Pill,
  Loader2,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { createDispensation } from "@/app/actions/pharmacy";
import { formatNumber } from "@/utils";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    patient: "Patient",
    change: "Changer",
    searchPatientPh: "Rechercher un patient (nom, téléphone)…",
    noPatientFound: "Aucun patient trouvé.",
    prefilled1: "Lignes pré-remplies depuis l'ordonnance",
    prefilled2: "— ajuste les lots et quantités si besoin.",
    medsToDispense: "Médicaments à délivrer",
    addLine: "Ajouter une ligne",
    noStock:
      "Aucun médicament n'a de stock disponible. Enregistre d'abord des entrées en stock.",
    medication: "Médicament",
    choose: "— Choisir —",
    batchFefo: "Lot (FEFO)",
    quantity: "Quantité",
    available: "dispo",
    exp: "exp",
    instructionsPh: "Posologie / instructions (ex : 1 comprimé matin et soir)",
    deleteLine: "Supprimer la ligne",
    rxRequired: "Ordonnance requise pour ce médicament.",
    noteOptional: "Note (optionnel)",
    notePh: "Remarque interne sur la dispensation…",
    totalToCollect: "Total à encaisser",
    saving: "Enregistrement…",
    validate: "Valider la dispensation",
    selectPatientFirst: "Sélectionne d'abord un patient.",
    addAtLeastOne: "Ajoute au moins un médicament à dispenser.",
    positiveQty: "Chaque ligne doit avoir une quantité positive.",
    errorGeneric: "Une erreur est survenue lors de la dispensation.",
    insufficientStock: (name: string, batch: string, qty: number) =>
      `Stock insuffisant pour ${name} (lot ${batch}) : ${qty} dispo.`,
    overStock: (qty: number) =>
      `Quantité supérieure au stock disponible (${qty}).`,
    outOfStockTitle: (n: number) =>
      `${n} médicament${n > 1 ? "s" : ""} prescrit${n > 1 ? "s" : ""} sans stock disponible`,
    outOfStockDesc: (names: string, n: number) =>
      `${names} — non délivrable${n > 1 ? "s" : ""} pour l'instant.`,
    dateLocale: "fr-FR",
  },
  en: {
    patient: "Patient",
    change: "Change",
    searchPatientPh: "Search for a patient (name, phone)…",
    noPatientFound: "No patient found.",
    prefilled1: "Lines pre-filled from prescription",
    prefilled2: "— adjust batches and quantities if needed.",
    medsToDispense: "Medications to dispense",
    addLine: "Add a line",
    noStock:
      "No medication has available stock. Record stock entries first.",
    medication: "Medication",
    choose: "— Choose —",
    batchFefo: "Batch (FEFO)",
    quantity: "Quantity",
    available: "avail.",
    exp: "exp",
    instructionsPh: "Dosage / instructions (e.g. 1 tablet morning and evening)",
    deleteLine: "Remove line",
    rxRequired: "Prescription required for this medication.",
    noteOptional: "Note (optional)",
    notePh: "Internal note about the dispensation…",
    totalToCollect: "Total to collect",
    saving: "Saving…",
    validate: "Confirm dispensation",
    selectPatientFirst: "Select a patient first.",
    addAtLeastOne: "Add at least one medication to dispense.",
    positiveQty: "Each line must have a positive quantity.",
    errorGeneric: "An error occurred during the dispensation.",
    insufficientStock: (name: string, batch: string, qty: number) =>
      `Insufficient stock for ${name} (batch ${batch}): ${qty} available.`,
    overStock: (qty: number) =>
      `Quantity exceeds available stock (${qty}).`,
    outOfStockTitle: (n: number) =>
      `${n} prescribed medication${n > 1 ? "s" : ""} out of stock`,
    outOfStockDesc: (names: string, n: number) =>
      `${names} — not dispensable for now.`,
    dateLocale: "en-GB",
  },
};

type Lot = {
  stock_id: number;
  batch_number: string;
  quantity: number;
  expiry_date: string | Date;
  selling_price: number;
};

export type DispensableMedication = {
  id: number;
  name: string;
  dci: string;
  dosage: string;
  form: string;
  unit: string;
  prescription_required: boolean;
  lots: Lot[];
};

type PatientResult = {
  id: string;
  name: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
};

type Line = {
  key: string;
  medicationId: number | null;
  stockId: number | null;
  quantity: number;
  instructions: string;
};

export type PrescriptionContext = {
  id: number;
  reference: string;
  patient: PatientResult;
  items: {
    medicationId: number;
    remaining: number;
    dosage: string;
    medicationName: string;
  }[];
};

function fmtDate(d: string | Date, locale = "fr-FR") {
  return new Date(d).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(d: string | Date) {
  return Math.floor(
    (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

let lineCounter = 0;
function newLine(): Line {
  lineCounter += 1;
  return {
    key: `line-${lineCounter}`,
    medicationId: null,
    stockId: null,
    quantity: 1,
    instructions: "",
  };
}

/** Construit les lignes initiales à partir d'une ordonnance (auto-sélection du lot FEFO). */
function buildInitialLines(
  medications: DispensableMedication[],
  prescription?: PrescriptionContext
): Line[] {
  if (!prescription) return [newLine()];
  const lines: Line[] = [];
  for (const item of prescription.items) {
    if (item.remaining <= 0) continue;
    const med = medications.find((m) => m.id === item.medicationId);
    const lot = med?.lots[0]; // lots triés par péremption la plus proche (FEFO)
    if (!med || !lot) continue; // médicament sans stock : traité via la bannière
    lines.push({
      ...newLine(),
      medicationId: med.id,
      stockId: lot.stock_id,
      quantity: Math.min(item.remaining, lot.quantity),
      instructions: item.dosage,
    });
  }
  return lines.length > 0 ? lines : [newLine()];
}

export function NewDispensationForm({
  medications,
  prescription,
}: {
  medications: DispensableMedication[];
  prescription?: PrescriptionContext;
}) {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];

  // Médicaments prescrits sans stock disponible (non dispensables)
  const outOfStockRx = prescription
    ? prescription.items.filter(
        (it) =>
          it.remaining > 0 &&
          !medications.some((m) => m.id === it.medicationId && m.lots.length > 0)
      )
    : [];

  // ── Patient ────────────────────────────────────────────────
  const [patient, setPatient] = useState<PatientResult | null>(
    prescription?.patient ?? null
  );
  const patientLocked = !!prescription;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (patient) return; // pas de recherche quand un patient est sélectionné
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/pharmacy/patients/search?q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          const json = await res.json();
          setResults(json.patients ?? []);
          setShowResults(true);
        }
      } catch {
        // silencieux
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, patient]);

  // ── Lignes ─────────────────────────────────────────────────
  const [lines, setLines] = useState<Line[]>(() =>
    buildInitialLines(medications, prescription)
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const medById = useMemo(() => {
    const map = new Map<number, DispensableMedication>();
    medications.forEach((m) => map.set(m.id, m));
    return map;
  }, [medications]);

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  }

  function lotFor(line: Line): Lot | null {
    if (line.medicationId == null || line.stockId == null) return null;
    const med = medById.get(line.medicationId);
    return med?.lots.find((l) => l.stock_id === line.stockId) ?? null;
  }

  function lineTotal(line: Line): number {
    const lot = lotFor(line);
    if (!lot) return 0;
    return lot.selling_price * line.quantity;
  }

  const total = lines.reduce((s, l) => s + lineTotal(l), 0);

  // ── Soumission ─────────────────────────────────────────────
  async function handleSubmit() {
    if (!patient) {
      toast.error(t.selectPatientFirst);
      return;
    }
    const items = lines
      .filter((l) => l.medicationId != null && l.stockId != null)
      .map((l) => ({
        stock_id: l.stockId!,
        quantity: l.quantity,
        instructions: l.instructions.trim() || undefined,
      }));

    if (items.length === 0) {
      toast.error(t.addAtLeastOne);
      return;
    }

    // Validation locale : quantité <= dispo
    for (const l of lines) {
      const lot = lotFor(l);
      if (!lot) continue;
      if (l.quantity < 1) {
        toast.error(t.positiveQty);
        return;
      }
      if (l.quantity > lot.quantity) {
        const med = medById.get(l.medicationId!);
        toast.error(
          t.insufficientStock(med?.name ?? "", lot.batch_number, lot.quantity)
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await createDispensation({
        patient_id: patient.id,
        prescription_id: prescription?.id,
        notes: notes.trim() || undefined,
        items,
      });
      if (res.success) {
        toast.success(res.message);
        router.push(
          prescription
            ? `/pharmacy/prescriptions/${prescription.id}`
            : "/pharmacy/dispensation"
        );
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Patient ── */}
      <section className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" /> {t.patient}
        </h2>

        {patient ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-500/10 flex items-center justify-center">
                <User className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {patient.name}
                </p>
                <p className="text-xs text-slate-500">{patient.phone}</p>
              </div>
            </div>
            {patientLocked ? (
              <span className="text-[11px] font-mono px-2 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300">
                {prescription!.reference}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPatient(null);
                  setQuery("");
                  setResults([]);
                }}
                className="text-xs text-slate-500 hover:text-red-500 font-medium"
              >
                {t.change}
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setShowResults(true)}
                placeholder={t.searchPatientPh}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              {searching && (
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              )}
            </div>

            {showResults && results.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPatient(p);
                        setShowResults(false);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500">{p.phone}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showResults &&
              !searching &&
              query.trim().length >= 2 &&
              results.length === 0 && (
                <p className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg px-3 py-2.5 text-sm text-slate-400">
                  {t.noPatientFound}
                </p>
              )}
          </div>
        )}

        {prescription && (
          <p className="mt-3 text-xs text-slate-500">
            {t.prefilled1}{" "}
            <span className="font-mono">{prescription.reference}</span>{" "}
            {t.prefilled2}
          </p>
        )}
      </section>

      {outOfStockRx.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {t.outOfStockTitle(outOfStockRx.length)}
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              {t.outOfStockDesc(
                outOfStockRx.map((it) => it.medicationName).join(", "),
                outOfStockRx.length
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── Médicaments ── */}
      <section className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Pill className="w-4 h-4 text-slate-400" /> {t.medsToDispense}
          </h2>
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, newLine()])}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700"
          >
            <Plus className="w-4 h-4" /> {t.addLine}
          </button>
        </div>

        {medications.length === 0 ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {t.noStock}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map((line, idx) => {
              const med =
                line.medicationId != null
                  ? medById.get(line.medicationId)
                  : null;
              const lot = lotFor(line);
              const overStock = lot != null && line.quantity > lot.quantity;
              return (
                <div
                  key={line.key}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/20"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-2 text-xs font-mono text-slate-400 w-5 flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                      {/* Médicament */}
                      <div className="md:col-span-5">
                        <label className="text-[11px] text-slate-400 font-medium">
                          {t.medication}
                        </label>
                        <select
                          value={line.medicationId ?? ""}
                          onChange={(e) =>
                            updateLine(line.key, {
                              medicationId: e.target.value
                                ? Number(e.target.value)
                                : null,
                              stockId: null,
                            })
                          }
                          className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                        >
                          <option value="">{t.choose}</option>
                          {medications.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} {m.dosage} ({m.form})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Lot */}
                      <div className="md:col-span-4">
                        <label className="text-[11px] text-slate-400 font-medium">
                          {t.batchFefo}
                        </label>
                        <select
                          value={line.stockId ?? ""}
                          disabled={!med}
                          onChange={(e) =>
                            updateLine(line.key, {
                              stockId: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                          className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50"
                        >
                          <option value="">{t.choose}</option>
                          {med?.lots.map((l) => {
                            const dleft = daysUntil(l.expiry_date);
                            return (
                              <option key={l.stock_id} value={l.stock_id}>
                                {l.batch_number} · {l.quantity} {t.available} ·{" "}
                                {t.exp} {fmtDate(l.expiry_date, t.dateLocale)}
                                {dleft <= 30 ? " ⚠" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Quantité */}
                      <div className="md:col-span-3">
                        <label className="text-[11px] text-slate-400 font-medium">
                          {t.quantity}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={lot?.quantity ?? undefined}
                          value={line.quantity}
                          disabled={!lot}
                          onChange={(e) =>
                            updateLine(line.key, {
                              quantity: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className={`mt-0.5 w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus:ring-2 disabled:opacity-50 bg-white dark:bg-slate-900 ${
                            overStock
                              ? "border-red-400 focus:ring-red-500/30"
                              : "border-slate-200 dark:border-slate-700 focus:ring-sky-500/30"
                          }`}
                        />
                      </div>

                      {/* Instructions */}
                      <div className="md:col-span-11">
                        <input
                          type="text"
                          value={line.instructions}
                          onChange={(e) =>
                            updateLine(line.key, {
                              instructions: e.target.value,
                            })
                          }
                          placeholder={t.instructionsPh}
                          maxLength={300}
                          className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                        />
                      </div>

                      {/* Sous-total ligne */}
                      <div className="md:col-span-1 flex items-end">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatNumber(lineTotal(line))} FC
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setLines((prev) =>
                          prev.length === 1
                            ? [newLine()]
                            : prev.filter((l) => l.key !== line.key)
                        )
                      }
                      className="mt-6 text-slate-300 hover:text-red-500 flex-shrink-0"
                      aria-label={t.deleteLine}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {overStock && (
                    <p className="mt-1.5 ml-8 text-[11px] text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />{" "}
                      {t.overStock(lot?.quantity ?? 0)}
                    </p>
                  )}
                  {med?.prescription_required && (
                    <p className="mt-1.5 ml-8 text-[11px] text-amber-600 flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" /> {t.rxRequired}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Notes + total + validation ── */}
      <section className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col gap-4">
        <div>
          <label className="text-[11px] text-slate-400 font-medium">
            {t.noteOptional}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={t.notePh}
            className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <p className="text-xs text-slate-400">{t.totalToCollect}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {formatNumber(total)} FC
            </p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || medications.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t.saving}
              </>
            ) : (
              <>
                <Pill className="w-4 h-4" /> {t.validate}
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
