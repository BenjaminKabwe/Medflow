import { MedicalHistoryContainer } from "@/components/medical-history-container";
import { PaymentsContainer } from "@/components/appointment/payment-container";
import { PatientTimeline } from "@/components/patient/patient-timeline";
import { PatientRatingContainer } from "@/components/patient-rating-container";
import { ProfileImage } from "@/components/profile-image";
import { getPatientFullDataById } from "@/utils/services/patient";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { CalendarDays, Phone, MapPin, Users, Clock, Droplets, Heart } from "lucide-react";
import Link from "next/link";
import React from "react";
import { getLang } from "@/lib/i18n-server";

interface ParamsProps {
  params: Promise<{ patientId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const STR = {
  fr: {
    gender: { MALE: "Homme", FEMALE: "Femme", OTHER: "Autre" } as Record<string, string>,
    marital: { SINGLE: "Célibataire", MARRIED: "Marié(e)", DIVORCED: "Divorcé(e)", WIDOWED: "Veuf/Veuve" } as Record<string, string>,
    appointmentsLabel: "rendez-vous",
    personalInfo: "Informations personnelles",
    sex: "Sexe",
    dob: "Date de naissance",
    phone: "Téléphone",
    marital_status: "Situation matrimoniale",
    bloodGroup: "Groupe sanguin",
    address: "Adresse",
    emergencyContact: "Contact d'urgence",
    emergencyNumber: "Numéro d'urgence",
    lastVisit: "Dernière visite",
    noVisit: "Aucune visite",
    quickAccess: "Accès rapide",
    myAppointments: "Mes rendez-vous",
    history: "Historique",
    medicalRecords: "Dossiers médicaux",
    bills: "Factures",
    prescriptions: "Ordonnances",
    editProfile: "Modifier mon profil",
  },
  en: {
    gender: { MALE: "Male", FEMALE: "Female", OTHER: "Other" } as Record<string, string>,
    marital: { SINGLE: "Single", MARRIED: "Married", DIVORCED: "Divorced", WIDOWED: "Widowed" } as Record<string, string>,
    appointmentsLabel: "appointments",
    personalInfo: "Personal information",
    sex: "Gender",
    dob: "Date of birth",
    phone: "Phone",
    marital_status: "Marital status",
    bloodGroup: "Blood group",
    address: "Address",
    emergencyContact: "Emergency contact",
    emergencyNumber: "Emergency number",
    lastVisit: "Last visit",
    noVisit: "No visit",
    quickAccess: "Quick access",
    myAppointments: "My appointments",
    history: "History",
    medicalRecords: "Medical records",
    bills: "Bills",
    prescriptions: "Prescriptions",
    editProfile: "Edit my profile",
  },
};

const PatientProfile = async (props: ParamsProps) => {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const t = STR[await getLang()];
  const GENDER_FR = t.gender;
  const MARITAL_FR = t.marital;

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
              <span className="text-xs text-slate-400">{t.appointmentsLabel}</span>
            </div>
          </div>

          {/* Info card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-6 w-full lg:w-[72%]">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              {t.personalInfo}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <InfoItem
                icon={Users}
                label={t.sex}
                value={GENDER_FR[data?.gender!] ?? data?.gender}
              />
              <InfoItem
                icon={CalendarDays}
                label={t.dob}
                value={data?.date_of_birth ? format(data.date_of_birth, "dd/MM/yyyy") : null}
              />
              <InfoItem
                icon={Phone}
                label={t.phone}
                value={data?.phone}
              />
              <InfoItem
                icon={Heart}
                label={t.marital_status}
                value={MARITAL_FR[data?.marital_status!] ?? data?.marital_status}
              />
              <InfoItem
                icon={Droplets}
                label={t.bloodGroup}
                value={data?.blood_group}
              />
              <InfoItem
                icon={MapPin}
                label={t.address}
                value={data?.address}
              />
              <InfoItem
                icon={Users}
                label={t.emergencyContact}
                value={data?.emergency_contact_name}
              />
              <InfoItem
                icon={Phone}
                label={t.emergencyNumber}
                value={data?.emergency_contact_number}
              />
              <InfoItem
                icon={Clock}
                label={t.lastVisit}
                value={data?.lastVisit ? format(data.lastVisit, "dd/MM/yyyy") : t.noVisit}
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        {cat === "timeline" && <PatientTimeline patientId={id} />}

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
            {t.quickAccess}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/record/appointments?id=${id}`}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
            >
              {t.myAppointments}
            </Link>
            <Link
              href="?cat=timeline"
              className="px-3 py-2 rounded-xl text-xs font-medium bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
            >
              {t.history}
            </Link>
            <Link
              href="?cat=medical-history"
              className="px-3 py-2 rounded-xl text-xs font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
            >
              {t.medicalRecords}
            </Link>
            <Link
              href="?cat=payments"
              className="px-3 py-2 rounded-xl text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              {t.bills}
            </Link>
            <Link
              href="/patient/prescription"
              className="px-3 py-2 rounded-xl text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
            >
              {t.prescriptions}
            </Link>
            {patientId === "self" && (
              <Link
                href="/patient/registration"
                className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {t.editProfile}
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
