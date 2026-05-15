"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CashierDashboardError({ error, reset }: ErrorProps) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Une erreur est survenue
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {error.message || "Impossible de charger le tableau de bord de la caisse."}
          </p>
        </div>
        <Button variant="outline" onClick={reset}>
          Réessayer
        </Button>
      </div>
    </div>
  );
}
