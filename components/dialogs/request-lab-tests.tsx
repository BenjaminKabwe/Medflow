"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FlaskConical, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { CardHeader } from "../ui/card";
import { requestLabTests } from "@/app/actions/lab";
import { formatNumber } from "@/utils";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    selectAtLeastOne: "Sélectionne au moins une analyse.",
    error: "Échec de la demande d'analyses.",
    trigger: "Demander des analyses",
    title: "Demander des analyses",
    description:
      "Sélectionne les analyses à réaliser. Elles seront envoyées au laboratoire.",
    emptyCatalog: "Aucune analyse dans le catalogue du laboratoire.",
    clinicalInfo: "Renseignement clinique (optionnel)",
    clinicalPh: "Contexte / indication pour le laborantin…",
    selectedCount: (n: number) => `${n} analyse(s) sélectionnée(s)`,
    sending: "Envoi…",
    send: "Envoyer au laboratoire",
  },
  en: {
    selectAtLeastOne: "Select at least one test.",
    error: "Failed to request the tests.",
    trigger: "Request tests",
    title: "Request tests",
    description:
      "Select the tests to perform. They will be sent to the laboratory.",
    emptyCatalog: "No test in the laboratory catalog.",
    clinicalInfo: "Clinical information (optional)",
    clinicalPh: "Context / indication for the lab technician…",
    selectedCount: (n: number) => `${n} test(s) selected`,
    sending: "Sending…",
    send: "Send to laboratory",
  },
};

type LabService = {
  id: number;
  service_name: string;
  description: string;
  price: number;
};

interface Props {
  /** Dossier médical existant (si la consultation en a déjà un). */
  recordId?: number | null;
  /** Contexte de consultation : permet de créer le dossier à la volée. */
  appointmentId?: string;
  patientId?: string;
  doctorId?: string;
  services: LabService[];
}

export function RequestLabTests({
  recordId,
  appointmentId,
  patientId,
  doctorId,
  services,
}: Props) {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) {
      toast.error(t.selectAtLeastOne);
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestLabTests({
        record_id: recordId ?? undefined,
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        service_ids: Array.from(selected),
        notes: notes.trim() || undefined,
      });
      if (res.success) {
        toast.success(res.message);
        setSelected(new Set());
        setNotes("");
        setOpen(false);
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
          className="bg-violet-600 text-white mt-4 hover:bg-violet-700"
        >
          <FlaskConical size={18} className="text-white" />
          {t.trigger}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[60%] 2xl:max-w-[45%] max-h-[90vh] overflow-y-auto">
        <CardHeader className="px-0">
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </CardHeader>

        {services.length === 0 ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {t.emptyCatalog}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {services.map((s) => {
                const checked = selected.has(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      checked
                        ? "border-violet-400 bg-violet-50/70 dark:border-violet-700 dark:bg-violet-950/20"
                        : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.id)}
                      className="mt-1 accent-violet-600"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {s.service_name}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {s.description}
                      </p>
                      <p className="text-[11px] text-violet-600 font-medium mt-0.5">
                        {formatNumber(s.price)} FC
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium">
                {t.clinicalInfo}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder={t.clinicalPh}
                className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {t.selectedCount(selected.size)}
              </span>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> {t.sending}
                  </>
                ) : (
                  t.send
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
