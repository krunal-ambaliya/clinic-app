import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, CalendarClock, Clock3, Plus } from "lucide-react";

import { DOCTOR_SESSION_COOKIE, getDoctorUserByToken } from "@/lib/doctor-auth";
import { formatPrettyDate, listDoctorAppointmentsByName } from "@/lib/doctor-portal-db";

export default async function DoctorPortalDashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(DOCTOR_SESSION_COOKIE)?.value ?? "";
  const doctor = await getDoctorUserByToken(sessionToken);

  if (!doctor) {
    return null;
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const doctorAppointments = await listDoctorAppointmentsByName(doctor.fullName);
  const todayAppointments = doctorAppointments
    .filter((appointment) => appointment.dateIso === todayIso && appointment.status === "confirmed")
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcomingAppointments = doctorAppointments
    .filter((appointment) => appointment.dateIso > todayIso && appointment.status !== "cancelled")
    .slice(0, 4);

  const nextPatient = todayAppointments[0];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#dbe5e1] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60736e]">Daily Snapshot</p>
        <h2 className="mt-2 text-3xl font-extrabold text-[#133a35]">Today at a Glance</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-xl bg-[#ecf5f2] p-4">
            <p className="text-sm text-[#4b615c]">Today count</p>
            <p className="mt-1 text-3xl font-extrabold text-[#0f4f46]">{todayAppointments.length}</p>
          </article>
          <article className="rounded-xl bg-[#ecf5f2] p-4">
            <p className="text-sm text-[#4b615c]">Next patient</p>
            <p className="mt-1 text-lg font-bold text-[#0f4f46]">{nextPatient?.patientName ?? "No more today"}</p>
          </article>
          <article className="rounded-xl bg-[#ecf5f2] p-4">
            <p className="text-sm text-[#4b615c]">Next slot</p>
            <p className="mt-1 text-lg font-bold text-[#0f4f46]">{nextPatient?.time ?? "Done for today"}</p>
          </article>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/doctor-portal/appointments"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0c6a5f] px-4 py-2 text-sm font-semibold text-white"
          >
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            View All Appointments
          </Link>
          <Link
            href="/doctor-portal/appointments/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#e6efec] px-4 py-2 text-sm font-semibold text-[#174742]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Appointment
          </Link>
          <Link
            href="/doctor-portal/availability"
            className="inline-flex items-center gap-2 rounded-xl bg-[#e6efec] px-4 py-2 text-sm font-semibold text-[#174742]"
          >
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Manage Availability
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#dbe5e1] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#133a35]">Today&apos;s Appointments</h3>
            <span className="rounded-full bg-[#e8f4f0] px-3 py-1 text-xs font-semibold text-[#0f4f46]">
              {todayAppointments.length} scheduled
            </span>
          </div>

          <ul className="space-y-3">
            {todayAppointments.length === 0 ? (
              <li className="rounded-xl bg-[#f6f9f8] p-4 text-sm text-[#5e726d]">No appointments scheduled today.</li>
            ) : (
              todayAppointments.map((appointment) => (
                <li key={appointment.id} className="rounded-xl bg-[#f6f9f8] p-4">
                  <p className="text-sm font-semibold text-[#0f4f46]">{appointment.time}</p>
                  <p className="text-base font-bold text-[#1b312d]">{appointment.patientName}</p>
                  <p className="text-sm text-[#5a706b]">{appointment.symptoms}</p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="rounded-2xl border border-[#dbe5e1] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#133a35]">Upcoming Appointments</h3>
            <Link href="/doctor-portal/appointments" className="text-sm font-semibold text-[#0c6a5f]">
              See all
            </Link>
          </div>

          <ul className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <li key={appointment.id} className="rounded-xl bg-[#f6f9f8] p-4">
                <p className="text-sm font-semibold text-[#0f4f46]">{formatPrettyDate(appointment.dateIso)} at {appointment.time}</p>
                <p className="text-base font-bold text-[#1b312d]">{appointment.patientName}</p>
                <Link
                  href={`/doctor-portal/appointments/${appointment.id}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#0c6a5f]"
                >
                  Open detail
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
