"use client";

import { DiagnosisSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus, Trash2 } from "lucide-react";
import { CardHeader } from "../ui/card";
import { Form } from "../ui/form";
import { CustomInput } from "../custom-input";
import { toast } from "sonner";
import { addDiagnosis } from "@/app/actions/medical";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    needDosage: "Chaque médicament prescrit doit avoir une posologie.",
    needQty: "Quantité positive requise sur chaque médicament.",
    error: "Échec de l'ajout du diagnostic",
    trigger: "Ajouter un diagnostic",
    title: "Nouveau diagnostic",
    description:
      "Veuillez saisir des informations précises et vérifiées pour ce diagnostic.",
    symptoms: "Symptômes",
    symptomsPh: "Saisir les symptômes ici ...",
    diagnosis: "Diagnostic (Résultats)",
    diagnosisPh: "Saisir le diagnostic ici ...",
    rxTitle: "Ordonnance",
    rxHelp:
      "Prescris des médicaments du catalogue. Laisse vide si aucune ordonnance n'est nécessaire. La pharmacie pourra les délivrer directement.",
    medication: "Médicament",
    choose: "— Choisir —",
    quantity: "Quantité",
    duration: "Durée",
    durationPh: "ex : 7 jours",
    dosage: "Posologie",
    dosagePh: "ex : 1 comprimé matin, midi et soir avant les repas",
    deleteLine: "Supprimer la ligne",
    addMed: "Ajouter un médicament",
    notesPh: "Note optionnelle",
    notesLabel: "Notes supplémentaires",
    optional: "Optionnel",
    followUp: "Plan de suivi",
    submitting: "Envoi en cours...",
    submit: "Soumettre",
  },
  en: {
    needDosage: "Each prescribed medication must have a dosage.",
    needQty: "A positive quantity is required for each medication.",
    error: "Failed to add the diagnosis",
    trigger: "Add a diagnosis",
    title: "New diagnosis",
    description:
      "Please enter accurate and verified information for this diagnosis.",
    symptoms: "Symptoms",
    symptomsPh: "Enter the symptoms here ...",
    diagnosis: "Diagnosis (findings)",
    diagnosisPh: "Enter the diagnosis here ...",
    rxTitle: "Prescription",
    rxHelp:
      "Prescribe medications from the catalog. Leave empty if no prescription is needed. The pharmacy will be able to dispense them directly.",
    medication: "Medication",
    choose: "— Choose —",
    quantity: "Quantity",
    duration: "Duration",
    durationPh: "e.g. 7 days",
    dosage: "Dosage",
    dosagePh: "e.g. 1 tablet morning, noon and evening before meals",
    deleteLine: "Remove line",
    addMed: "Add a medication",
    notesPh: "Optional note",
    notesLabel: "Additional notes",
    optional: "Optional",
    followUp: "Follow-up plan",
    submitting: "Sending...",
    submit: "Submit",
  },
};

type Medication = {
  id: number;
  name: string;
  dosage: string;
  form: string;
};

type RxLine = {
  key: string;
  medicationId: number | null;
  quantity: number;
  dosage: string;
  duration: string;
};

let rxCounter = 0;
function newRxLine(): RxLine {
  rxCounter += 1;
  return {
    key: `rxline-${rxCounter}`,
    medicationId: null,
    quantity: 1,
    dosage: "",
    duration: "",
  };
}

interface AddDiagnosisProps {
  patientId: string;
  doctorId: string;
  appointmentId: string;
  medicalId: string;
  /** Catalogue des médicaments (vide si l'utilisateur ne peut pas prescrire). */
  medications?: Medication[];
  /** Seul un médecin peut joindre une ordonnance au diagnostic. */
  canPrescribe?: boolean;
}

export type DiagnosisFormData = z.infer<typeof DiagnosisSchema>;
export const AddDiagnosis = ({
  patientId,
  doctorId,
  appointmentId,
  medicalId,
  medications = [],
  canPrescribe = false,
}: AddDiagnosisProps) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [rxLines, setRxLines] = useState<RxLine[]>([newRxLine()]);
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];

  const showRx = canPrescribe && medications.length > 0;

  const form = useForm<DiagnosisFormData>({
    resolver: zodResolver(DiagnosisSchema),
    defaultValues: {
      patient_id: patientId,
      medical_id: medicalId,
      doctor_id: doctorId,
      symptoms: "",
      diagnosis: "",
      notes: "",
      prescribed_medications: "",
      follow_up_plan: "",
    },
  });

  function updateRxLine(key: string, patch: Partial<RxLine>) {
    setRxLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  }

  const handleOnSubmit = async (data: DiagnosisFormData) => {
    // Construit les lignes d'ordonnance (facultatif).
    const items = showRx
      ? rxLines
          .filter((l) => l.medicationId != null)
          .map((l) => ({
            medication_id: l.medicationId!,
            quantity_prescribed: l.quantity,
            dosage: l.dosage.trim(),
            duration: l.duration.trim() || undefined,
          }))
      : [];

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

    try {
      setLoading(true);

      const res = await addDiagnosis(
        data,
        appointmentId,
        items.length > 0 ? items : undefined
      );

      if (res.success) {
        toast.success(res.message);
        form.reset();
        setRxLines([newRxLine()]);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      console.log(error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={"outline"}
          size={"lg"}
          className="bg-blue-600 text-white mt-4"
        >
          <Plus size={22} className="text-white" />
          {t.trigger}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[70%] 2xl:max-w-[55%] max-h-[90vh] overflow-y-auto">
        <CardHeader className="px-0">
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </CardHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleOnSubmit)}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <CustomInput
                type="textarea"
                control={form.control}
                name="symptoms"
                label={t.symptoms}
                placeholder={t.symptomsPh}
              />
            </div>

            <div className="flex items-center gap-4">
              <CustomInput
                type="textarea"
                control={form.control}
                name="diagnosis"
                placeholder={t.diagnosisPh}
                label={t.diagnosis}
              />
            </div>

            {showRx && (
              <div className="space-y-3 rounded-xl border border-sky-100 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/10 p-4">
                <div>
                  <p className="text-sm font-semibold text-sky-800 dark:text-sky-300">
                    {t.rxTitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.rxHelp}
                  </p>
                </div>

                <div className="space-y-3">
                  {rxLines.map((line, idx) => (
                    <div
                      key={line.key}
                      className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 bg-white/60 dark:bg-slate-900/30"
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
                                updateRxLine(line.key, {
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
                                updateRxLine(line.key, {
                                  quantity: Math.max(
                                    1,
                                    Number(e.target.value) || 1
                                  ),
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
                                updateRxLine(line.key, {
                                  duration: e.target.value,
                                })
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
                                updateRxLine(line.key, {
                                  dosage: e.target.value,
                                })
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
                            setRxLines((prev) =>
                              prev.length === 1
                                ? [newRxLine()]
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
                  onClick={() => setRxLines((prev) => [...prev, newRxLine()])}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700"
                >
                  <Plus className="w-4 h-4" /> {t.addMed}
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <CustomInput
                type="textarea"
                control={form.control}
                name="notes"
                placeholder={t.notesPh}
                label={t.notesLabel}
              />
              <CustomInput
                type="textarea"
                control={form.control}
                name="follow_up_plan"
                placeholder={t.optional}
                label={t.followUp}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 w-full"
            >
              {loading ? t.submitting : t.submit}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
