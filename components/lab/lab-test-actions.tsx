"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PlayCircle, ClipboardEdit, Eye } from "lucide-react";
import type { LabTestStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { CardHeader } from "../ui/card";
import { startLabTest, submitLabResult } from "@/app/actions/lab";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    enterResult: "Saisis le résultat de l'analyse.",
    takeCharge: "Prendre en charge",
    view: "Voir",
    enterResultBtn: "Saisir le résultat",
    patient: "Patient :",
    result: "Résultat",
    resultPh: "Valeurs mesurées, interprétation…",
    noteOptional: "Note (optionnel)",
    notePh: "Remarque du laborantin…",
    saving: "Enregistrement…",
    saveResult: "Enregistrer le résultat",
  },
  en: {
    enterResult: "Enter the test result.",
    takeCharge: "Take charge",
    view: "View",
    enterResultBtn: "Enter result",
    patient: "Patient:",
    result: "Result",
    resultPh: "Measured values, interpretation…",
    noteOptional: "Note (optional)",
    notePh: "Lab technician's remark…",
    saving: "Saving…",
    saveResult: "Save result",
  },
};

interface Props {
  id: number;
  status: LabTestStatus;
  serviceName: string;
  patientName: string;
  result?: string | null;
  notes?: string | null;
}

export function LabTestActions({
  id,
  status,
  serviceName,
  patientName,
  result,
  notes,
}: Props) {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resultText, setResultText] = useState(result ?? "");
  const [noteText, setNoteText] = useState(notes ?? "");

  const readOnly = status === "COMPLETED" || status === "CANCELLED";

  async function handleStart() {
    setBusy(true);
    try {
      const res = await startLabTest(id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!resultText.trim()) {
      toast.error(t.enterResult);
      return;
    }
    setBusy(true);
    try {
      const res = await submitLabResult({
        id,
        result: resultText.trim(),
        notes: noteText.trim() || undefined,
      });
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {status === "REQUESTED" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleStart}
          disabled={busy}
          className="h-8 text-xs"
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <PlayCircle className="w-3.5 h-3.5 mr-1" /> {t.takeCharge}
            </>
          )}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            className={`h-8 text-xs ${
              readOnly
                ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100"
                : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            {readOnly ? (
              <>
                <Eye className="w-3.5 h-3.5 mr-1" /> {t.view}
              </>
            ) : (
              <>
                <ClipboardEdit className="w-3.5 h-3.5 mr-1" /> {t.enterResultBtn}
              </>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[55%] 2xl:max-w-[40%] max-h-[90vh] overflow-y-auto">
          <CardHeader className="px-0">
            <DialogTitle>{serviceName}</DialogTitle>
            <DialogDescription>
              {t.patient} {patientName}
            </DialogDescription>
          </CardHeader>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-slate-400 font-medium">
                {t.result}
              </label>
              <textarea
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                rows={5}
                maxLength={5000}
                readOnly={readOnly}
                placeholder={t.resultPh}
                className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 resize-none read-only:opacity-80"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">
                {t.noteOptional}
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
                maxLength={1000}
                readOnly={readOnly}
                placeholder={t.notePh}
                className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 resize-none read-only:opacity-80"
              />
            </div>

            {!readOnly && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="bg-violet-600 hover:bg-violet-700 w-full"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                    {t.saving}
                  </>
                ) : (
                  t.saveResult
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
