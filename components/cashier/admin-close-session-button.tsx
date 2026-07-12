"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { adminCloseSession } from "@/app/actions/cashier";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    confirm: "Clôturer cette session de caisse ? Cette action est irréversible.",
    close: "Clôturer",
  },
  en: {
    confirm: "Close this cash session? This action is irreversible.",
    close: "Close",
  },
} as const;

export function AdminCloseSessionButton({ sessionId }: { sessionId: number }) {
  const { lang } = useLanguage();
  const t = STR[lang];
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    if (!confirm(t.confirm)) return;
    setLoading(true);
    try {
      const result = await adminCloseSession(sessionId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClose}
      disabled={loading}
      className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 border border-red-100 dark:border-red-900/40 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <X className="w-3 h-3" />
      )}
      {t.close}
    </button>
  );
}
