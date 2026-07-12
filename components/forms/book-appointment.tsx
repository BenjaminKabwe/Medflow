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
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    types: [
      { label: "Consultation générale", value: "General Consultation" },
      { label: "Bilan de santé", value: "General Check Up" },
      { label: "Suivi prénatal", value: "Antenatal" },
      { label: "Maternité", value: "Maternity" },
      { label: "Examen de laboratoire", value: "Lab Test" },
      { label: "Autre", value: "ANT" },
    ],
    gender: { MALE: "Homme", FEMALE: "Femme" } as Record<string, string>,
    success: "Rendez-vous créé avec succès",
    errorCreate: "Erreur lors de la création du rendez-vous.",
    errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
    trigger: "Prendre RDV",
    title: "Prise de rendez-vous",
    typeLabel: "Type de consultation",
    typePh: "Choisir un type",
    doctorLabel: "Médecin",
    doctorPh: "Choisir un médecin",
    dateLabel: "Date",
    timePh: "Choisir l'heure",
    timeLabel: "Heure",
    notePh: "Informations supplémentaires...",
    noteLabel: "Note (facultatif)",
    saving: "Enregistrement...",
    confirm: "Confirmer le rendez-vous",
  },
  en: {
    types: [
      { label: "General consultation", value: "General Consultation" },
      { label: "Health check-up", value: "General Check Up" },
      { label: "Antenatal care", value: "Antenatal" },
      { label: "Maternity", value: "Maternity" },
      { label: "Laboratory test", value: "Lab Test" },
      { label: "Other", value: "ANT" },
    ],
    gender: { MALE: "Male", FEMALE: "Female" } as Record<string, string>,
    success: "Appointment created successfully",
    errorCreate: "Error while creating the appointment.",
    errorGeneric: "An error occurred. Please try again.",
    trigger: "Book appointment",
    title: "Book an appointment",
    typeLabel: "Consultation type",
    typePh: "Choose a type",
    doctorLabel: "Doctor",
    doctorPh: "Choose a doctor",
    dateLabel: "Date",
    timePh: "Choose a time",
    timeLabel: "Time",
    notePh: "Additional information...",
    noteLabel: "Note (optional)",
    saving: "Saving...",
    confirm: "Confirm appointment",
  },
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
  const { lang } = useLanguage();
  const t = STR[lang];
  const TYPES = t.types;
  const GENDER_FR = t.gender;

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
        toast.success(t.success);
      } else {
        toast.error(t.errorCreate);
      }
    } catch {
      toast.error(t.errorGeneric);
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
          {t.trigger}
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-0">
        <div className="h-full overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <SheetTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
              {t.title}
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
                  label={t.typeLabel}
                  placeholder={t.typePh}
                />

                <FormField
                  control={form.control}
                  name="doctor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t.doctorLabel}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.doctorPh} />
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
                    label={t.dateLabel}
                    inputType="date"
                  />
                  <CustomInput
                    type="select"
                    control={form.control}
                    name="time"
                    placeholder={t.timePh}
                    label={t.timeLabel}
                    selectList={appointmentTimes}
                  />
                </div>

                <CustomInput
                  type="textarea"
                  control={form.control}
                  name="note"
                  placeholder={t.notePh}
                  label={t.noteLabel}
                />

                <Button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl h-11"
                >
                  {isSubmitting ? t.saving : t.confirm}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
