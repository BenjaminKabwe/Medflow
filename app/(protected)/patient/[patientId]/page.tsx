import { MedicalHistoryContainer } from "@/components/medical-history-container";
import { PaymentsContainer } from "@/components/appointment/payment-container";
import { PatientRatingContainer } from "@/components/patient-rating-container";
import { ProfileImage } from "@/components/profile-image";
import { getPatientFullDataById } from "@/utils/services/patient";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { CalendarDays, Phone, MapPin, Users, Clock, Droplets, Heart } from "lucide-react";
import Link from "next/link";
import React from "react";

interface ParamsProps {
  params: Promise<{ patientId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const GENDER_FR: Record<string, string> = {
  MALE: "Homme", FEMALE: "Femme", OTHER: "Autre",
};
const MARITAL_FR: Record<string, string> = {
  SINGLE: "Célibataire", MARRIED: "Marié(e)", DIVORCED: "Divorcé(e)", WIDOWED: "Veuf/Veuve",
};

const PatientProfile = async (props: ParamsProps) => {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const patientId = params.patientId;
  const cat = searchParams?.cat || "medical-history";

  let id = patientId;
  if (patientId === "self") {
    const { userId } = await auth();
    id = userId!;
  }

  const { data } = await getPatientFullDataById(id);

  const InfoItem = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | null | undefined;
  }) => (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
      </div>
      <div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize mt-0.5">
          {value || <span className="text-slate-300 dark:text-slate-600 italic">—</span>}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-row gap-5">

      {/* LEFT */}
      <div className="w-full xl:w-[72%] flex flex-col gap-5">

        {/* Top cards */}
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Avatar card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-6 w-full lg:w-[28%] flex flex-col items-center text-center">
            <ProfileImage
              url={data?.img!}
              name={`${data?.first_name} ${data?.last_name}`}
              className="w-20 h-20"
              bgColor={data?.colorCode!}
              textClassName="text-3xl"
            />
            <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 mt-3 capitalize">
              {`${data?.first_name} ${data?.last_name}`.toLowerCase()}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{data?.email}</p>

            <div className="mt-5 w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
              <CalendarDays className="w-4 h-4 text-sky-500" />
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {data?.totalAppointments ?? 0}
              </p>
              <span className="text-xs text-slate-400">rendez-vous</span>
            </div>
          </div>

          {/* Info card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-6 w-full lg:w-[72%]">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              Informations personnelles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <InfoItem
                icon={Users}
                label="Sexe"
                value={GENDER_FR[data?.gender!] ?? data?.gender}
              />
              <InfoItem
                icon={CalendarDays}
                label="Date de naissance"
                value={data?.date_of_birth ? format(data.date_of_birth, "dd/MM/yyyy") : null}
              />
              <InfoItem
                icon={Phone}
                label="Téléphone"
                value={data?.phone}
              />
              <InfoItem
                icon={Heart}
                label="Situation matrimoniale"
                value={MARITAL_FR[data?.marital_status!] ?? data?.marital_status}
              />
              <InfoItem
                icon={Droplets}
                label="Groupe sanguin"
                value={data?.blood_group}
              />
              <InfoItem
                icon={MapPin}
                label="Adresse"
                value={data?.address}
              />
              <InfoItem
                icon={Users}
                label="Contact d'urgence"
                value={data?.emergency_contact_name}
              />
              <InfoItem
                icon={Phone}
                label="Numéro d'urgence"
                value={data?.emergency_contact_number}
              />
              <InfoItem
                icon={Clock}
                label="Dernière visite"
                value={data?.lastVisit ? format(data.lastVisit, "dd/MM/yyyy") : "Aucune visite"}
              />
            </div>
          </div>
        </div>

        {/* Medical history */}
        {cat === "medical-history" && (
          <MedicalHistoryContainer patientId={id} />
        )}

        {/* Payments */}
        {cat === "payments" && (
          <PaymentsContainer patientId={id} />
        )}
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-[28%] flex flex-col gap-4">

        {/* Quick links */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
            Accès rapide
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/record/appointments?id=${id}`}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
            >
              Mes rendez-vous
            </Link>
            <Link
              href="?cat=medical-history"
              className="px-3 py-2 rounded-xl text-xs font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
            >
              Dossiers médicaux
            </Link>
            <Link
              href="?cat=payments"
              className="px-3 py-2 rounded-xl text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              Factures
            </Link>
            <Link
              href="/patient/prescription"
              className="px-3 py-2 rounded-xl text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
            >
              Ordonnances
            </Link>
            {patientId === "self" && (
              <Link
                href="/patient/registration"
                className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Modifier mon profil
              </Link>
            )}
          </div>
        </div>

        {/* Reviews */}
        <PatientRatingContainer id={id!} />
      </div>
    </div>
  );
};

export default PatientProfile;
