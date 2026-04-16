import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Phone, XCircle } from "lucide-react";

import { DOCTOR_SESSION_COOKIE, getDoctorUserByToken } from "@/lib/doctor-auth";
import { formatPrettyDate, getDoctorAppointmentById } from "@/lib/doctor-portal-db";

type AppointmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

function statusClass(status: string) {
  if (status === "completed") {
    return "bg-[#e6f4ec] text-[#176844]";
  }

  if (status === "cancelled") {
    return "bg-[#f9ecec] text-[#9e3d3d]";
  }

  return "bg-[#e8f4f0] text-[#0f4f46]";
}

export default async function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(DOCTOR_SESSION_COOKIE)?.value ?? "";
  const doctor = await getDoctorUserByToken(sessionToken);

  if (!doctor) {
    notFound();
  }

  const { id } = await params;
  const appointment = await getDoctorAppointmentById(doctor.fullName, Number(id));

  if (!appointment) {
    notFound();
  }

  return (
    <section className="rounded-2xl border border-[#dbe5e1] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60736e]">Appointment Detail</p>
          <h2 className="mt-1 text-3xl font-extrabold text-[#133a35]">{appointment.patientName}</h2>
          <p className="mt-2 text-sm text-[#5e726d]">
            {formatPrettyDate(appointment.dateIso)} at {appointment.time}
          </p>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(appointment.status)}`}>
          {appointment.status}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-xl bg-[#f6f9f8] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#60736e]">Patient Contact</p>
          <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-[#173b36]">
            <Phone className="h-4 w-4" aria-hidden="true" />
            {appointment.phone}
          </p>
        </article>

        <article className="rounded-xl bg-[#f6f9f8] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#60736e]">Symptoms</p>
          <p className="mt-2 text-base text-[#173b36]">{appointment.symptoms}</p>
        </article>
      </div>

      <article className="mt-4 rounded-xl bg-[#f6f9f8] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#60736e]">Notes</p>
        <p className="mt-2 text-base text-[#173b36]">{appointment.notes}</p>
      </article>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-[#e6f4ec] px-3 py-2 text-xs font-semibold text-[#176844]"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Mark as Completed
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-[#f9ecec] px-3 py-2 text-xs font-semibold text-[#9e3d3d]"
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Cancel Appointment
        </button>
        <Link
          href="/doctor-portal/appointments"
          className="inline-flex items-center rounded-lg bg-[#edf3f1] px-3 py-2 text-xs font-semibold text-[#1f4a43]"
        >
          Back to list
        </Link>
      </div>
    </section>
  );
}
