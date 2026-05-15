"use client";

import { DiagnosisSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { CardHeader } from "../ui/card";
import { Form } from "../ui/form";
import { CustomInput } from "../custom-input";
import { toast } from "sonner";
import { addDiagnosis } from "@/app/actions/medical";

interface AddDiagnosisProps {
  patientId: string;
  doctorId: string;
  appointmentId: string;
  medicalId: string;
}

export type DiagnosisFormData = z.infer<typeof DiagnosisSchema>;
export const AddDiagnosis = ({
  patientId,
  doctorId,
  appointmentId,
  medicalId,
}: AddDiagnosisProps) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<DiagnosisFormData>({
    resolver: zodResolver(DiagnosisSchema),
    defaultValues: {
      patient_id: patientId,
      medical_id: medicalId,
      doctor_id: doctorId,
      symptoms: "",
      diagnosis: "",
      notes: "",
      prescribed_medications: "",
      follow_up_plan: "",
    },
  });

  const handleOnSubmit = async (data: DiagnosisFormData) => {
    try {
      setLoading(true);

      const res = await addDiagnosis(data, appointmentId);

      if (res.success) {
        toast.success(res.message);
        router.refresh();
        form.reset();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      console.log(error);
      toast.error("Échec de l'ajout du diagnostic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={"outline"}
            size={"lg"}
            className="bg-blue-600 text-white mt-4"
          >
            <Plus size={22} className="text-white" />
            Ajouter un diagnostic
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[60%] 2xl:max-w-[40%]">
          <CardHeader className="px-0">
            <DialogTitle>Nouveau diagnostic</DialogTitle>
            <DialogDescription>
              Veuillez saisir des informations précises et vérifiées pour ce diagnostic.
            </DialogDescription>
          </CardHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleOnSubmit)}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <CustomInput
                  type="textarea"
                  control={form.control}
                  name="symptoms"
                  label="Symptômes"
                  placeholder="Saisir les symptômes ici ..."
                />
              </div>

              <div className="flex items-center gap-4">
                <CustomInput
                  type="textarea"
                  control={form.control}
                  name="diagnosis"
                  placeholder="Saisir le diagnostic ici ..."
                  label="Diagnostic (Résultats)"
                />
              </div>
              <div className="flex items-center gap-4">
                <CustomInput
                  type="textarea"
                  control={form.control}
                  name="prescribed_medications"
                  placeholder="Saisir les prescriptions ici ..."
                  label="Prescriptions pour ce patient"
                />
              </div>

              <div className="flex items-center gap-4">
                <CustomInput
                  type="textarea"
                  control={form.control}
                  name="notes"
                  placeholder="Note optionnelle"
                  label="Notes supplémentaires"
                />
                <CustomInput
                  type="textarea"
                  control={form.control}
                  name="follow_up_plan"
                  placeholder="Optionnel"
                  label="Plan de suivi"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 w-full"
              >
                {loading ? "Envoi en cours..." : "Soumettre"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
