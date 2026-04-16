import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Phone } from "lucide-react";

import { PrintReportButton } from "@/app/components/print-report-button";
import { DOCTOR_SESSION_COOKIE, getDoctorUserByToken } from "@/lib/doctor-auth";
import { formatPrettyDate, getDoctorAppointmentById } from "@/lib/doctor-portal-db";

type DoctorReportPageProps = {
  params: Promise<{ id: string }>;
};

function statusLabel(status: string) {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return "Confirmed";
}

export default async function DoctorReportPage({ params }: DoctorReportPageProps) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60736e]">Patient Report</p>
          <h2 className="mt-1 inline-flex items-center gap-2 text-3xl font-extrabold text-[#133a35]">
            <FileText className="h-7 w-7" aria-hidden="true" />
            Consultation Report
          </h2>
          <p className="mt-2 text-sm text-[#5e726d]">Report ID: RPT-{appointment.id}</p>
        </div>

        <span className="rounded-full bg-[#e8f4f0] px-3 py-1 text-xs font-semibold text-[#0f4f46]">
          {statusLabel(appointment.status)}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-xl bg-[#f6f9f8] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#60736e]">Patient Name</p>
          <p className="mt-2 text-lg font-bold text-[#173b36]">{appointment.patientName}</p>
        </article>

        <article className="rounded-xl bg-[#f6f9f8] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#60736e]">Contact</p>
          <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-[#173b36]">
            <Phone className="h-4 w-4" aria-hidden="true" />
            {appointment.phone}
          </p>
        </article>

        <article className="rounded-xl bg-[#f6f9f8] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#60736e]">Consultation Date</p>
          <p className="mt-2 text-base font-semibold text-[#173b36]">{formatPrettyDate(appointment.dateIso)}</p>
        </article>

        <article className="rounded-xl bg-[#f6f9f8] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#60736e]">Consultation Time</p>
          <p className="mt-2 text-base font-semibold text-[#173b36]">{appointment.time}</p>
        </article>
      </div>

      <article className="mt-4 rounded-xl bg-[#f6f9f8] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#60736e]">Symptoms</p>
        <p className="mt-2 text-base text-[#173b36]">{appointment.symptoms || "No symptoms recorded."}</p>
      </article>

      <article className="mt-4 rounded-xl bg-[#f6f9f8] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#60736e]">Doctor Notes</p>
        <p className="mt-2 text-base text-[#173b36]">{appointment.notes || "No notes recorded."}</p>
      </article>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/doctor-portal/appointments?filter=completed"
          className="inline-flex items-center rounded-lg bg-[#edf3f1] px-3 py-2 text-xs font-semibold text-[#1f4a43]"
        >
          Back to Completed
        </Link>
        <PrintReportButton />
      </div>
    </section>
  );
}
