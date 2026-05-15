import db from "@/lib/db";
import { unstable_cache } from "next/cache";
import { daysOfWeek } from "..";
import { processAppointments } from "./patient";

const _getAdminDashboardStats = async () => {
  const todayDate = new Date().getDay();
  const today = daysOfWeek[todayDate].toUpperCase() as import("@prisma/client").WeekDay;

  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const [totalPatient, totalDoctors, totalAppointments, appointments, doctors] =
    await Promise.all([
      db.patient.count(),
      db.doctor.count(),
      // Fast count — no data transfer
      db.appointment.count(),
      // Only current-year appointments for the chart + last 5
      db.appointment.findMany({
        where: { appointment_date: { gte: yearStart } },
        include: {
          patient: {
            select: {
              id: true,
              last_name: true,
              first_name: true,
              img: true,
              colorCode: true,
              gender: true,
              date_of_birth: true,
            },
          },
          doctor: {
            select: {
              name: true,
              img: true,
              colorCode: true,
              specialization: true,
            },
          },
        },
        orderBy: { appointment_date: "desc" },
      }),
      db.doctor.findMany({
        select: {
          id: true,
          name: true,
          specialization: true,
          img: true,
          colorCode: true,
          working_days: {
            select: { day: true, start_time: true, close_time: true },
          },
        },
        take: 5,
      }),
    ]);

  const { appointmentCounts, monthlyData } = await processAppointments(appointments);
  const last5Records = appointments.slice(0, 5);

  return {
    success: true,
    totalPatient,
    totalDoctors,
    appointmentCounts,
    availableDoctors: doctors,
    monthlyData,
    last5Records,
    totalAppointments,
    status: 200,
  };
};

export const getAdminDashboardStats = unstable_cache(
  _getAdminDashboardStats,
  ["admin-dashboard-stats"],
  { revalidate: 60, tags: ["admin-stats"] }
);

export async function getServices() {
  try {
    const data = await db.services.findMany({
      orderBy: { id: "asc" },
    });

    if (!data) {
      return {
        success: false,
        message: "Data not found",
        status: 404,
        data: [],
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}
