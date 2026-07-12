"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Ban, Check } from "lucide-react";
import { MdCancel } from "react-icons/md";
import { GiConfirmed } from "react-icons/gi";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { appointmentAction } from "@/app/actions/appointment";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    provideReason: "Veuillez indiquer un motif d'annulation.",
    errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
    autoReason: (approved: boolean, date: string) =>
      `Rendez-vous ${approved ? "planifié" : "annulé"} le ${date}`,
    approve: "Approuver",
    cancel: "Annuler",
    confirmTitle: "Confirmation du rendez-vous",
    cancelTitle: "Annulation du rendez-vous",
    confirmDesc:
      "Vous êtes sur le point de confirmer ce rendez-vous. Oui pour approuver ou Non pour annuler.",
    cancelDesc: "Êtes-vous sûr de vouloir annuler ce rendez-vous ?",
    reasonPh: "Motif de l'annulation...",
    yesApprove: "Oui, approuver",
    yesCancel: "Oui, annuler",
    no: "Non",
    dateLocale: "fr-FR",
  },
  en: {
    provideReason: "Please provide a cancellation reason.",
    errorGeneric: "An error occurred. Please try again.",
    autoReason: (approved: boolean, date: string) =>
      `Appointment ${approved ? "scheduled" : "cancelled"} on ${date}`,
    approve: "Approve",
    cancel: "Cancel",
    confirmTitle: "Appointment confirmation",
    cancelTitle: "Appointment cancellation",
    confirmDesc:
      "You are about to confirm this appointment. Yes to approve or No to cancel.",
    cancelDesc: "Are you sure you want to cancel this appointment?",
    reasonPh: "Cancellation reason...",
    yesApprove: "Yes, approve",
    yesCancel: "Yes, cancel",
    no: "No",
    dateLocale: "en-GB",
  },
};

interface ActionsProps {
  type: "approve" | "cancel";
  id: string | number;
  disabled: boolean;
}

export const AppointmentActionDialog = ({
  type,
  id,
  disabled,
}: ActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];

  const handleAction = async () => {
    if (type === "cancel" && !reason) {
      toast.error(t.provideReason);
      return;
    }

    try {
      setIsLoading(true);
      const newReason =
        reason ||
        t.autoReason(
          type === "approve",
          new Date().toLocaleDateString(t.dateLocale)
        );

      const resp = await appointmentAction(
        id,
        type === "approve" ? "SCHEDULED" : "CANCELLED",
        newReason
      );

      if (resp.success) {
        toast.success(resp.msg);
        setReason("");
        router.refresh();
      } else if (resp.error) {
        toast.error(resp.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error(t.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild disabled={!disabled}>
        {type === "approve" ? (
          <Button size="sm" variant="ghost" className="w-full justify-start">
            <Check size={16} /> {t.approve}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full flex items-center justify-start gap-2 rounded-full text-red-500 disabled:cursor-not-allowed"
          >
            <Ban size={16} /> {t.cancel}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <div className="flex flex-col items-center justify-center py-6">
          <DialogTitle>
            {type === "approve" ? (
              <div className="bg-emerald-200 p-4 rounded-full mb-2">
                <GiConfirmed size={50} className="text-emerald-500" />
              </div>
            ) : (
              <div className="bg-red-200 p-4 rounded-full mb-2">
                <MdCancel size={50} className="text-red-500" />
              </div>
            )}
          </DialogTitle>

          <span className="text-xl text-black">
            {type === "approve" ? t.confirmTitle : t.cancelTitle}
          </span>
          <DialogDescription className="text-sm text-center text-gray-500">
            {type === "approve" ? t.confirmDesc : t.cancelDesc}
          </DialogDescription>

          {type == "cancel" && (
            <Textarea
              disabled={isLoading}
              className="mt-4"
              placeholder={t.reasonPh}
              onChange={(e) => setReason(e.target.value)}
            ></Textarea>
          )}

          <div className="flex justify-center mt-6 items-center gap-x-4">
            <Button
              disabled={isLoading}
              onClick={() => handleAction()}
              variant="outline"
              className={cn(
                "px-4 py-2 text-sm font-medium text-white hover:text-white hover:underline",
                type === "approve"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-destructive hover:bg-destructive"
              )}
            >
              {type === "approve" ? t.yesApprove : t.yesCancel}
            </Button>
            <DialogClose asChild>
              <Button
                variant="outline"
                className="px-4 py-2 text-sm underline text-gray-500"
              >
                {t.no}
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
