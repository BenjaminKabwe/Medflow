"use client";

import { StaffSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
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
import { CustomInput } from "../custom-input";
import { toast } from "sonner";
import { createNewStaff } from "@/app/actions/admin";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    roleNurse: "Infirmier(e)",
    roleLab: "Laboratoire",
    roleCashier: "Caissier(ère)",
    rolePharmacist: "Pharmacien(ne)",
    success: "Personnel ajouté avec succès !",
    error: "Une erreur est survenue",
    trigger: "Nouveau personnel",
    title: "Ajouter un nouveau personnel",
    typeLabel: "Type",
    namePh: "Nom du personnel",
    nameLabel: "Nom complet",
    emailPh: "jean@exemple.com",
    emailLabel: "Adresse e-mail",
    phoneLabel: "Numéro de contact",
    licensePh: "Numéro de licence",
    licenseLabel: "Numéro de licence",
    deptPh: "Service pédiatrique",
    deptLabel: "Département",
    addressLabel: "Adresse",
    passwordLabel: "Mot de passe",
    submit: "Soumettre",
  },
  en: {
    roleNurse: "Nurse",
    roleLab: "Laboratory",
    roleCashier: "Cashier",
    rolePharmacist: "Pharmacist",
    success: "Staff added successfully!",
    error: "An error occurred",
    trigger: "New staff",
    title: "Add a new staff member",
    typeLabel: "Type",
    namePh: "Staff name",
    nameLabel: "Full name",
    emailPh: "john@example.com",
    emailLabel: "Email address",
    phoneLabel: "Contact number",
    licensePh: "License number",
    licenseLabel: "License number",
    deptPh: "Pediatric ward",
    deptLabel: "Department",
    addressLabel: "Address",
    passwordLabel: "Password",
    submit: "Submit",
  },
};

export const StaffForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];

  const TYPES = [
    { label: t.roleNurse, value: "NURSE" },
    { label: t.roleLab, value: "LAB_TECHNICIAN" },
    { label: t.roleCashier, value: "CASHIER" },
    { label: t.rolePharmacist, value: "PHARMACIST" },
  ];

  const form = useForm<z.infer<typeof StaffSchema>>({
    resolver: zodResolver(StaffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "NURSE",
      address: "",
      department: "",
      img: "",
      password: "",
      license_number: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof StaffSchema>) => {
    try {
      setIsLoading(true);
      const resp = await createNewStaff(values);

      if (resp.success) {
        toast.success(t.success);
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
                name="role"
                label={t.typeLabel}
                placeholder=""
                defaultValue="NURSE"
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
                name="license_number"
                placeholder={t.licensePh}
                label={t.licenseLabel}
              />

              <CustomInput
                type="input"
                control={form.control}
                name="department"
                placeholder={t.deptPh}
                label={t.deptLabel}
              />

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
