"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, FileText, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { CardHeader } from "../ui/card";
import { createPrescription } from "@/app/actions/prescription";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    addAtLeastOne: "Ajoute au moins un médicament.",
    needDosage: "Chaque ligne doit avoir une posologie.",
    needQty: "Quantité positive requise sur chaque ligne.",
    error: "Échec de la création de l'ordonnance.",
    trigger: "Nouvelle ordonnance",
    description:
      "Prescris des médicaments du catalogue. La pharmacie pourra les délivrer directement.",
    emptyCatalog: "Aucun médicament dans le catalogue de la pharmacie.",
    medication: "Médicament",
    choose: "— Choisir —",
    quantity: "Quantité",
    duration: "Durée",
    durationPh: "ex : 7 jours",
    dosage: "Posologie",
    dosagePh: "ex : 1 comprimé matin, midi et soir avant les repas",
    deleteLine: "Supprimer la ligne",
    addMed: "Ajouter un médicament",
    noteOptional: "Note (optionnel)",
    notePh: "Recommandations générales…",
    creating: "Création…",
    create: "Créer l'ordonnance",
  },
  en: {
    addAtLeastOne: "Add at least one medication.",
    needDosage: "Each line must have a dosage.",
    needQty: "A positive quantity is required on each line.",
    error: "Failed to create the prescription.",
    trigger: "New prescription",
    description:
      "Prescribe medications from the catalog. The pharmacy will be able to dispense them directly.",
    emptyCatalog: "No medication in the pharmacy catalog.",
    medication: "Medication",
    choose: "— Choose —",
    quantity: "Quantity",
    duration: "Duration",
    durationPh: "e.g. 7 days",
    dosage: "Dosage",
    dosagePh: "e.g. 1 tablet morning, noon and evening before meals",
    deleteLine: "Remove line",
    addMed: "Add a medication",
    noteOptional: "Note (optional)",
    notePh: "General recommendations…",
    creating: "Creating…",
    create: "Create prescription",
  },
};

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
  dosage: string;
  duration: string;
};

let counter = 0;
function newLine(): Line {
  counter += 1;
  return {
    key: `rxline-${counter}`,
    medicationId: null,
    quantity: 1,
    dosage: "",
    duration: "",
  };
}

interface Props {
  patientId: string;
  appointmentId?: string;
  medicalId?: string;
  medications: Medication[];
}

export function AddPrescription({
  patientId,
  appointmentId,
  medicalId,
  medications,
}: Props) {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const medById = useMemo(() => {
    const m = new Map<number, Medication>();
    medications.forEach((x) => m.set(x.id, x));
    return m;
  }, [medications]);

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  async function handleSubmit() {
    const items = lines
      .filter((l) => l.medicationId != null)
      .map((l) => ({
        medication_id: l.medicationId!,
        quantity_prescribed: l.quantity,
        dosage: l.dosage.trim(),
        duration: l.duration.trim() || undefined,
      }));

    if (items.length === 0) {
      toast.error(t.addAtLeastOne);
      return;
    }
    for (const it of items) {
      if (!it.dosage) {
        toast.error(t.needDosage);
        return;
      }
      if (it.quantity_prescribed < 1) {
        toast.error(t.needQty);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await createPrescription({
        patient_id: patientId,
        medical_record_id: medicalId ? Number(medicalId) : undefined,
        appointment_id: appointmentId ? Number(appointmentId) : undefined,
        notes: notes.trim() || undefined,
        items,
      });
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        setLines([newLine()]);
        setNotes("");
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="bg-sky-600 text-white mt-4 hover:bg-sky-700"
        >
          <FileText size={18} className="text-white" />
          {t.trigger}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[70%] 2xl:max-w-[55%] max-h-[90vh] overflow-y-auto">
        <CardHeader className="px-0">
          <DialogTitle>{t.trigger}</DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </CardHeader>

        {medications.length === 0 ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {t.emptyCatalog}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div
                  key={line.key}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/20"
                >
                  <div className="flex items-start gap-3">
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
                      <div className="md:col-span-4">
                        <label className="text-[11px] text-slate-400 font-medium">
                          {t.duration}
                        </label>
                        <input
                          type="text"
                          value={line.duration}
                          onChange={(e) =>
                            updateLine(line.key, { duration: e.target.value })
                          }
                          placeholder={t.durationPh}
                          className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                        />
                      </div>
                      <div className="md:col-span-12">
                        <label className="text-[11px] text-slate-400 font-medium">
                          {t.dosage}
                        </label>
                        <input
                          type="text"
                          value={line.dosage}
                          onChange={(e) =>
                            updateLine(line.key, { dosage: e.target.value })
                          }
                          placeholder={t.dosagePh}
                          maxLength={300}
                          className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                        />
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
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, newLine()])}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700"
            >
              <Plus className="w-4 h-4" /> {t.addMed}
            </button>

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

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-sky-600 hover:bg-sky-700 w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> {t.creating}
                </>
              ) : (
                t.create
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
