import { AppointmentActionOptions } from "@/components/appointment-actions";
import { AppointmentStatusIndicator } from "@/components/appointment-status-indicator";
import { ProfileImage } from "@/components/profile-image";
import SearchInput from "@/components/search-input";
import { Table } from "@/components/tables/table";
import { ViewAppointment } from "@/components/view-appointment";
import { checkRole, getRole } from "@/utils/roles";
import { DATA_LIMIT } from "@/utils/seetings";
import { getPatientAppointments } from "@/utils/services/appointment";
import { auth } from "@clerk/nextjs/server";
import { Appointment, Doctor, Patient } from "@prisma/client";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import React from "react";
import { Pagination } from "@/components/pagination";
import { AppointmentContainer } from "@/components/appointment-container";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    colPatient: "Patient",
    colDate: "Date",
    colTime: "Heure",
    colDoctor: "Médecin",
    colStatus: "Statut",
    colActions: "Actions",
    male: "Homme",
    female: "Femme",
    title: "Rendez-vous",
    total: "au total",
  },
  en: {
    colPatient: "Patient",
    colDate: "Date",
    colTime: "Time",
    colDoctor: "Doctor",
    colStatus: "Status",
    colActions: "Actions",
    male: "Male",
    female: "Female",
    title: "Appointments",
    total: "in total",
  },
};

interface DataProps extends Appointment {
  patient: Patient;
  doctor: Doctor;
}

const Appointments = async (props: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) => {
  const searchParams = await props.searchParams;
  const userRole = await getRole();
  const { userId } = await auth();
  const isPatient = await checkRole("PATIENT");
  const t = STR[await getLang()];

  const columns = [
    { header: t.colPatient, key: "name" },
    { header: t.colDate, key: "appointment_date", className: "hidden md:table-cell" },
    { header: t.colTime, key: "time", className: "hidden md:table-cell" },
    { header: t.colDoctor, key: "doctor", className: "hidden md:table-cell" },
    { header: t.colStatus, key: "status", className: "hidden xl:table-cell" },
    { header: t.colActions, key: "action" },
  ];

  const page = (searchParams?.p || "1") as string;
  const searchQuery = searchParams?.q || "";
  const id = searchParams?.id || undefined;

  let queryId = undefined;
  if (userRole === "admin" || (userRole === "doctor" && id) || (userRole === "nurse" && id)) {
    queryId = id;
  } else if (userRole === "doctor" || userRole === "patient") {
    queryId = userId;
  }

  const { data, totalPages, totalRecord, currentPage } = await getPatientAppointments({
    page,
    search: searchQuery,
    id: queryId!,
  });

  if (!data) return null;

  const renderItem = (item: DataProps) => {
    const patient_name = `${item?.patient?.first_name} ${item?.patient?.last_name}`;
    const gender =
      item?.patient?.gender === "MALE" ? t.male
      : item?.patient?.gender === "FEMALE" ? t.female
      : String(item?.patient?.gender ?? "").toLowerCase();

    return (
      <tr
        key={item?.id}
        className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <td className="py-3 pr-4">
          <div className="flex items-center gap-3">
            <ProfileImage
              url={item?.patient?.img!}
              name={patient_name}
              bgColor={item?.patient?.colorCode!}
            />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
                {patient_name.toLowerCase()}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{gender}</p>
            </div>
          </div>
        </td>

        <td className="hidden md:table-cell py-3 pr-4 text-slate-600 dark:text-slate-300">
          {format(item?.appointment_date, "dd/MM/yyyy")}
        </td>

        <td className="hidden md:table-cell py-3 pr-4 text-slate-600 dark:text-slate-300">
          {item.time}
        </td>

        <td className="hidden md:table-cell py-3 pr-4">
          <div className="flex items-center gap-2.5">
            <ProfileImage
              url={item.doctor?.img!}
              name={item.doctor?.name}
              bgColor={item?.doctor?.colorCode!}
              textClassName="text-white"
            />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
                {item.doctor?.name?.toLowerCase()}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                {item.doctor?.specialization}
              </p>
            </div>
          </div>
        </td>

        <td className="hidden xl:table-cell py-3 pr-4">
          <AppointmentStatusIndicator status={item.status!} />
        </td>

        <td className="py-3">
          <div className="flex items-center gap-2">
            <ViewAppointment id={item?.id.toString()} />
            <AppointmentActionOptions
              userId={userId!}
              patientId={item?.patient_id}
              doctorId={item?.doctor_id}
              status={item?.status}
              appointmentId={item.id}
            />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <CalendarDays className="w-4.5 h-4.5 text-sky-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
              {t.title}
            </p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
              {totalRecord ?? 0}{" "}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                {t.total}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput />
          {isPatient && <AppointmentContainer id={userId!} />}
        </div>
      </div>

      {/* Table */}
      <Table columns={columns} renderRow={renderItem} data={data} />

      {data?.length > 0 && (
        <div className="mt-4">
          <Pagination
            totalRecords={totalRecord!}
            currentPage={currentPage!}
            totalPages={totalPages!}
            limit={DATA_LIMIT}
          />
        </div>
      )}
    </div>
  );
};

export default Appointments;
