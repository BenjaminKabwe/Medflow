"use client";

import { AppointmentSchema } from "@/lib/schema";
import { generateTimes } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Doctor, Patient } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { CalendarPlus } from "lucide-react";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { ProfileImage } from "../profile-image";
import { CustomInput } from "../custom-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { createNewAppointment } from "@/app/actions/appointment";

const TYPES = [
  { label: "Consultation générale",    value: "General Consultation" },
  { label: "Bilan de santé",           value: "General Check Up" },
  { label: "Suivi prénatal",           value: "Antenatal" },
  { label: "Maternité",                value: "Maternity" },
  { label: "Examen de laboratoire",    value: "Lab Test" },
  { label: "Autre",                    value: "ANT" },
];

const GENDER_FR: Record<string, string> = {
  MALE: "Homme",
  FEMALE: "Femme",
};

export const BookAppointment = ({
  data,
  doctors,
}: {
  data: Patient;
  doctors: Doctor[];
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const appointmentTimes = generateTimes(8, 17, 30);
  const patientName = `${data?.first_name} ${data?.last_name}`;

  const form = useForm<z.infer<typeof AppointmentSchema>>({
    resolver: zodResolver(AppointmentSchema),
    defaultValues: {
      doctor_id: "",
      appointment_date: "",
      time: "",
      type: "",
      note: "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof AppointmentSchema>> = async (values) => {
    try {
      setIsSubmitting(true);
      const res = await createNewAppointment({ ...values, patient_id: data?.id! });

      if (res.success) {
        form.reset({});
        router.refresh();
        toast.success("Rendez-vous créé avec succès");
      } else {
        toast.error("Erreur lors de la création du rendez-vous.");
      }
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                           bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-sm">
          <CalendarPlus className="w-4 h-4" />
          Prendre RDV
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-0">
        <div className="h-full overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <SheetTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
              Prise de rendez-vous
            </SheetTitle>
          </SheetHeader>

          <div className="px-6 py-5">
            {/* Patient info card */}
            <div className="flex items-center gap-3 p-3 mb-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <ProfileImage
                url={data?.img!}
                name={patientName}
                className="size-12"
                bgColor={data?.colorCode!}
              />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{patientName}</p>
                <span className="text-xs text-slate-400">
                  {GENDER_FR[data?.gender] ?? data?.gender}
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <CustomInput
                  type="select"
                  selectList={TYPES}
                  control={form.control}
                  name="type"
                  label="Type de consultation"
                  placeholder="Choisir un type"
                />

                <FormField
                  control={form.control}
                  name="doctor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Médecin
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir un médecin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {doctors?.map((doc, idx) => (
                            <SelectItem key={idx} value={doc.id} className="p-2">
                              <div className="flex items-center gap-2 p-1">
                                <ProfileImage
                                  url={doc?.img!}
                                  name={doc?.name}
                                  bgColor={doc?.colorCode!}
                                  textClassName="text-white"
                                />
                                <div>
                                  <p className="font-medium text-sm">{doc.name}</p>
                                  <span className="text-xs text-slate-500">{doc?.specialization}</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <CustomInput
                    type="input"
                    control={form.control}
                    name="appointment_date"
                    placeholder=""
                    label="Date"
                    inputType="date"
                  />
                  <CustomInput
                    type="select"
                    control={form.control}
                    name="time"
                    placeholder="Choisir l'heure"
                    label="Heure"
                    selectList={appointmentTimes}
                  />
                </div>

                <CustomInput
                  type="textarea"
                  control={form.control}
                  name="note"
                  placeholder="Informations supplémentaires..."
                  label="Note (facultatif)"
                />

                <Button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl h-11"
                >
                  {isSubmitting ? "Enregistrement..." : "Confirmer le rendez-vous"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
