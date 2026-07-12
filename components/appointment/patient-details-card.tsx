import { Patient } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Image from "next/image";
import { calculateAge } from "@/utils";
import { Calendar, Home, Info, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    title: "Détails du patient",
    male: "Homme",
    female: "Femme",
    dob: "Date de naissance",
    address: "Adresse",
    email: "Email",
    phone: "Téléphone",
    doctor: "Médecin traitant",
    activeConditions: "Conditions actives",
    allergies: "Allergies",
  },
  en: {
    title: "Patient details",
    male: "Male",
    female: "Female",
    dob: "Date of birth",
    address: "Address",
    email: "Email",
    phone: "Phone",
    doctor: "Attending doctor",
    activeConditions: "Active conditions",
    allergies: "Allergies",
  },
};

export const PatientDetailsCard = async ({ data }: { data: Patient }) => {
  const lang = await getLang();
  const t = STR[lang];
  const dateLocale = lang === "en" ? enUS : fr;
  return (
    <Card className="shadow-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-800 dark:text-slate-100">{t.title}</CardTitle>
        <div className="relative size-20 xl:size-24 rounded-full overflow-hidden mt-2">
          <Image
            src={data.img || "/user.jpg"}
            alt={data?.first_name}
            width={100}
            height={100}
            className="rounded-full object-cover w-full h-full"
          />
        </div>

        <div className="mt-1">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {data?.first_name} {data?.last_name}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data?.email} - {data?.phone}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data?.gender === "MALE" ? t.male : t.female} -{" "}
            {calculateAge(data?.date_of_birth)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="mt-2 space-y-4">
        <InfoRow icon={<Calendar size={18} />} label={t.dob}>
          {format(new Date(data?.date_of_birth), "d MMM yyyy", { locale: dateLocale })}
        </InfoRow>

        <InfoRow icon={<Home size={18} />} label={t.address}>
          {data?.address}
        </InfoRow>

        <InfoRow icon={<Mail size={18} />} label={t.email}>
          {data?.email}
        </InfoRow>

        <InfoRow icon={<Phone size={18} />} label={t.phone}>
          {data?.phone}
        </InfoRow>

        <InfoRow icon={<Info size={18} />} label={t.doctor}>
          —
        </InfoRow>

        {data?.medical_conditions && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
              {t.activeConditions}
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {data.medical_conditions}
            </p>
          </div>
        )}

        {data?.allergies && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
              {t.allergies}
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {data.allergies}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400 dark:text-slate-500 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">
          {children}
        </p>
      </div>
    </div>
  );
}
