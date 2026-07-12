import { AvailableDoctors } from "@/components/available-doctor";
import { AppointmentChart } from "@/components/charts/appointment-chart";
import { StatSummary } from "@/components/charts/stat-summary";
import { RecentAppointments } from "@/components/tables/recent-appointment";
import { getAdminDashboardStats } from "@/utils/services/admin";
import { auth } from "@clerk/nextjs/server";
import {
  CalendarDays,
  CheckCircle2,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    title: "Tableau de bord",
    hello: "Bonjour,",
    adminDefault: "Administrateur",
    see: "Voir →",
    patients: "Patients",
    patientsNote: "Patients enregistrés",
    doctors: "Médecins",
    doctorsNote: "Médecins actifs",
    appointments: "Rendez-vous",
    appointmentsNote: "Total rendez-vous",
    consultations: "Consultations",
    consultationsNote: "Consultations terminées",
  },
  en: {
    title: "Dashboard",
    hello: "Hello,",
    adminDefault: "Administrator",
    see: "View →",
    patients: "Patients",
    patientsNote: "Registered patients",
    doctors: "Doctors",
    doctorsNote: "Active doctors",
    appointments: "Appointments",
    appointmentsNote: "Total appointments",
    consultations: "Consultations",
    consultationsNote: "Completed consultations",
  },
};

const AdminDashboard = async () => {
  const { sessionClaims } = await auth();
  const firstName = (sessionClaims as Record<string, unknown>)?.first_name as string | undefined;
  const t = STR[await getLang()];

  const {
    availableDoctors,
    last5Records,
    appointmentCounts,
    monthlyData,
    totalDoctors,
    totalPatient,
    totalAppointments,
  } = await getAdminDashboardStats();

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
      title: t.doctors,
      note: t.doctorsNote,
      value: totalDoctors ?? 0,
      icon: Stethoscope,
      color: "violet",
      link: "/record/doctors",
    },
    {
      title: t.appointments,
      note: t.appointmentsNote,
      value: totalAppointments ?? 0,
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
    sky:     { bg: "bg-sky-500/10 dark:bg-sky-500/10",     icon: "bg-sky-500/15 text-sky-500",     text: "text-sky-500" },
    violet:  { bg: "bg-violet-500/10 dark:bg-violet-500/10", icon: "bg-violet-500/15 text-violet-500", text: "text-violet-500" },
    amber:   { bg: "bg-amber-500/10 dark:bg-amber-500/10",  icon: "bg-amber-500/15 text-amber-500",  text: "text-amber-500" },
    emerald: { bg: "bg-emerald-500/10 dark:bg-emerald-500/10", icon: "bg-emerald-500/15 text-emerald-500", text: "text-emerald-500" },
  };

  return (
    <div className="flex flex-col xl:flex-row gap-5">

      {/* ── LEFT ── */}
      <div className="w-full xl:w-[69%] flex flex-col gap-5">

        {/* Welcome + stat cards */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-medium mb-0.5">
                {t.title}
              </p>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {t.hello} {firstName ?? t.adminDefault} 👋
              </h1>
            </div>
            <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {new Date().getFullYear()}
            </span>
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
                      className={`text-[11px] font-medium transition-colors opacity-70 hover:opacity-100 ${c.text}`}
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
          <StatSummary data={appointmentCounts} total={totalAppointments!} />
        </div>
        <AvailableDoctors data={availableDoctors as any} />
      </div>

    </div>
  );
};

export default AdminDashboard;
