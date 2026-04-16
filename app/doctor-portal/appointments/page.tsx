"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Pencil, XCircle } from "lucide-react";

type AppointmentFilter = "today" | "upcoming" | "completed";

type DoctorPortalAppointment = {
  id: number;
  patientName: string;
  phone: string;
  symptoms: string;
  dateIso: string;
  time: string;
  status: "confirmed" | "completed" | "cancelled";
  notes: string;
};

function formatPrettyDate(dateIso: string) {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
  let date: Date;

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateIso);
  }

  if (Number.isNaN(date.getTime())) {
    return dateIso;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusClass(status: string) {
  if (status === "completed") {
    return "bg-[#e6f4ec] text-[#176844]";
  }

  if (status === "cancelled") {
    return "bg-[#f9ecec] text-[#9e3d3d]";
  }

  return "bg-[#e8f4f0] text-[#0f4f46]";
}

export default function DoctorAppointmentsPage() {
  const [filter, setFilter] = useState<AppointmentFilter>("today");
  const [appointments, setAppointments] = useState<DoctorPortalAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAppointments() {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/doctor-portal/appointments?filter=${filter}`);
        const result = (await response.json()) as { appointments?: DoctorPortalAppointment[] };

        if (!cancelled) {
          setAppointments(result.appointments ?? []);
        }
      } catch {
        if (!cancelled) {
          setAppointments([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, [filter]);

  const filteredAppointments = useMemo(() => {
    return appointments;
  }, [appointments]);

  async function updateStatus(id: number, status: "completed" | "cancelled") {
    await fetch("/api/doctor-portal/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: id, status }),
    });

    const response = await fetch(`/api/doctor-portal/appointments?filter=${filter}`);
    const result = (await response.json()) as { appointments?: DoctorPortalAppointment[] };
    setAppointments(result.appointments ?? []);
  }

  async function downloadReceipt(appointment: DoctorPortalAppointment) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const left = 48;
    const right = 547;
    let y = 58;

    doc.setFillColor(232, 244, 240);
    doc.roundedRect(left - 14, y - 28, right - left + 28, 58, 10, 10, "F");

    doc.setTextColor(18, 60, 53);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Clinic Atelier", left, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Appointment Receipt", left, y + 18);

    const now = new Date();
    const issuedAt = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(now);

    y += 72;
    doc.setDrawColor(206, 221, 216);
    doc.line(left, y, right, y);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Receipt Details", left, y);
    y += 18;

    const rows: Array<[string, string]> = [
      ["Receipt ID", `RCPT-${appointment.id}`],
      ["Issued At", issuedAt],
      ["Appointment Date", formatPrettyDate(appointment.dateIso)],
      ["Appointment Time", appointment.time],
      ["Patient Name", appointment.patientName],
      ["Phone", appointment.phone],
      ["Status", appointment.status.toUpperCase()],
    ];

    doc.setFontSize(11);
    for (const [label, value] of rows) {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, left, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, left + 132, y);
      y += 20;
    }

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Symptoms:", left, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    const symptomsText = appointment.symptoms || "No symptoms recorded.";
    const wrappedSymptoms = doc.splitTextToSize(symptomsText, right - left);
    doc.text(wrappedSymptoms, left, y);
    y += wrappedSymptoms.length * 14 + 10;

    doc.setDrawColor(206, 221, 216);
    doc.line(left, y, right, y);
    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(90, 112, 107);
    doc.text("This is a system-generated receipt from Clinic Atelier Doctor Portal.", left, y);

    doc.save(`appointment-receipt-${appointment.id}.pdf`);
  }

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

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { label: "Today", value: "today" },
          { label: "Upcoming", value: "upcoming" },
          { label: "Completed", value: "completed" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value as AppointmentFilter)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filter === item.value ? "bg-[#0c6a5f] text-white" : "bg-[#edf3f1] text-[#244641]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <p className="rounded-xl bg-[#f6f9f8] p-4 text-sm text-[#5e726d]">Loading appointments...</p>
        ) : null}

        {!isLoading && filteredAppointments.length === 0 ? (
          <p className="rounded-xl bg-[#f6f9f8] p-4 text-sm text-[#5e726d]">No appointments in this filter.</p>
        ) : (
          filteredAppointments.map((appointment) => {
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
                      <button
                        type="button"
                        onClick={() => downloadReceipt(appointment)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#e6f4ec] px-3 py-2 text-xs font-semibold text-[#176844]"
                      >
                        Download Receipt
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatus(appointment.id, "completed")}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#e6f4ec] px-3 py-2 text-xs font-semibold text-[#176844]"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Mark as Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(appointment.id, "cancelled")}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#f9ecec] px-3 py-2 text-xs font-semibold text-[#9e3d3d]"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Cancel
                      </button>
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
    </section>
  );
}
