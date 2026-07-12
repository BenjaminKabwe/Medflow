"use client";

import { useUser } from "@clerk/nextjs";
import { Patient } from "@/lib/generated/prisma/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Form } from "./ui/form";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientFormSchema } from "@/lib/schema";
import { z } from "zod";
import { CustomInput } from "./custom-input";
import { GENDER, MARITAL_STATUS, RELATION } from "@/lib";
import { Button } from "./ui/button";
import { createNewPatient, updatePatient } from "@/app/actions/patient";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    error: "Échec de la création du patient",
    profilePhoto: "Photo de profil",
    changePhoto: "Changer la photo",
    title: "Inscription patient",
    description:
      "Veuillez fournir toutes les informations ci-dessous afin de nous aider à mieux vous comprendre et à vous offrir un service de qualité.",
    personalInfo: "Information personnelle",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Adresse e-mail",
    genderPh: "Sélectionner le sexe",
    genderLabel: "Sexe",
    dob: "Date de naissance",
    phone: "Numéro de téléphone",
    maritalPh: "Sélectionner la situation matrimoniale",
    maritalLabel: "Situation matrimoniale",
    address: "Adresse",
    familyInfo: "Informations familiales",
    emergencyName: "Nom du contact d'urgence",
    emergencyNumber: "Numéro du contact d'urgence",
    relationPh: "Sélectionner le lien avec le contact",
    relationLabel: "Lien de parenté",
    medicalInfo: "Informations médicales",
    bloodGroup: "Groupe sanguin",
    allergies: "Allergies",
    allergiesPh: "Lait",
    conditions: "Antécédents médicaux",
    history: "Historique médical",
    insurer: "Assureur",
    insuranceNumber: "Numéro d'assurance",
    consent: "Consentement",
    privacyLabel: "Acceptation de la politique de confidentialité",
    privacyText:
      "Je consens à la collecte, au stockage et à l'utilisation de mes données personnelles et médicales conformément à la politique de confidentialité. Je comprends comment mes données seront utilisées, avec qui elles peuvent être partagées, ainsi que mes droits d'accès, de correction et de suppression.",
    serviceLabel: "Acceptation des conditions d'utilisation",
    serviceText:
      "J'accepte les conditions d'utilisation, y compris mes responsabilités en tant qu'utilisateur du système de gestion de santé, les limitations de responsabilité et le processus de résolution des litiges",
    medicalConsentLabel: "Consentement éclairé aux soins médicaux",
    medicalConsentText:
      "Je donne mon consentement éclairé pour recevoir des soins et services médicaux via ce système. Je reconnais avoir été informé de la nature, des risques, des bénéfices et des alternatives des traitements proposés.",
    submit: "Soumettre",
    update: "Mettre à jour",
    genderOpts: { MALE: "Homme", FEMALE: "Femme" } as Record<string, string>,
    maritalOpts: { SINGLE: "Célibataire", MARRIED: "Marié(e)", DIVORCED: "Divorcé(e)", WIDOWED: "Veuf(ve)" } as Record<string, string>,
    relationOpts: { mother: "mère", father: "père", husband: "mari", wife: "épouse", other: "autre" } as Record<string, string>,
  },
  en: {
    error: "Failed to create the patient",
    profilePhoto: "Profile photo",
    changePhoto: "Change photo",
    title: "Patient registration",
    description:
      "Please provide all the information below to help us understand you better and offer you quality service.",
    personalInfo: "Personal information",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    genderPh: "Select gender",
    genderLabel: "Gender",
    dob: "Date of birth",
    phone: "Phone number",
    maritalPh: "Select marital status",
    maritalLabel: "Marital status",
    address: "Address",
    familyInfo: "Family information",
    emergencyName: "Emergency contact name",
    emergencyNumber: "Emergency contact number",
    relationPh: "Select relation to contact",
    relationLabel: "Relationship",
    medicalInfo: "Medical information",
    bloodGroup: "Blood group",
    allergies: "Allergies",
    allergiesPh: "Milk",
    conditions: "Medical conditions",
    history: "Medical history",
    insurer: "Insurance provider",
    insuranceNumber: "Insurance number",
    consent: "Consent",
    privacyLabel: "Acceptance of the privacy policy",
    privacyText:
      "I consent to the collection, storage and use of my personal and medical data in accordance with the privacy policy. I understand how my data will be used, with whom it may be shared, as well as my rights to access, correct and delete it.",
    serviceLabel: "Acceptance of the terms of use",
    serviceText:
      "I accept the terms of use, including my responsibilities as a user of the health management system, the limitations of liability and the dispute resolution process",
    medicalConsentLabel: "Informed consent to medical care",
    medicalConsentText:
      "I give my informed consent to receive medical care and services through this system. I acknowledge having been informed of the nature, risks, benefits and alternatives of the proposed treatments.",
    submit: "Submit",
    update: "Update",
    genderOpts: { MALE: "Male", FEMALE: "Female" } as Record<string, string>,
    maritalOpts: { SINGLE: "Single", MARRIED: "Married", DIVORCED: "Divorced", WIDOWED: "Widowed" } as Record<string, string>,
    relationOpts: { mother: "mother", father: "father", husband: "husband", wife: "wife", other: "other" } as Record<string, string>,
  },
};

