import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React from "react";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: { title: "Historique médical", desc: "Historique médical du patient" },
  en: { title: "Medical history", desc: "Patient's medical history" },
};

interface DataProps {
  id: string | number;
  patientId: string;
  medicalId?: string;
  doctor_id: string | number;
  label: React.ReactNode;
}
export const MedicalHistoryDialog = async ({
  id,
  patientId,
  doctor_id,
  label,
}: DataProps) => {
  const t = STR[await getLang()];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-center rounded-full bg-blue-600/10 hover:underline text-blue-600 px-1.5 py-1 text-xs md:text-sm"
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90%] max-w-[425px] md:max-w-2xl 2xl:max-w-4xl p-8 overflow-y-auto">
        <DialogTitle className="sr-only">{t.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {t.desc}
        </DialogDescription>
        {/* <DiagnosisContainer
          id={id}
          patientId={patientId!}
          doctor_id={doctor_id!}
        /> */}

        <p>Diagnosis container form</p>
      </DialogContent>
    </Dialog>
  );
};
