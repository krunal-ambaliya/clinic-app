import { notFound } from "next/navigation";

import { getDoctorById } from "@/api/doctors";
import { DoctorBookingClient } from "@/app/doctor/[id]/doctor-booking-client";

type DoctorDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DoctorDetailsPage({ params }: DoctorDetailsPageProps) {
  const { id } = await params;
  const doctor = await getDoctorById(id);

  if (!doctor) {
    notFound();
  }

  return <DoctorBookingClient doctor={doctor} />;
}