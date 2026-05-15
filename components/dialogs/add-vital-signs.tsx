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
      toast.error("Échec de l'ajout des signes vitaux");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-sm font-normal">
          <Plus size={22} className="text-gray-500" /> Ajouter des signes vitaux
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter des signes vitaux</DialogTitle>
          <DialogDescription>
            Saisir les signes vitaux du patient
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
                label="Température corporelle (°C)"
                placeholder="ex : 37.5"
              />
              <CustomInput
                type="input"
                control={form.control}
                name="heartRate"
                placeholder="ex : 72"
                label="Fréquence cardiaque (bpm)"
              />
            </div>

            <div className="flex items-center gap-4">
              <CustomInput
                type="input"
                control={form.control}
                name="systolic"
                placeholder="ex : 120"
                label="Tension systolique"
              />
              <CustomInput
                type="input"
                control={form.control}
                name="diastolic"
                placeholder="ex : 80"
                label="Tension diastolique"
              />
            </div>

            <div className="flex items-center gap-4">
              <CustomInput
                type="input"
                control={form.control}
                name="weight"
                placeholder="ex : 80"
                label="Poids (kg)"
              />
              <CustomInput
                type="input"
                control={form.control}
                name="height"
                placeholder="ex : 175"
                label="Taille (cm)"
              />
            </div>

            <div className="flex items-center gap-4">
              <CustomInput
                type="input"
                control={form.control}
                name="respiratory_rate"
                placeholder="Optionnel"
                label="Fréquence respiratoire"
              />
              <CustomInput
                type="input"
                control={form.control}
                name="oxygen_saturation"
                placeholder="Optionnel"
                label="Saturation en oxygène"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Envoi en cours..." : "Soumettre"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
