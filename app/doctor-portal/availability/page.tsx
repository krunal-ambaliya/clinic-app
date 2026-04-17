import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { ManageAvailabilityClient } from "@/app/doctor-portal/availability/manage-availability-client";
import { DOCTOR_SESSION_COOKIE, getDoctorUserByToken } from "@/lib/doctor-auth";
import { listDoctorAvailability } from "@/lib/doctor-portal-db";

export default async function ManageAvailabilityPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(DOCTOR_SESSION_COOKIE)?.value ?? "";
  const doctor = await getDoctorUserByToken(sessionToken);

  if (!doctor) {
    notFound();
  }

  const availability = await listDoctorAvailability(doctor.id);

  return (
    <ManageAvailabilityClient
      initialSlotDuration={availability.slotDuration}
      initialSchedule={availability.days}
    />
  );
}
