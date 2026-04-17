"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { DOCTOR_SESSION_COOKIE, getDoctorUserByToken } from "@/lib/doctor-auth";
import { saveDoctorAvailability, updateDoctorAppointmentStatus } from "@/lib/doctor-portal-db";

async function getDoctorForAction() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(DOCTOR_SESSION_COOKIE)?.value ?? "";
  return getDoctorUserByToken(sessionToken);
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const doctor = await getDoctorForAction();

  if (!doctor) {
    return;
  }

  const appointmentIdRaw = String(formData.get("appointmentId") ?? "");
  const statusRaw = String(formData.get("status") ?? "").trim().toLowerCase();

  const appointmentId = Number(appointmentIdRaw);
  const status =
    statusRaw === "completed" || statusRaw === "cancelled"
      ? (statusRaw as "completed" | "cancelled")
      : null;

  if (!Number.isFinite(appointmentId) || !status) {
    return;
  }

  await updateDoctorAppointmentStatus({
    doctorName: doctor.fullName,
    appointmentId,
    status,
  });

  revalidatePath("/doctor-portal");
  revalidatePath("/doctor-portal/appointments");
  revalidatePath(`/doctor-portal/appointments/${appointmentId}`);
  revalidatePath(`/doctor-portal/reports/${appointmentId}`);
}

type AvailabilityDayInput = {
  dayName: string;
  enabled: boolean;
  start: string;
  end: string;
};

export async function saveAvailabilityAction(input: {
  slotDuration: number;
  days: AvailabilityDayInput[];
}) {
  const doctor = await getDoctorForAction();

  if (!doctor) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const slotDuration = input.slotDuration === 15 ? 15 : 30;
  const days = Array.isArray(input.days) ? input.days : [];

  if (days.length === 0) {
    return { ok: false as const, error: "Schedule is required." };
  }

  await saveDoctorAvailability({
    doctorUserId: doctor.id,
    slotDuration,
    days: days.map((day) => ({
      dayName: day.dayName,
      enabled: Boolean(day.enabled),
      start: day.start,
      end: day.end,
    })),
  });

  revalidatePath("/doctor-portal/availability");
  revalidatePath("/doctor-portal");

  return { ok: true as const };
}
