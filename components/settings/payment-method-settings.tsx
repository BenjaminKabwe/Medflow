import { Suspense } from "react";
import { Layers } from "lucide-react";
import { getPaymentMethodConfigs } from "@/app/actions/payment-methods";
import { PaymentMethodCard } from "./payment-method-card";
import { PaymentMethodSettingsSkeleton } from "@/components/loading-skeletons";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PaymentMethodConfigRow } from "@/types";

// ─── Async inner component (triggers Suspense) ────────────────────────────────

async function PaymentMethodList() {
  // Cast needed until `prisma migrate dev` regenerates the client
  const configs = (await getPaymentMethodConfigs()) as unknown as PaymentMethodConfigRow[];

  if (configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Layers className="w-5 h-5 text-slate-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Aucun mode de paiement configuré
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Exécutez{" "}
            <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">
              npx prisma db seed
            </code>{" "}
            pour initialiser les données.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {configs.map((config) => (
        <PaymentMethodCard key={config.method} config={config} />
      ))}
    </div>
  );
}

// ─── Public Server Component ──────────────────────────────────────────────────

export function PaymentMethodSettings() {
  return (
    <>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Modes de paiement</CardTitle>
            <CardDescription className="mt-1">
              Activez ou désactivez les modes acceptés et personnalisez leurs
              paramètres (frais, opérateurs, organismes).
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Suspense fallback={<PaymentMethodSettingsSkeleton />}>
          <PaymentMethodList />
        </Suspense>
      </CardContent>
    </>
  );
}
