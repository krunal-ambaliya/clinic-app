"use client";

import { useTransition } from "react";

type DownloadReceiptButtonProps = {
  appointment: {
    id: number;
    patientName: string;
    phone: string;
    symptoms: string;
    dateIso: string;
    time: string;
    status: string;
  };
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

export function DownloadReceiptButton({ appointment }: DownloadReceiptButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
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
        });
      }}
      className="inline-flex items-center gap-2 rounded-lg bg-[#e6f4ec] px-3 py-2 text-xs font-semibold text-[#176844] disabled:opacity-70"
      disabled={isPending}
    >
      {isPending ? "Preparing..." : "Download Receipt"}
    </button>
  );
}
