import { AvailableDoctors } from "@/components/available-doctor";
import { AppointmentChart } from "@/components/charts/appointment-chart";
import { StatSummary } from "@/components/charts/stat-summary";
import { PatientRatingContainer } from "@/components/patient-rating-container";
import { StatCard } from "@/components/stat-card";
import { RecentAppointments } from "@/components/tables/recent-appointment";
import { AvailableDoctorProps } from "@/types/data-types";
import { getPatientDashboardStatistics } from "@/utils/services/patient";
import { auth } from "@clerk/nextjs/server";
import { CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const PatientDashboard = async () => {
  const { userId, sessionClaims } = await auth();
  const firstName = (sessionClaims as Record<string, unknown>)?.first_name as string | undefined;

  const {
    data,
    appointmentCounts,
    last5Records,
    totalAppointments,
    availableDoctor,
    monthlyData,
  } = await getPatientDashboardStatistics(userId!);

  if (userId && !data) {
    redirect("/patient/registration");
  }

  if (!data) return null;

  const cardData = [
    {
      title: "Rendez-vous",
      value: totalAppointments,
      icon: CalendarDays,
      className: "bg-sky-500/10 dark:bg-sky-500/10",
      iconClassName: "bg-sky-500/20 text-sky-500",
      note: "Total rendez-vous",
      link: "#",
    },
    {
      title: "Annulés",
      value: appointmentCounts?.CANCELLED,
      icon: XCircle,
      className: "bg-rose-500/10 dark:bg-rose-500/10",
      iconClassName: "bg-rose-500/20 text-rose-500",
      note: "Rendez-vous annulés",
      link: "#",
    },
    {
      title: "En attente",
      value: (appointmentCounts?.PENDING ?? 0) + (appointmentCounts?.SCHEDULED ?? 0),
      icon: Clock,
      className: "bg-amber-500/10 dark:bg-amber-500/10",
      iconClassName: "bg-amber-500/20 text-amber-500",
      note: "En attente ou planifiés",
      link: "#",
    },
    {
      title: "Terminés",
      value: appointmentCounts?.COMPLETED,
      icon: CheckCircle2,
      className: "bg-emerald-500/10 dark:bg-emerald-500/10",
      iconClassName: "bg-emerald-500/20 text-emerald-500",
      note: "Rendez-vous effectués",
      link: "#",
    },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6">

      {/* LEFT */}
      <div className="w-full xl:w-[69%] flex flex-col gap-6">

        {/* Welcome card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-medium mb-0.5">
                Espace Patient
              </p>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Bonjour, {data?.first_name || firstName} 👋
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {new Date().getFullYear()}
              </span>
              <Link
                href="/patient/self"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700
                        text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Mon profil
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cardData.map((el) => (
              <StatCard key={el.title} {...el} />
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[380px]">
          <AppointmentChart data={monthlyData} />
        </div>

        {/* Recent appointments */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
          <RecentAppointments data={last5Records} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-[31%] flex flex-col gap-6">
        <div className="h-[380px]">
          <StatSummary data={appointmentCounts} total={totalAppointments} />
        </div>
        <AvailableDoctors data={availableDoctor as unknown as AvailableDoctorProps} />
        <PatientRatingContainer />
      </div>

    </div>
  );
};

export default PatientDashboard;
