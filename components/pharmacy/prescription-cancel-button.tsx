"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { XCircle, Loader2 } from "lucide-react";
import { cancelPrescription } from "@/app/actions/prescription";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    confirm: "Annuler cette ordonnance ?",
    error: "Une erreur est survenue.",
    cancel: "Annuler",
  },
  en: {
    confirm: "Cancel this prescription?",
    error: "An error occurred.",
    cancel: "Cancel",
  },
};

export function PrescriptionCancelButton({ id }: { id: number }) {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];
  const [busy, setBusy] = useState(false);

  async function handleCancel() {
    if (!window.confirm(t.confirm)) return;
    setBusy(true);
    try {
      const res = await cancelPrescription(id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 text-sm font-medium disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <XCircle className="w-4 h-4" />
      )}
      {t.cancel}
    </button>
  );
}
