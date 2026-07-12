import Link from "next/link";
import { Button } from "../ui/button";
import { Appointment } from "@/types/data-types";
import { ProfileImage } from "../profile-image";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { AppointmentStatusIndicator } from "../appointment-status-indicator";
import { ViewAppointment } from "../view-appointment";
import { CalendarClock, ChevronRight } from "lucide-react";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    title: "Rendez-vous récents",
    seeAll: "Voir tout",
    empty: "Aucun rendez-vous récent.",
    headers: ["Patient", "Date", "Heure", "Médecin", "Statut", "Actions"],
    view: "Voir",
  },
  en: {
    title: "Recent appointments",
    seeAll: "View all",
    empty: "No recent appointment.",
    headers: ["Patient", "Date", "Time", "Doctor", "Status", "Actions"],
    view: "View",
  },
};

interface DataProps {
  data: any[];
}

export const RecentAppointments = async ({ data }: DataProps) => {
  const lang = await getLang();
  const t = STR[lang];
  const dateLocale = lang === "en" ? enUS : fr;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
            <CalendarClock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t.title}
          </h2>
        </div>

        <Link href="/record/appointments">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-3 rounded-lg border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 bg-transparent"
          >
            {t.seeAll}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Table */}
      {!data || data.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-400 text-center">
          {t.empty}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                {t.headers.map(
                  (col, i) => (
                    <th
                      key={col}
                      className={`text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider ${
                        i === 1 || i === 2 ? "hidden md:table-cell" : ""
                      } ${i === 3 ? "hidden lg:table-cell" : ""} ${
                        i === 4 ? "hidden xl:table-cell" : ""
                      } ${i === 5 ? "text-right" : ""}`}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((item: Appointment) => {
                const name =
                  (item?.patient?.first_name ?? "") +
                  " " +
                  (item?.patient?.last_name ?? "");

                return (
                  <tr
                    key={item?.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Patient */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <ProfileImage
                          url={item?.patient?.img!}
                          name={name}
                          bgColor={item?.patient?.colorCode!}
                        />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm capitalize">
                            {name.toLowerCase()}
                          </p>
                          <p className="text-xs text-slate-400 capitalize">
                            {item?.patient?.gender?.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-600 dark:text-slate-300 text-sm">
                      {format(new Date(item?.appointment_date), "d MMM yyyy", { locale: dateLocale })}
                    </td>

                    {/* Time */}
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-600 dark:text-slate-300 text-sm font-medium">
                      {item?.time}
                    </td>

                    {/* Doctor */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2.5">
                        <ProfileImage
                          url={item?.doctor?.img!}
                          name={item?.doctor?.name}
                          bgColor={item?.doctor?.colorCode!}
                          className="w-8 h-8"
                        />
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-200 text-sm capitalize">
                            {item?.doctor?.name}
                          </p>
                          <p className="text-xs text-slate-400 capitalize">
                            {item?.doctor?.specialization}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 hidden xl:table-cell">
                      <AppointmentStatusIndicator status={item?.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ViewAppointment id={item?.id} />
                        <Link
                          href={`/record/appointments/${item?.id}`}
                          className="text-xs text-sky-500 hover:text-sky-600 font-medium transition-colors"
                        >
                          {t.view}
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
