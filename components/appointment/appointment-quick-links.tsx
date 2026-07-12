import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { checkRole } from "@/utils/roles";
import { ReviewForm } from "../dialogs/review-form";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    title: "Liens rapides",
    charts: "Graphiques",
    appointments: "Rendez-vous",
    diagnosis: "Diagnostic",
    billing: "Facturation",
    history: "Historique médical",
    payments: "Paiements",
    labTests: "Analyses",
    vitalSigns: "Signes vitaux",
  },
  en: {
    title: "Quick links",
    charts: "Charts",
    appointments: "Appointments",
    diagnosis: "Diagnosis",
    billing: "Billing",
    history: "Medical history",
    payments: "Payments",
    labTests: "Lab tests",
    vitalSigns: "Vital signs",
  },
};

const AppointmentQuickLinks = async ({ staffId }: { staffId: string }) => {
  const isPatient = await checkRole("PATIENT");
  const t = STR[await getLang()];

  return (
    <Card className="w-full rounded-xl shadow-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-800 dark:text-slate-100">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Link
          href="?cat=charts"
          className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
        >
          {t.charts}
        </Link>
        <Link
          href="?cat=appointments"
          className="px-4 py-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
        >
          {t.appointments}
        </Link>
        <Link
          href="?cat=diagnosis"
          className="px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          {t.diagnosis}
        </Link>
        <Link
          href="?cat=billing"
          className="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
        >
          {t.billing}
        </Link>
        <Link
          href="?cat=medical-history"
          className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          {t.history}
        </Link>
        <Link
          href="?cat=payments"
          className="px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
        >
          {t.payments}
        </Link>
        <Link
          href="?cat=lab-test"
          className="px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
        >
          {t.labTests}
        </Link>
        <Link
          href="?cat=appointments#vital-signs"
          className="px-4 py-2 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
        >
          {t.vitalSigns}
        </Link>
        {isPatient && <ReviewForm staffId={staffId} />}
      </CardContent>
    </Card>
  );
};

export default AppointmentQuickLinks;
