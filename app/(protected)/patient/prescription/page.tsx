import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Stethoscope, ShieldCheck } from "lucide-react";

/* ── Parse medication text into individual lines ─────────────────────────── */
function parseMedications(text: string): string[] {
  return text
    .split(/\n|(?:^|\n)\s*[-•–—]\s*/)
    .map((l) => l.replace(/^[-•–—]\s*/, "").trim())
    .filter(Boolean);
}

/* ── Doctor initials avatar ──────────────────────────────────────────────── */
function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (
    <span
      aria-hidden
      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold tracking-wide
                 bg-amber-500/15 text-amber-400 border border-amber-500/20 uppercase flex-shrink-0"
    >
      {letters}
    </span>
  );
}

const SPECIALIZATION_FR: Record<string, string> = {
  cardiologist: "Cardiologue",
  dermatologist: "Dermatologue",
  gastroenterologist: "Gastro-entérologue",
  neurologist: "Neurologue",
  orthopedist: "Orthopédiste",
  pediatrician: "Pédiatre",
  psychiatrist: "Psychiatre",
  gynecologist: "Gynécologue",
  ophthalmologist: "Ophtalmologue",
  urologist: "Urologue",
  oncologist: "Oncologue",
  general_practitioner: "Médecin généraliste",
  radiologist: "Radiologue",
  anesthesiologist: "Anesthésiste",
  surgeon: "Chirurgien",
  endocrinologist: "Endocrinologue",
  nephrologist: "Néphrologue",
  pulmonologist: "Pneumologue",
  rheumatologist: "Rhumatologue",
  hematologist: "Hématologue",
};

const PrescriptionPage = async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const [diagnoses, medRecords] = await Promise.all([
    db.diagnosis.findMany({
      where: { patient_id: userId, NOT: { prescribed_medications: null } },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        created_at: true,
        prescribed_medications: true,
        diagnosis: true,
        doctor_id: true,
      },
    }),
    db.medicalRecords.findMany({
      where: { patient_id: userId, NOT: { prescriptions: null } },
      orderBy: { created_at: "desc" },
      select: { id: true, created_at: true, prescriptions: true, doctor_id: true },
    }),
  ]);

  const doctorIds = [
    ...new Set([
      ...diagnoses.map((d) => d.doctor_id),
      ...medRecords.map((r) => r.doctor_id),
    ]),
  ];
  const doctors =
    doctorIds.length > 0
      ? await db.doctor.findMany({
          where: { id: { in: doctorIds } },
          select: { id: true, name: true, specialization: true },
        })
      : [];
  const doctorMap = new Map(doctors.map((d) => [d.id, d]));

  type Entry = {
    key: string;
    date: Date;
    doctorId: string;
    text: string;
    label: string;
    source: "diagnosis" | "record";
    index: number;
  };

  const entries: Entry[] = [
    ...diagnoses.map((d) => ({
      key: `diag-${d.id}`,
      date: d.created_at,
      doctorId: d.doctor_id,
      text: d.prescribed_medications!,
      label: d.diagnosis,
      source: "diagnosis" as const,
      index: 0,
    })),
    ...medRecords.map((r) => ({
      key: `rec-${r.id}`,
      date: r.created_at,
      doctorId: r.doctor_id,
      text: r.prescriptions!,
      label: "Prescription générale",
      source: "record" as const,
      index: 0,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((e, i) => ({ ...e, index: i + 1 }));

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl">
        {/* decorative Rx watermark */}
        <span
          aria-hidden
          className="pointer-events-none select-none absolute -right-4 -top-6 text-[9rem] font-bold leading-none
                     text-amber-500/5"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          ℞
        </span>

        <div className="relative flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-amber-500/80 uppercase tracking-[0.2em] font-semibold mb-1">
              Mes ordonnances
            </p>
            <div className="flex items-baseline gap-3">
              <span
                className="text-5xl text-amber-400 leading-none"
                style={{ fontFamily: "var(--font-instrument-serif)" }}
              >
                ℞
              </span>
              <h1 className="text-3xl font-bold text-white leading-none">
                {entries.length}
                <span className="text-base font-normal text-slate-400 ml-2">
                  ordonnance{entries.length !== 1 ? "s" : ""}
                </span>
              </h1>
            </div>
          </div>

          {entries.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Dossier médical sécurisé
            </div>
          )}
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {entries.length === 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-16 flex flex-col items-center text-center">
          <div
            className="text-7xl text-slate-700 mb-4 leading-none"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            ℞
          </div>
          <h2 className="text-base font-semibold text-slate-400 mb-1">
            Aucune ordonnance
          </h2>
          <p className="text-sm text-slate-500 max-w-xs">
            Vos ordonnances médicales apparaîtront ici après vos consultations.
          </p>
        </div>
      )}

      {/* ── Prescription cards ───────────────────────────────────────────────── */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => {
            const doctor = doctorMap.get(entry.doctorId);
            const meds = parseMedications(entry.text);
            const specFr = doctor?.specialization
              ? SPECIALIZATION_FR[doctor.specialization] ?? doctor.specialization
              : null;

            return (
              <div
                key={entry.key}
                className="group relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden
                           shadow-lg hover:border-amber-500/30 transition-all duration-300"
              >
                {/* amber left stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 rounded-l-2xl" />

                {/* Rx watermark */}
                <span
                  aria-hidden
                  className="pointer-events-none select-none absolute right-4 top-2 text-6xl font-bold
                             text-amber-500/5 group-hover:text-amber-500/8 transition-colors duration-300"
                  style={{ fontFamily: "var(--font-instrument-serif)" }}
                >
                  ℞
                </span>

                <div className="pl-6 pr-5 pt-5 pb-5">

                  {/* ── Card header ───────────────────────────────────────── */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {doctor && <Initials name={doctor.name} />}

                      <div className="min-w-0">
                        {doctor && (
                          <p className="text-sm font-semibold text-white leading-tight">
                            Dr. {doctor.name}
                          </p>
                        )}
                        {specFr && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Stethoscope className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <p className="text-xs text-slate-400">{specFr}</p>
                          </div>
                        )}
                        {entry.source === "diagnosis" && (
                          <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2 capitalize italic">
                            {entry.label}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* date badge */}
                    <div className="flex-shrink-0 flex items-center gap-1.5 bg-slate-800 border border-slate-700
                                    rounded-xl px-3 py-1.5 text-xs text-slate-300">
                      <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                      {format(entry.date, "d MMM yyyy", { locale: fr })}
                    </div>
                  </div>

                  {/* ── Divider with Rx label ──────────────────────────────── */}
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-base text-amber-400/70 leading-none flex-shrink-0"
                      style={{ fontFamily: "var(--font-instrument-serif)" }}
                    >
                      ℞
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
                    <span className="text-[10px] uppercase tracking-widest text-slate-600 flex-shrink-0">
                      Traitement prescrit
                    </span>
                  </div>

                  {/* ── Medication list ────────────────────────────────────── */}
                  <div className="flex flex-col gap-2">
                    {meds.map((med, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/50
                                   rounded-xl px-4 py-3 hover:bg-slate-800 transition-colors duration-150"
                      >
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/25
                                     text-amber-400 text-[10px] font-bold flex items-center justify-center mt-0.5"
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-200 leading-relaxed">{med}</p>
                      </div>
                    ))}
                  </div>

                  {/* ── Footer ────────────────────────────────────────────── */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600">
                      Ordonnance n°{String(entry.index).padStart(3, "0")}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-600">
                      <ShieldCheck className="w-3 h-3" />
                      MedFlow · Dossier électronique
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PrescriptionPage;
