import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Banknote } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getCurrentSession } from "@/app/actions/cashier";
import { SessionHeader } from "@/components/cashier/session-header";
import { UnpaidPaymentsList } from "@/components/cashier/unpaid-payments-list";
import { SessionHistory } from "@/components/cashier/session-history";
import { Skeleton } from "@/components/ui/skeleton";
import { Role } from "@prisma/client";

export default async function CashierDashboardPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== Role.CASHIER && user.role !== Role.ADMIN)) {
    redirect("/");
  }

  const session = await getCurrentSession(user.userId);

  return (
    <div className="p-6 flex flex-col gap-5 min-h-screen">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
          <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Caisse
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Gestion des encaissements et sessions de caisse
          </p>
        </div>
      </div>

      {/* Session status card */}
      <SessionHeader session={session} />

      {/* Unpaid payments */}
      <Suspense
        fallback={
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-3">
            <Skeleton className="h-5 w-44 mb-2" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        }
      >
        <UnpaidPaymentsList hasActiveSession={!!session} />
      </Suspense>

      {/* Session history (only when session is active) */}
      {session && (
        <Suspense
          fallback={
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-3">
                <Skeleton className="h-5 w-48 mb-2" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <SessionHistory sessionId={session.id} />
        </Suspense>
      )}
    </div>
  );
}
