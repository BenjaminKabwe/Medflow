"use client";

import { DoctorSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { Form } from "../ui/form";
import { CustomInput, SwitchInput } from "../custom-input";
import { SPECIALIZATION } from "@/utils/seetings";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { createNewDoctor } from "@/app/actions/admin";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    typeFull: "Temps plein",
    typePart: "Temps partiel",
    days: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    needDay: "Veuillez sélectionner au moins un jour de travail",
    success: "Médecin ajouté avec succès !",
    error: "Une erreur est survenue",
    trigger: "Ajouter un médecin",
    title: "Ajouter un nouveau médecin",
    typeLabel: "Type",
    namePh: "Nom du médecin",
    nameLabel: "Nom complet",
    specPh: "Choisir une spécialisation",
    specLabel: "Spécialisation",
    deptLabel: "Département",
    licensePh: "Numéro de licence",
    licenseLabel: "Numéro de licence",
    emailPh: "jean@exemple.com",
    emailLabel: "Adresse e-mail",
    phoneLabel: "Numéro de contact",
    addressLabel: "Adresse",
    passwordLabel: "Mot de passe",
    workingDays: "Jours de travail",
    submit: "Soumettre",
    specializations: {} as Record<string, string>,
  },
  en: {
    typeFull: "Full time",
    typePart: "Part time",
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    needDay: "Please select at least one working day",
    success: "Doctor added successfully!",
    error: "An error occurred",
    trigger: "Add a doctor",
    title: "Add a new doctor",
    typeLabel: "Type",
    namePh: "Doctor's name",
    nameLabel: "Full name",
    specPh: "Choose a specialization",
    specLabel: "Specialization",
    deptLabel: "Department",
    licensePh: "License number",
    licenseLabel: "License number",
    emailPh: "john@example.com",
    emailLabel: "Email address",
    phoneLabel: "Contact number",
    addressLabel: "Address",
    passwordLabel: "Password",
    workingDays: "Working days",
    submit: "Submit",
    specializations: {
      cardiologist: "Cardiologist",
      dermatologist: "Dermatologist",
      endocrinologist: "Endocrinologist",
      gastroenterologist: "Gastroenterologist",
      neurologist: "Neurologist",
      oncologist: "Oncologist",
      "orthopedic surgeon": "Orthopedic surgeon",
      pediatrician: "Pediatrician",
      psychiatrist: "Psychiatrist",
      radiologist: "Radiologist",
      urologist: "Urologist",
      ophthalmologist: "Ophthalmologist",
      "obstetrician/gynecologist": "Obstetrician / Gynecologist",
      anesthesiologist: "Anesthesiologist",
      pulmonologist: "Pulmonologist",
      rheumatologist: "Rheumatologist",
      otolaryngologist: "Otolaryngologist (ENT)",
      nephrologist: "Nephrologist",
      geriatrician: "Geriatrician",
    } as Record<string, string>,
  },
};

const DAY_VALUES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

type Day = {
  day: string;
  start_time?: string;
  close_time?: string;
};

export const DoctorForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];
  const [workSchedule, setWorkSchedule] = useState<Day[]>([]);

  const TYPES = [
    { label: t.typeFull, value: "FULL" },
    { label: t.typePart, value: "PART" },
  ];

  const WORKING_DAYS = DAY_VALUES.map((value, i) => ({
    label: t.days[i],
    value,
  }));

  const specializationList = SPECIALIZATION.map((s) => ({
    ...s,
    label: t.specializations[s.value] ?? s.label,
  }));

  const form = useForm<z.infer<typeof DoctorSchema>>({
    resolver: zodResolver(DoctorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialization: "",
      address: "",
      type: "FULL",
      department: "",
      img: "",
      password: "",
      license_number: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof DoctorSchema>) => {
    try {
      if (workSchedule.length === 0) {
        toast.error(t.needDay);
        return;
      }

      setIsLoading(true);
      const resp = await createNewDoctor({
        ...values,
        work_schedule: workSchedule,
      });

      if (resp.success) {
        toast.success(t.success);

        setWorkSchedule([]);
        form.reset();
        router.refresh();
      } else if (resp.error) {
        toast.error(resp.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSpecialization = form.watch("specialization");

  useEffect(() => {
    if (selectedSpecialization) {
      const department = SPECIALIZATION.find(
        (el) => el.value === selectedSpecialization
      );

      if (department) {
        form.setValue("department", department.department);
      }
    }
  }, [selectedSpecialization]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
          <Plus size={20} />
          {t.trigger}
        </Button>
      </SheetTrigger>

      <SheetContent className="rounded-xl rounded-r-xl md:h-[90%] md:top-[5%] md:right-[1%] w-full overflow-y-scroll">
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
        </SheetHeader>

        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8 mt-5 2xl:mt-10"
            >
              <CustomInput
                type="radio"
                selectList={TYPES}
                control={form.control}
                name="type"
                label={t.typeLabel}
                placeholder=""
                defaultValue="FULL"
              />

              <CustomInput
                type="input"
                control={form.control}
                name="name"
                placeholder={t.namePh}
                label={t.nameLabel}
              />

              <div className="flex items-center gap-2">
                <CustomInput
                  type="select"
                  control={form.control}
                  name="specialization"
                  placeholder={t.specPh}
                  label={t.specLabel}
                  selectList={specializationList}
                />
                <CustomInput
                  type="input"
                  control={form.control}
                  name="department"
                  placeholder="OPD"
                  label={t.deptLabel}
                />
              </div>

              <CustomInput
                type="input"
                control={form.control}
                name="license_number"
                placeholder={t.licensePh}
                label={t.licenseLabel}
              />
              <div className="flex items-center gap-2">
                <CustomInput
                  type="input"
                  control={form.control}
                  name="email"
                  placeholder={t.emailPh}
                  label={t.emailLabel}
                />

                <CustomInput
                  type="input"
                  control={form.control}
                  name="phone"
                  placeholder="0991234567"
                  label={t.phoneLabel}
                />
              </div>

              <CustomInput
                type="input"
                control={form.control}
                name="address"
                placeholder="17 Av. Jasmin, Q/Kauka, C/Kalamu"
                label={t.addressLabel}
              />

              <CustomInput
                type="input"
                control={form.control}
                name="password"
                placeholder=""
                label={t.passwordLabel}
                inputType="password"
              />

              <div className="mt-6">
                <Label>{t.workingDays}</Label>

                <SwitchInput
                  data={WORKING_DAYS}
                  setWorkSchedule={setWorkSchedule}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {t.submit}
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
