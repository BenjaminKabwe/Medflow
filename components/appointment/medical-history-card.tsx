import { Diagnosis, Doctor } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  ClipboardList,
  FileText,
  Pill,
  Stethoscope,
  UserRound,
} from "lucide-react";

interface ExtendedMedicalRecord extends Diagnosis {
  doctor: Doctor;
}

export const MedicalHistoryCard = ({
  record,
  index,
}: {
  record: ExtendedMedicalRecord;
  index: number;
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white dark:bg-slate-900">

      {/* ── En-tête de document ── */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight tracking-tight">MedFlow</p>
            <p className="text-sky-200 text-[11px] font-medium tracking-widest uppercase">Dossier médical</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {index === 0 && (
            <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 text-xs font-semibold tracking-wide">
              ● Récent
            </span>
          )}
          <div className="text-right">
            <p className="text-sky-200 text-[10px] uppercase tracking-widest font-medium">Référence</p>
            <p className="text-white font-bold text-sm">#{String(record.id).padStart(4, "0")}</p>
          </div>
        </div>
      </div>

      {/* ── Méta-données ── */}
      <div className="flex items-center gap-6 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <CalendarDays className="w-4 h-4" />
          <span>
            {format(new Date(record.created_at), "d MMMM yyyy", { locale: fr })}
          </span>
        </div>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-600" />
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <UserRound className="w-4 h-4" />
          <span>Dr. {record.doctor.name}</span>
          <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 text-xs font-medium capitalize">
            {record.doctor.specialization}
          </span>
        </div>
      </div>

      {/* ── Corps du dossier ── */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">

        {/* Diagnostic */}
        <Section
          icon={<Stethoscope className="w-4 h-4 text-sky-500" />}
          label="Diagnostic"
          color="sky"
        >
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
            {record.diagnosis || <Empty />}
          </p>
        </Section>

        {/* Symptômes */}
        <Section
          icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
          label="Symptômes"
          color="amber"
        >
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
            {record.symptoms || <Empty />}
          </p>
        </Section>

        {/* Prescriptions */}
        {record.prescribed_medications && (
          <Section
            icon={<Pill className="w-4 h-4 text-violet-500" />}
            label="Prescriptions"
            color="violet"
          >
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              {record.prescribed_medications}
            </p>
          </Section>
        )}

        {/* Plan de suivi */}
        {record.follow_up_plan && (
          <Section
            icon={<ClipboardList className="w-4 h-4 text-emerald-500" />}
            label="Plan de suivi"
            color="emerald"
          >
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              {record.follow_up_plan}
            </p>
          </Section>
        )}

        {/* Notes supplémentaires */}
        {record.notes && (
          <Section
            icon={<FileText className="w-4 h-4 text-slate-400" />}
            label="Notes supplémentaires"
            color="slate"
          >
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
              {record.notes}
            </p>
          </Section>
        )}
      </div>

      {/* ── Pied de document ── */}
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Document généré par <span className="font-semibold text-sky-500">MedFlow</span> · Usage médical confidentiel
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          {format(new Date(record.created_at), "dd/MM/yyyy HH:mm")}
        </p>
      </div>
    </div>
  );
};

/* ── Sous-composants ── */

const colorMap: Record<string, string> = {
  sky:     "bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800",
  amber:   "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800",
  violet:  "bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800",
  emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800",
  slate:   "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700",
};

function Section({
  icon,
  label,
  color,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${colorMap[color]}`}>
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <span className="text-slate-300 dark:text-slate-600 italic">Non renseigné</span>;
}
