"use client";

import { AppointmentStatus } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useRouter } from "next/navigation";
import { appointmentAction } from "@/app/actions/appointment";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    autoReason: (status: string, date: string) =>
      `Rendez-vous ${status} le ${date}`,
    error: "Une erreur est survenue. Veuillez réessayer.",
    pending: "En attente",
    approve: "Approuver",
    completed: "Terminé",
    cancel: "Annuler",
    reasonPh: "Motif de l'annulation...",
    confirm: "Confirmer cette action ?",
    yes: "Oui",
    dateLocale: "fr-FR",
  },
  en: {
    autoReason: (status: string, date: string) =>
      `Appointment ${status} on ${date}`,
    error: "An error occurred. Please try again.",
    pending: "Pending",
    approve: "Approve",
    completed: "Completed",
    cancel: "Cancel",
    reasonPh: "Cancellation reason...",
    confirm: "Confirm this action?",
    yes: "Yes",
    dateLocale: "en-GB",
  },
};

interface ActionProps {
  id: string | number;
  status: string;
}
export const AppointmentAction = ({ id, status }: ActionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];

  const handleAction = async () => {
    try {
      setIsLoading(true);
      const newReason =
        reason ||
        t.autoReason(
          selected.toLowerCase(),
          new Date().toLocaleDateString(t.dateLocale)
        );

      const resp = await appointmentAction(
        id,
        selected as AppointmentStatus,
        newReason
      );

      if (resp.success) {
        toast.success(resp.msg);

        router.refresh();
      } else if (resp.error) {
        toast.error(resp.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          disabled={status === "PENDING" || isLoading || status === "COMPLETED"}
          className="bg-yellow-200 text-black"
          onClick={() => setSelected("PENDING")}
        >
          {t.pending}
        </Button>
        <Button
          variant="outline"
          disabled={
            status === "SCHEDULED" || isLoading || status === "COMPLETED"
          }
          className="bg-blue-200 text-black"
          onClick={() => setSelected("SCHEDULED")}
        >
          {t.approve}
        </Button>
        <Button
          variant="outline"
          disabled={
            status === "COMPLETED" || isLoading || status === "COMPLETED"
          }
          className="bg-emerald-200 text-black"
          onClick={() => setSelected("COMPLETED")}
        >
          {t.completed}
        </Button>
        <Button
          variant="outline"
          disabled={
            status === "CANCELLED" || isLoading || status === "COMPLETED"
          }
          className="bg-red-200 text-black"
          onClick={() => setSelected("CANCELLED")}
        >
          {t.cancel}
        </Button>
      </div>
      {selected === "CANCELLED" && (
        <>
          <Textarea
            disabled={isLoading}
            className="mt-4"
            placeholder={t.reasonPh}
            onChange={(e) => setReason(e.target.value)}
          ></Textarea>
        </>
      )}

      {selected && (
        <div className="flex items-center justify-between mt-6 bg-red-100 p-4 rounded">
          <p className="">{t.confirm}</p>
          <Button disabled={isLoading} type="button" onClick={handleAction}>
            {t.yes}
          </Button>
        </div>
      )}
    </div>
  );
};
