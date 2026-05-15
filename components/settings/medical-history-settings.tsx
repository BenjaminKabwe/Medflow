import { FileHeart, FlaskConical, ClipboardList, Stethoscope, Pill } from "lucide-react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

const RECORD_TYPES = [
  {
    id: "diagnosis",
    label: "Diagnostics",
    description: "Symptômes, diagnostic posé et plan de suivi.",
    icon: Stethoscope,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-900/50",
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    description: "Médicaments prescrits et posologies associées.",
    icon: Pill,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-900/50",
  },
  {
    id: "lab_test",
    label: "Analyses de laboratoire",
    description: "Résultats de tests biologiques et examens.",
    icon: FlaskConical,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900/50",
  },
  {
    id: "treatment_plan",
    label: "Plans de traitement",
    description: "Suivi du traitement et notes cliniques.",
    icon: ClipboardList,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900/50",
  },
] as const;

export const MedicalHistorySettings = () => {
  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="capitalize">Historique médical</CardTitle>
          <CardDescription>
            Types de données enregistrées dans les dossiers patients.
          </CardDescription>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
          <FileHeart className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {RECORD_TYPES.length} types actifs
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
          Ces catégories sont structurées dans le schéma de base de données et ne peuvent pas être modifiées depuis l'interface.
        </p>
      </CardContent>
    </>
  );
};
