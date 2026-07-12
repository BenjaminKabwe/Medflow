import { AvailableDoctors } from "@/components/available-doctor";
import { AppointmentChart } from "@/components/charts/appointment-chart";
import { StatSummary } from "@/components/charts/stat-summary";
import { RecentAppointments } from "@/components/tables/recent-appointment";
import { getDoctorDashboardStats } from "@/utils/services/doctor";
import { auth } from "@clerk/nextjs/server";
import {
  CalendarDays,
  CheckCircle2,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    space: "Espace Médecin",
    hello: "Bonjour, Dr.",
    myProfile: "Mon profil",
    see: "Voir →",
    patients: "Patients",
    patientsNote: "Patients suivis",
    nurses: "Infirmier(ère)s",
    nursesNote: "Personnel soignant",
    appointments: "Rendez-vous",
    appointmentsNote: "Total rendez-vous",
    consultations: "Consultations",
    consultationsNote: "Consultations terminées",
  },
  en: {
    space: "Doctor space",
    hello: "Hello, Dr.",
    myProfile: "My profile",
    see: "View →",
    patients: "Patients",
    patientsNote: "Patients followed",
    nurses: "Nurses",
    nursesNote: "Care staff",
    appointments: "Appointments",
    appointmentsNote: "Total appointments",
    consultations: "Consultations",
    consultationsNote: "Completed consultations",
  },
};

const DoctorDashboard = async () => {
  const { userId } = await auth();
  const t = STR[await getLang()];

  const {
    totalPatient,
    totalNurses,
    totalAppointment,
    appointmentCounts,
    availableDoctors,
    monthlyData,
    last5Records,
    doctorName,
  } = await getDoctorDashboardStats();

  const cardData = [
    {
      title: t.patients,
      note: t.patientsNote,
      value: totalPatient ?? 0,
      icon: Users,
      color: "sky",
      link: "/record/patients",
    },
    {
      title: t.nurses,
      note: t.nursesNote,
      value: totalNurses ?? 0,
      icon: UserRound,
      color: "rose",
      link: "/record/staffs",
    },
    {
      title: t.appointments,
      note: t.appointmentsNote,
      value: totalAppointment ?? 0,
      icon: CalendarDays,
      color: "amber",
      link: "/record/appointments",
    },
    {
      title: t.consultations,
      note: t.consultationsNote,
      value: appointmentCounts?.COMPLETED ?? 0,
      icon: CheckCircle2,
      color: "emerald",
      link: "/record/appointments",
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    sky:     { bg: "bg-sky-500/10",     icon: "bg-sky-500/15 text-sky-500",     text: "text-sky-500" },
    rose:    { bg: "bg-rose-500/10",    icon: "bg-rose-500/15 text-rose-500",    text: "text-rose-500" },
    amber:   { bg: "bg-amber-500/10",   icon: "bg-amber-500/15 text-amber-500",  text: "text-amber-500" },
    emerald: { bg: "bg-emerald-500/10", icon: "bg-emerald-500/15 text-emerald-500", text: "text-emerald-500" },
  };

  return (
    <div className="flex flex-col xl:flex-row gap-5">

      {/* ── LEFT ── */}
      <div className="w-full xl:w-[69%] flex flex-col gap-5">

        {/* Welcome + cards */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-medium mb-0.5">
                {t.space}
              </p>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {t.hello} {doctorName} 👋
              </h1>
            </div>
            <Link
              href={`/record/doctors/${userId}`}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700
                         text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t.myProfile}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cardData.map((card) => {
              const c = colorMap[card.color];
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`rounded-2xl p-4 flex flex-col gap-3 border border-slate-100 dark:border-slate-700 ${c.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Link
                      href={card.link}
                      className={`text-[11px] font-medium opacity-70 hover:opacity-100 transition-colors ${c.text}`}
                    >
                      {t.see}
                    </Link>
                  </div>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 leading-none">
                    {card.value}
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{card.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{card.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[380px]">
          <AppointmentChart data={monthlyData!} />
        </div>

        {/* Recent appointments */}
        <RecentAppointments data={last5Records!} />
      </div>

      {/* ── RIGHT ── */}
      <div className="w-full xl:w-[31%] flex flex-col gap-5">
        <div className="h-[380px]">
          <StatSummary data={appointmentCounts} total={totalAppointment!} />
        </div>
        <AvailableDoctors data={availableDoctors as any} />
      </div>

    </div>
  );
};

export default DoctorDashboard;
