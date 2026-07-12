"use client";

import { addVitalSigns } from "@/app/actions/appointment";
import { VitalSignsSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CustomInput } from "../custom-input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Form } from "../ui/form";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    error: "Échec de l'ajout des signes vitaux",
    trigger: "Ajouter des signes vitaux",
    description: "Saisir les signes vitaux du patient",
    temperature: "Température corporelle (°C)",
    heartRate: "Fréquence cardiaque (bpm)",
    systolic: "Tension systolique",
    diastolic: "Tension diastolique",
    weight: "Poids (kg)",
    height: "Taille (cm)",
    respiratory: "Fréquence respiratoire",
    oxygen: "Saturation en oxygène",
    optional: "Optionnel",
    eg: "ex :",
    submitting: "Envoi en cours...",
    submit: "Soumettre",
  },
  en: {
    error: "Failed to add vital signs",
    trigger: "Add vital signs",
    description: "Enter the patient's vital signs",
    temperature: "Body temperature (°C)",
    heartRate: "Heart rate (bpm)",
    systolic: "Systolic pressure",
    diastolic: "Diastolic pressure",
    weight: "Weight (kg)",
    height: "Height (cm)",
    respiratory: "Respiratory rate",
    oxygen: "Oxygen saturation",
    optional: "Optional",
    eg: "e.g.",
    submitting: "Sending...",
    submit: "Submit",
  },
};

interface AddVitalSignsProps {
  patientId: string;
  doctorId: string;
  appointmentId: string;
  medicalId?: string;
}

export type VitalSignsFormData = z.infer<typeof VitalSignsSchema>;

export const AddVitalSigns = ({
  patientId,
  doctorId,
  appointmentId,
  medicalId,
}: AddVitalSignsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];

  const form = useForm<VitalSignsFormData>({
    resolver: zodResolver(VitalSignsSchema),
    defaultValues: {
      patient_id: patientId,
      medical_id: medicalId ?? "",
      body_temperature: undefined,
      heartRate: "",
      systolic: undefined,
      diastolic: undefined,
      respiratory_rate: undefined,
      oxygen_saturation: undefined,
      weight: undefined,
      height: undefined,
    },
  });

  const handleOnSubmit = async (data: VitalSignsFormData) => {
    try {
      setIsLoading(true);

      const res = await addVitalSigns(data, appointmentId, doctorId);

      if (res.success) {
        router.refresh();
        toast.success(res.msg);
        form.reset();
      } else {
        toast.error(res.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-sm font-normal">
          <Plus size={22} className="text-gray-500" /> {t.trigger}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.trigger}</DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleOnSubmit)}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <CustomInput
                type="input"
                control={form.control}
                name="body_temperature"
                label={t.temperature}
                placeholder={`${t.eg} 37.5`}
              />
              <CustomInput
                type="input"
                control={form.control}
                name="heartRate"
                placeholder={`${t.eg} 72`}
                label={t.heartRate}
              />
            </div>

            <div className="flex items-center gap-4">
              <CustomInput
                type="input"
                control={form.control}
                name="systolic"
                placeholder={`${t.eg} 120`}
                label={t.systolic}
              />
              <CustomInput
                type="input"
                control={form.control}
                name="diastolic"
                placeholder={`${t.eg} 80`}
                label={t.diastolic}
              />
            </div>

            <div className="flex items-center gap-4">
              <CustomInput
                type="input"
                control={form.control}
                name="weight"
                placeholder={`${t.eg} 80`}
                label={t.weight}
              />
              <CustomInput
                type="input"
                control={form.control}
                name="height"
                placeholder={`${t.eg} 175`}
                label={t.height}
              />
            </div>

            <div className="flex items-center gap-4">
              <CustomInput
                type="input"
                control={form.control}
                name="respiratory_rate"
                placeholder={t.optional}
                label={t.respiratory}
              />
              <CustomInput
                type="input"
                control={form.control}
                name="oxygen_saturation"
                placeholder={t.optional}
                label={t.oxygen}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? t.submitting : t.submit}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
