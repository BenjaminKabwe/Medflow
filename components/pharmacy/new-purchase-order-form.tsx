"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  Truck,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { createPurchaseOrder } from "@/app/actions/pharmacy";
import { formatNumber } from "@/utils";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    supplier: "Fournisseur",
    noSupplier: "Aucun fournisseur actif — crée-en un d'abord.",
    choose: "— Choisir —",
    expectedDate: "Date de livraison prévue (optionnel)",
    medsToOrder: "Médicaments à commander",
    addLine: "Ajouter une ligne",
    emptyCatalog: "Le catalogue est vide. Ajoute des médicaments d'abord.",
    medication: "Médicament",
    quantity: "Quantité",
    unitCost: "Coût unitaire",
    deleteLine: "Supprimer la ligne",
    noteOptional: "Note (optionnel)",
    notePh: "Conditions, remarques…",
    totalAmount: "Montant total",
    creating: "Création…",
    create: "Créer le bon de commande",
    selectSupplier: "Sélectionne un fournisseur.",
    addAtLeastOne: "Ajoute au moins un médicament.",
    positiveQty: "Chaque ligne doit avoir une quantité positive.",
    error: "Une erreur est survenue.",
  },
  en: {
    supplier: "Supplier",
    noSupplier: "No active supplier — create one first.",
    choose: "— Choose —",
    expectedDate: "Expected delivery date (optional)",
    medsToOrder: "Medications to order",
    addLine: "Add a line",
    emptyCatalog: "The catalog is empty. Add medications first.",
    medication: "Medication",
    quantity: "Quantity",
    unitCost: "Unit cost",
    deleteLine: "Remove line",
    noteOptional: "Note (optional)",
    notePh: "Conditions, remarks…",
    totalAmount: "Total amount",
    creating: "Creating…",
    create: "Create purchase order",
    selectSupplier: "Select a supplier.",
    addAtLeastOne: "Add at least one medication.",
    positiveQty: "Each line must have a positive quantity.",
    error: "An error occurred.",
  },
};

type Supplier = { id: number; name: string };
type Medication = {
  id: number;
  name: string;
  dosage: string;
  form: string;
};

type Line = {
  key: string;
  medicationId: number | null;
  quantity: number;
  unitCost: number;
};

let counter = 0;
function newLine(): Line {
  counter += 1;
  return { key: `poline-${counter}`, medicationId: null, quantity: 1, unitCost: 0 };
}

export function NewPurchaseOrderForm({
  suppliers,
  medications,
}: {
  suppliers: Supplier[];
  medications: Medication[];
}) {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [submitting, setSubmitting] = useState(false);

  const medById = useMemo(() => {
    const m = new Map<number, Medication>();
    medications.forEach((x) => m.set(x.id, x));
    return m;
  }, [medications]);

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);

  async function handleSubmit() {
    if (!supplierId) {
      toast.error(t.selectSupplier);
      return;
    }
    const items = lines
      .filter((l) => l.medicationId != null)
      .map((l) => ({
        medication_id: l.medicationId!,
        quantity_ordered: l.quantity,
        unit_cost: l.unitCost,
      }));
    if (items.length === 0) {
      toast.error(t.addAtLeastOne);
      return;
    }
    for (const l of lines) {
      if (l.medicationId != null && l.quantity < 1) {
        toast.error(t.positiveQty);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await createPurchaseOrder({
        supplier_id: supplierId,
        expected_date: expectedDate ? new Date(expectedDate) : undefined,
        notes: notes.trim() || undefined,
        items,
      });
      if (res.success) {
        toast.success(res.message);
        router.push(
          res.data ? `/pharmacy/purchase-orders/${res.data.id}` : "/pharmacy/purchase-orders"
        );
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(t.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Fournisseur + date */}
      <section className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-slate-400" /> {t.supplier}
          </label>
          {suppliers.length === 0 ? (
            <p className="text-xs text-amber-600">
              {t.noSupplier}
            </p>
          ) : (
            <select
              value={supplierId ?? ""}
              onChange={(e) =>
                setSupplierId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              <option value="">{t.choose}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 block">
            {t.expectedDate}
          </label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
          />
        </div>
      </section>

      {/* Lignes */}
      <section className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-400" /> {t.medsToOrder}
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
              {t.emptyCatalog}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div
                key={line.key}
                className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/20"
              >
                <span className="mt-2 text-xs font-mono text-slate-400 w-5 flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                  <div className="md:col-span-6">
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
                  <div className="md:col-span-2">
                    <label className="text-[11px] text-slate-400 font-medium">
                      {t.quantity}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(line.key, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] text-slate-400 font-medium">
                      {t.unitCost}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.unitCost}
                      onChange={(e) =>
                        updateLine(line.key, {
                          unitCost: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap pb-2">
                      {formatNumber(line.quantity * line.unitCost)} FC
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
            ))}
          </div>
        )}
      </section>

      {/* Notes + total */}
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
            <p className="text-xs text-slate-400">{t.totalAmount}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {formatNumber(total)} FC
            </p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || medications.length === 0 || suppliers.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t.creating}
              </>
            ) : (
              <>
                <ClipboardList className="w-4 h-4" /> {t.create}
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
