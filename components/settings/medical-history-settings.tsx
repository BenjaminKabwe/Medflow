import { FileHeart, FlaskConical, ClipboardList, Stethoscope, Pill } from "lucide-react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { getLang } from "@/lib/i18n-server";

const RECORD_STATIC = [
  { id: "diagnosis", icon: Stethoscope, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/40", border: "border-sky-200 dark:border-sky-900/50" },
  { id: "prescriptions", icon: Pill, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40", border: "border-violet-200 dark:border-violet-900/50" },
  { id: "lab_test", icon: FlaskConical, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-900/50" },
  { id: "treatment_plan", icon: ClipboardList, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-900/50" },
] as const;

const STR = {
  fr: {
    title: "Historique médical",
    subtitle: "Types de données enregistrées dans les dossiers patients.",
    typesActive: (n: number) => `${n} types actifs`,
    footer:
      "Ces catégories sont structurées dans le schéma de base de données et ne peuvent pas être modifiées depuis l'interface.",
    types: {
      diagnosis: { label: "Diagnostics", description: "Symptômes, diagnostic posé et plan de suivi." },
      prescriptions: { label: "Prescriptions", description: "Médicaments prescrits et posologies associées." },
      lab_test: { label: "Analyses de laboratoire", description: "Résultats de tests biologiques et examens." },
      treatment_plan: { label: "Plans de traitement", description: "Suivi du traitement et notes cliniques." },
    } as Record<string, { label: string; description: string }>,
  },
  en: {
    title: "Medical history",
    subtitle: "Types of data recorded in patient records.",
    typesActive: (n: number) => `${n} active types`,
    footer:
      "These categories are structured in the database schema and cannot be modified from the interface.",
    types: {
      diagnosis: { label: "Diagnoses", description: "Symptoms, diagnosis and follow-up plan." },
      prescriptions: { label: "Prescriptions", description: "Prescribed medications and associated dosages." },
      lab_test: { label: "Laboratory tests", description: "Results of biological tests and examinations." },
      treatment_plan: { label: "Treatment plans", description: "Treatment follow-up and clinical notes." },
    } as Record<string, { label: string; description: string }>,
  },
};

export const MedicalHistorySettings = async () => {
  const t = STR[await getLang()];
  const RECORD_TYPES = RECORD_STATIC.map((r) => ({ ...r, ...t.types[r.id] }));
  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="capitalize">{t.title}</CardTitle>
          <CardDescription>
            {t.subtitle}
          </CardDescription>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
          <FileHeart className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t.typesActive(RECORD_TYPES.length)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {RECORD_TYPES.map(({ id, label, description, icon: Icon, color, bg, border }) => (
          <div
            key={id}
            className={`flex items-start gap-4 p-4 rounded-xl border ${border} ${bg}`}
          >
            <div className="mt-0.5 p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-600 self-center">
              {id}
            </span>
          </div>
        ))}

        <p className="text-xs text-slate-400 dark:text-slate-600 pt-2">
          {t.footer}
        </p>
      </CardContent>
    </>
  );
};
