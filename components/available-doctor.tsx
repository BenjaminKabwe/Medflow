import { AvailableDoctorProps } from "@/types/data-types";
import { checkRole } from "@/utils/roles";
import { daysOfWeek } from "@/utils";
import { cn } from "@/lib/utils";
import { Clock, Stethoscope } from "lucide-react";
import Link from "next/link";
import { ProfileImage } from "./profile-image";

const todayDay = daysOfWeek[new Date().getDay()];

interface Days {
  day: string;
  start_time: string;
  close_time: string;
}

interface DataProps {
  data: AvailableDoctorProps;
}

export const availableDays = ({ data }: { data: Days[] }) => {
  const isTodayWorkingDay = data?.find(
    (d) => d?.day?.toLowerCase() === todayDay
  );
  return isTodayWorkingDay
    ? `${isTodayWorkingDay.start_time} – ${isTodayWorkingDay.close_time}`
    : "Indisponible aujourd'hui";
};

export const AvailableDoctors = async ({ data }: DataProps) => {
  const isAdmin = await checkRole("ADMIN");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Médecins disponibles
          </h2>
        </div>

        {isAdmin && data?.length > 0 && (
          <Link
            href="/record/doctors"
            className="text-xs text-sky-500 hover:text-sky-600 font-medium transition-colors"
          >
            Voir tout
          </Link>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {!data || data.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">
            Aucun médecin disponible aujourd&apos;hui.
          </p>
        ) : (
          data.map((doc, id) => {
            const schedule = availableDays({
              data: doc?.working_days ?? [],
            });
            const isAvailable = !schedule.startsWith("Indisponible");

            return (
              <div
                key={id}
                className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
              >
                <ProfileImage
                  url={doc?.img}
                  name={doc?.name}
                  bgColor={doc?.colorCode ?? undefined}
                  className="w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {doc?.name}
                  </p>
                  <p className="text-xs text-slate-400 capitalize truncate">
                    {doc?.specialization}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                    isAvailable
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}
                >
                  <Clock className="w-3 h-3" />
                  <span>{schedule}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
