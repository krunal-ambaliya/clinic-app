import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileText, Pencil, XCircle } from "lucide-react";

import { updateAppointmentStatusAction } from "@/app/doctor-portal/actions";
import { AppointmentsFilterTabs, type AppointmentFilter } from "@/app/doctor-portal/appointments/appointments-filter-tabs";
import { DownloadReceiptButton } from "@/app/doctor-portal/appointments/download-receipt-button";
import { DOCTOR_SESSION_COOKIE, getDoctorUserByToken } from "@/lib/doctor-auth";
import { formatPrettyDate, listDoctorAppointmentsPage } from "@/lib/doctor-portal-db";

type DoctorAppointmentsPageProps = {
  searchParams?: Promise<{ filter?: string; page?: string }>;
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

function normalizeFilter(filter: string | undefined): AppointmentFilter {
  if (filter === "upcoming" || filter === "completed") {
    return filter;
  }

  return "today";
}

function normalizePage(page: string | undefined) {
  const parsed = Number(page ?? "1");
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 1;
}

function AppointmentsPageSkeleton() {
  return (
    <section className="rounded-2xl border border-[#dbe5e1] bg-white p-6 shadow-sm">
      <div className="mb-5 h-20 animate-pulse rounded-xl bg-[#edf3f1]" />
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-[#f6f9f8]" />
        <div className="h-24 animate-pulse rounded-xl bg-[#f6f9f8]" />
        <div className="h-24 animate-pulse rounded-xl bg-[#f6f9f8]" />
      </div>
    </section>
  );
}

async function AppointmentsContent({ searchParams }: DoctorAppointmentsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filter = normalizeFilter(resolvedSearchParams?.filter);
  const page = normalizePage(resolvedSearchParams?.page);

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(DOCTOR_SESSION_COOKIE)?.value ?? "";
  const doctor = await getDoctorUserByToken(sessionToken);

  if (!doctor) {
    notFound();
  }

  const result = await listDoctorAppointmentsPage({
    doctorName: doctor.fullName,
    filter,
    page,
    pageSize: 12,
  });

  const previousPage = Math.max(1, result.page - 1);
  const nextPage = Math.min(result.totalPages, result.page + 1);

  return (
    <section className="rounded-2xl border border-[#dbe5e1] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60736e]">Appointments</p>
          <h2 className="mt-1 text-3xl font-extrabold text-[#133a35]">Manage Appointments</h2>
        </div>

        <Link
          href="/doctor-portal/appointments/new"
          className="rounded-xl bg-[#0c6a5f] px-4 py-2 text-sm font-semibold text-white"
        >
          Add Appointment
        </Link>
      </div>

      <AppointmentsFilterTabs filter={filter} />

      <div className="mt-5 space-y-3">
        {result.appointments.length === 0 ? (
          <p className="rounded-xl bg-[#f6f9f8] p-4 text-sm text-[#5e726d]">No appointments in this filter.</p>
        ) : (
          result.appointments.map((appointment) => {
            const currentStatus = appointment.status;

            return (
              <article key={appointment.id} className="rounded-xl border border-[#e2ebe8] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0f4f46]">
                      {formatPrettyDate(appointment.dateIso)} | {appointment.time}
                    </p>
                    <h3 className="text-lg font-bold text-[#19342f]">{appointment.patientName}</h3>
                    <p className="text-sm text-[#566e69]">{appointment.phone}</p>
                    <p className="mt-1 text-sm text-[#566e69]">{appointment.symptoms}</p>
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(currentStatus)}`}>
                    {currentStatus}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {currentStatus === "completed" ? (
                    <>
                      <Link
                        href={`/doctor-portal/reports/${appointment.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#edf3f1] px-3 py-2 text-xs font-semibold text-[#1f4a43]"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        View Report
                      </Link>
                      <DownloadReceiptButton appointment={appointment} />
                    </>
                  ) : (
                    <>
                      <form action={updateAppointmentStatusAction}>
                        <input type="hidden" name="appointmentId" value={appointment.id} />
                        <input type="hidden" name="status" value="completed" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#e6f4ec] px-3 py-2 text-xs font-semibold text-[#176844]"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Mark as Completed
                        </button>
                      </form>
                      <form action={updateAppointmentStatusAction}>
                        <input type="hidden" name="appointmentId" value={appointment.id} />
                        <input type="hidden" name="status" value="cancelled" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#f9ecec] px-3 py-2 text-xs font-semibold text-[#9e3d3d]"
                        >
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Cancel
                        </button>
                      </form>
                      <Link
                        href={`/doctor-portal/appointments/${appointment.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#edf3f1] px-3 py-2 text-xs font-semibold text-[#1f4a43]"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Link>
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs font-semibold text-[#5e726d]">
          Showing page {result.page} of {result.totalPages} ({result.totalCount} total)
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={`/doctor-portal/appointments?filter=${filter}&page=${previousPage}`}
            className="rounded-lg bg-[#edf3f1] px-3 py-2 text-xs font-semibold text-[#1f4a43]"
            aria-disabled={result.page <= 1}
          >
            Previous
          </Link>
          <Link
            href={`/doctor-portal/appointments?filter=${filter}&page=${nextPage}`}
            className="rounded-lg bg-[#edf3f1] px-3 py-2 text-xs font-semibold text-[#1f4a43]"
            aria-disabled={result.page >= result.totalPages}
          >
            Next
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function DoctorAppointmentsPage({ searchParams }: DoctorAppointmentsPageProps) {
  return (
    <Suspense fallback={<AppointmentsPageSkeleton />}>
      <AppointmentsContent searchParams={searchParams} />
    </Suspense>
  );
}