interface DataProps {
  data?: Patient;
  type: "create" | "update";
}
export const NewPatient = ({ data, type }: DataProps) => {
  const { user } = useUser();
  const { lang } = useLanguage();
  const t = STR[lang];
  const genderList = GENDER.map((g) => ({ ...g, label: t.genderOpts[g.value] ?? g.label }));
  const maritalList = MARITAL_STATUS.map((m) => ({ ...m, label: t.maritalOpts[m.value] ?? m.label }));
  const relationList = RELATION.map((r) => ({ ...r, label: t.relationOpts[r.value] ?? r.label }));
  const [loading, setLoading] = useState(false);
  const [imgURL, setImgURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImgURL(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const userData = {
    first_name: user?.firstName || "",
    last_name: user?.lastName || "",
    email: user?.emailAddresses[0].emailAddress || "",
    phone: user?.phoneNumbers?.toString() || "",
  };

  const userId = user?.id;
  const form = useForm<z.infer<typeof PatientFormSchema>>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues: {
      ...userData,
      address: "",
      date_of_birth: new Date(),
      gender: "MALE",
      marital_status: "SINGLE",
      emergency_contact_name: "",
      emergency_contact_number: "",
      relation: "mother",
      blood_group: "",
      allergies: "",
      medical_conditions: "",
      insurance_number: "",
      insurance_provider: "",
      medical_history: "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof PatientFormSchema>> = async (
    values
  ) => {
    setLoading(true);

    const res =
      type === "create"
        ? await createNewPatient(values, userId!)
        : await updatePatient(values, userId!);

    setLoading(false);

    if (res?.success) {
      toast.success(res.msg);
      form.reset();
      router.push("/patient");
    } else {
      console.log(res);
      toast.error(t.error);
    }
  };

  useEffect(() => {
    if (type === "create") {
      userData && form.reset({ ...userData });
    } else if (type === "update") {
      data &&
        form.reset({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          date_of_birth: new Date(data.date_of_birth),
          gender: data.gender,
          marital_status: data.marital_status as
            | "SINGLE"
            | "MARRIED"
            | "DIVORCED"
            | "WIDOWED",
          address: data.address,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_number: data.emergency_contact_number,
          relation: data.relation as
            | "mother"
            | "father"
            | "husband"
            | "wife"
            | "other",
          blood_group: data?.blood_group!,
          allergies: data?.allergies! || "",
          medical_conditions: data?.medical_conditions! || "",
          medical_history: data?.medical_history! || "",
          insurance_number: data.insurance_number! || "",
          insurance_provider: data.insurance_provider! || "",
          medical_consent: data.medical_consent,
          privacy_consent: data.privacy_consent,
          service_consent: data.service_consent,
        });
    }
  }, [user]);

  return (
    <Card className="max-w-6xl w-full p-4 ">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>
        {t.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 mt-5"
          >
            <h3 className="text-lg font-semibold">{t.personalInfo}</h3>
            <>
              {/* PROFILE IMAGE */}
              <div className="flex justify-start mb-4">
                <div
                  className="relative w-28 h-28 rounded-full cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imgURL ? (
                    <img
                      src={imgURL}
                      alt={t.profilePhoto}
                      className="w-28 h-28 rounded-full object-cover border-2 border-muted"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center border-2 border-muted overflow-hidden">
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={t.profilePhoto}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-white text-xs text-center leading-tight px-1">{t.changePhoto}</span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <div className="flex flex-col lg:flex-row  gap-y-6 items-center gap-2 md:gap-x-4">
                <CustomInput
                  type="input"
                  control={form.control}
                  name="first_name"
                  placeholder="John"
                  label={t.firstName}
                />
                <CustomInput
                  type="input"
                  control={form.control}
                  name="last_name"
                  placeholder="Doe"
                  label={t.lastName}
                />
              </div>
              <CustomInput
                type="input"
                control={form.control}
                name="email"
                placeholder="john@example.com"
                label={t.email}
              />
              <div className="flex flex-col lg:flex-row  gap-y-6 items-center gap-2 md:gap-x-4">
                <CustomInput
                  type="select"
                  control={form.control}
                  name="gender"
                  placeholder={t.genderPh}
                  label={t.genderLabel}
                  selectList={genderList}
                />
                <CustomInput
                  type="input"
                  control={form.control}
                  name="date_of_birth"
                  placeholder="01-05-2000"
                  label={t.dob}
                  inputType="date"
                />
              </div>
              <div className="flex flex-col lg:flex-row  gap-y-6 items-center gap-2 md:gap-x-4">
                <CustomInput
                  type="input"
                  control={form.control}
                  name="phone"
                  placeholder="9225600735"
                  label={t.phone}
                />
                <CustomInput
                  type="select"
                  control={form.control}
                  name="marital_status"
                  placeholder={t.maritalPh}
                  label={t.maritalLabel}
                  selectList={maritalList}
                />
              </div>
              <CustomInput
                type="input"
                control={form.control}
                name="address"
                placeholder="Av, jasmin 18, Q/Mompono"
                label={t.address}
              />
            </>

            <div className="space-y-8">
              <h3 className="text-lg font-semibold">{t.familyInfo}</h3>
              <CustomInput
                type="input"
                control={form.control}
                name="emergency_contact_name"
                placeholder="Anne Smith"
                label={t.emergencyName}
              />
              <CustomInput
                type="input"
                control={form.control}
                name="emergency_contact_number"
                placeholder="675444467"
                label={t.emergencyNumber}
              />
              <CustomInput
                type="select"
                control={form.control}
                name="relation"
                placeholder={t.relationPh}
                label={t.relationLabel}
                selectList={relationList}
              />
            </div>

            <div className="space-y-8">
              <h3 className="text-lg font-semibold">{t.medicalInfo}</h3>

              <CustomInput
                type="input"
                control={form.control}
                name="blood_group"
                placeholder="A+"
                label={t.bloodGroup}
              />
              <CustomInput
                type="input"
                control={form.control}
                name="allergies"
                placeholder={t.allergiesPh}
                label={t.allergies}
              />
              <CustomInput
                type="input"
                control={form.control}
                name="medical_conditions"
                placeholder={t.conditions}
                label={t.conditions}
              />
              <CustomInput
                type="input"
                control={form.control}
                name="medical_history"
                placeholder={t.history}
                label={t.history}
              />
              <div className="flex flex-col lg:flex-row  gap-y-6 items-center gap-2 md:gap-4">
                <CustomInput
                  type="input"
                  control={form.control}
                  name="insurance_provider"
                  placeholder={t.insurer}
                  label={t.insurer}
                />{" "}
                <CustomInput
                  type="input"
                  control={form.control}
                  name="insurance_number"
                  placeholder={t.insuranceNumber}
                  label={t.insuranceNumber}
                />
              </div>
            </div>

            {type !== "update" && (
              <div className="">
                <h3 className="text-lg font-semibold mb-2">{t.consent}</h3>

                <div className="space-y-6">
                  <CustomInput
                    name="privacy_consent"
                    label={t.privacyLabel}
                    placeholder={t.privacyText}
                    type="checkbox"
                    control={form.control}
                  />

                  <CustomInput
                    control={form.control}
                    type="checkbox"
                    name="service_consent"
                    label={t.serviceLabel}
                    placeholder={t.serviceText}
                  />

                  <CustomInput
                    control={form.control}
                    type="checkbox"
                    name="medical_consent"
                    label={t.medicalConsentLabel}
                    placeholder={t.medicalConsentText}
                  />
                </div>
              </div>
            )}

            <Button
              disabled={loading}
              type="submit"
              className="w-full md:w-fit px-6"
            >
              {type === "create" ? t.submit : t.update}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
