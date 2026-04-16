"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";

import { getBookingDraft, type BookingDraft } from "@/lib/booking-cache";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [animate, setAnimate] = useState(false);
  const [draft, setDraft] = useState<BookingDraft | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = getBookingDraft();

      if (!current.doctor || !current.schedule || !current.patient || !current.confirmation) {
        router.replace("/find-doctor");
        return;
      }

      setDraft(current);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [router]);

  useEffect(() => {
    if (!draft?.confirmation) {
      return;
    }

    const timer = window.setTimeout(() => {
      setAnimate(true);
    }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draft?.confirmation]);

  const totals = useMemo(() => {
    const subtotal = draft?.doctor?.consultationFee ?? 0;
    const tax = Number((subtotal * 0.08).toFixed(2));
    const processing = 2.5;
    const total = Number((subtotal + tax + processing).toFixed(2));
    return { subtotal, tax, processing, total };
  }, [draft?.doctor?.consultationFee]);

  if (!draft?.doctor || !draft.schedule || !draft.patient || !draft.confirmation) {
    return null;
  }

  const doctor = draft.doctor;
  const schedule = draft.schedule;
  const patient = draft.patient;
  const confirmation = draft.confirmation;
  const paymentMethod = draft.payment?.method;

  function downloadReceiptPdf() {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Clinic Booking - Payment Receipt", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const rows = [
      ["Appointment ID", confirmation.appointmentId],
      ["Payment Status", "Paid"],
      ["Paid At", new Date(confirmation.paidAt).toLocaleString()],
      ["Doctor", doctor.fullName],
      ["Specialty", doctor.specialty],
      ["Patient", patient.fullName],
      ["Phone", patient.phoneNumber],
      ["Date", schedule.dateLabel],
      ["Time Slot", schedule.slot],
      ["Location", doctor.locationName],
      ["Payment Method", paymentMethod === "wallet" ? "Digital Wallet" : "Card"],
      ["Consultation Fee", `$${totals.subtotal.toFixed(2)}`],
      ["Clinical Service Tax", `$${totals.tax.toFixed(2)}`],
      ["Digital Processing", `$${totals.processing.toFixed(2)}`],
      ["Total Paid", `$${totals.total.toFixed(2)}`],
      ["Symptoms", patient.symptoms || "-"],
      ["Notes", patient.notes || "-"],
    ];

    let y = 34;
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 70, y);
      y += 8;
    });

    doc.save(`clinic-receipt-${confirmation.appointmentId}.pdf`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf2f0] text-[#182221]">
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute left-[20%] top-20 h-4 w-4 rounded-full bg-[#4fd1b8] ${animate ? "animate-ping" : ""}`} />
        <div className={`absolute right-[24%] top-40 h-3 w-3 rounded-full bg-[#1da88d] ${animate ? "animate-ping" : ""}`} style={{ animationDelay: "120ms" }} />
        <div className={`absolute left-[36%] top-32 h-2 w-2 rounded-full bg-[#0f6a5d] ${animate ? "animate-ping" : ""}`} style={{ animationDelay: "220ms" }} />
      </div>

      <main className="mx-auto flex min-h-screen w-full max-w-[860px] items-center px-6 py-14">
        <section className="w-full rounded-3xl bg-[#f7faf8] p-8 shadow-xl shadow-[#0f6157]/10 md:p-10">
          <div className="mx-auto flex max-w-lg flex-col items-center text-center">
            <div className={`rounded-full bg-[#d8efe8] p-4 ${animate ? "scale-100" : "scale-75"} transition-transform duration-500`}>
              <CheckCircle2 className="h-14 w-14 text-[#0f6a5d]" aria-hidden="true" />
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#5b6f6a]">Payment Complete</p>
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight text-[#0d4a42]">Booking Confirmed</h1>
            <p className="mt-3 text-[#45625c]">
              Your appointment has been secured. Receipt and booking details are ready.
            </p>

            <div className="mt-7 w-full rounded-2xl bg-[#e8eeeb] p-5 text-left">
              <p className="text-sm text-[#546a65]">Appointment ID</p>
              <p className="text-2xl font-bold text-[#153a34]">#{confirmation.appointmentId}</p>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-[#35554f] md:grid-cols-2">
                <p><span className="font-semibold">Doctor:</span> {doctor.fullName}</p>
                <p><span className="font-semibold">Patient:</span> {patient.fullName}</p>
                <p><span className="font-semibold">Schedule:</span> {schedule.dateLabel}</p>
                <p><span className="font-semibold">Slot:</span> {schedule.slot}</p>
                <p><span className="font-semibold">Total Paid:</span> ${totals.total.toFixed(2)}</p>
                <p><span className="font-semibold">Payment:</span> {paymentMethod === "wallet" ? "Digital Wallet" : "Card"}</p>
              </div>
            </div>

            <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={downloadReceiptPdf}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#005e52] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0c6a5f]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download PDF Receipt
              </button>

              <Link
                href="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#dce6e2] px-5 py-3 text-sm font-bold text-[#1f403a] transition hover:bg-[#d2dfda]"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Back To Home
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
