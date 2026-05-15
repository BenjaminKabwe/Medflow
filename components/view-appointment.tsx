import { getAppointmentById } from "@/utils/services/appointment";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { calculateAge, formatDateTime } from "@/utils";
import { ProfileImage } from "./profile-image";
import { Calendar, Phone } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppointmentStatusIndicator } from "./appointment-status-indicator";
import { checkRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";
import { AppointmentAction } from "./appointment-action";

export const ViewAppointment = async ({ id }: { id: string | undefined }) => {
  const { data } = await getAppointmentById(Number(id!));
  const { userId } = await auth();

  if (!data) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-center rounded-full bg-blue-500/10 hover:underline text-blue-600 px-1.5 py-1 text-xs md:text-sm"
        >
          Voir
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-w-[425px] max-h-[95%] md:max-w-2xl 2xl:max-w-3xl p-8 overflow-y-auto
                  bg-white dark:bg-slate-900
                  border-slate-200 dark:border-slate-800"
      >
        <>
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100">
              Rendez-vous patient
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Ce rendez-vous a été réservé le{" "}
              {formatDateTime(data?.created_at.toString())}
            </DialogDescription>
          </DialogHeader>

          {data?.status === "CANCELLED" && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 mt-4 rounded-md border border-yellow-200 dark:border-yellow-700">
              <span className="font-semibold text-sm text-yellow-800 dark:text-yellow-300">
                Ce rendez-vous a été annulé
              </span>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                <strong>Motif</strong> : {data?.reason}
              </p>
            </div>
          )}

          <div className="grid gap-4 py-4">
            <p className="w-fit bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs md:text-sm">
              Informations personnelles
            </p>

            <div className="flex flex-col md:flex-row gap-6 mb-16">
              <div className="flex gap-1 w-full md:w-1/2">
                <ProfileImage
                  url={data?.patient?.img!}
                  name={
                    data?.patient?.first_name + " " + data?.patient?.last_name
                  }
                  className="size-20 bg-blue-500"
                  textClassName="text-2xl"
                />

                <div className="space-y-0.5">
                  <h2 className="text-lg md:text-xl font-semibold uppercase text-slate-800 dark:text-slate-100">
                    {data?.patient?.first_name + " " + data?.patient?.last_name}
                  </h2>

                  <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar size={20} className="text-slate-400 dark:text-slate-500" />
                    {calculateAge(data?.patient?.date_of_birth)}
                  </p>

                  <span className="flex items-center text-sm gap-2 text-slate-600 dark:text-slate-300">
                    <Phone size={16} className="text-slate-400 dark:text-slate-500" />
                    {data?.patient?.phone}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Adresse</span>
                <p className="text-slate-600 dark:text-slate-300 capitalize">
                  {data?.patient?.address}
                </p>
              </div>
            </div>

            <p className="w-fit bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs md:text-sm">
              Informations du rendez-vous
            </p>

            <div className="grid grid-cols-3 gap-10">
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Date</span>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {format(data?.appointment_date, "dd MMM yyyy", { locale: fr })}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Heure</span>
                <p className="text-slate-600 dark:text-slate-300">{data?.time}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Statut</span>
                <AppointmentStatusIndicator status={data?.status} />
              </div>
            </div>

            {data?.note && (
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Note du patient</span>
                <p className="text-slate-600 dark:text-slate-300">{data?.note}</p>
              </div>
            )}

            <p className="w-fit bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 py-1 px-2 rounded text-xs md:text-sm mt-16">
              Informations du médecin
            </p>
            <div className="w-full flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex gap-3">
                <ProfileImage
                  url={data?.doctor?.img!}
                  name={data?.doctor?.name}
                  className="xl:size-20 bg-emerald-600"
                  textClassName="xl:text-2xl"
                />
                <div>
                  <h2 className="text-lg uppercase font-medium text-slate-800 dark:text-slate-100">
                    {data?.doctor?.name}
                  </h2>
                  <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400 capitalize">
                    {data?.doctor?.specialization}
                  </p>
                </div>
              </div>
            </div>

            {((await checkRole("ADMIN")) || data?.doctor_id === userId) && (
              <>
                <p className="w-fit bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 py-1 px-2 rounded text-xs md:text-sm mt-4">
                  Action
                </p>
                <AppointmentAction id={data.id} status={data?.status} />
              </>
            )}
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
};
