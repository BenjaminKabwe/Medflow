"use client";

import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    errorGen: "Erreur lors de la génération du PDF",
    errorGen2: "Impossible de générer le PDF",
    download: "Télécharger la facture PDF",
  },
  en: {
    errorGen: "Error while generating the PDF",
    errorGen2: "Unable to generate the PDF",
    download: "Download the PDF invoice",
  },
};

interface Props {
  paymentId: number;
  patientName: string;
}

export const PdfDownloadButton = ({ paymentId, patientName }: Props) => {
  const [loading, setLoading] = useState(false);
  const { lang } = useLanguage();
  const t = STR[lang];

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/paiements/${paymentId}/pdf`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? t.errorGen);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `MedFlow_Facture_${paymentId}_${patientName}.pdf`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.errorGen2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title={t.download}
      className="flex items-center justify-center rounded-full bg-emerald-600/10 hover:bg-emerald-600/20
                text-emerald-700 dark:text-emerald-400
                px-1.5 py-1 text-xs md:text-sm transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <FileText size={14} />
      )}
    </button>
  );
};
