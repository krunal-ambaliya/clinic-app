"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, CreditCard, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

import { BookingProgress } from "@/app/components/booking-progress";
import { DoctorSearchInput } from "@/app/components/doctor-search-input";
import { getBookingDraft, markReachedStep, updateBookingDraft } from "@/lib/booking-cache";

const progressSteps = ["Find Doctor", "Schedule", "Patient", "Payment"];

export default function PaymentSummaryPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet">("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState(getBookingDraft());

  useEffect(() => {
    const current = getBookingDraft();
    if (!current.doctor || !current.schedule || !current.patient) {
      router.replace("/find-doctor");
      return;
    }

    markReachedStep(4);

    setDraft(current);

    if (current.payment?.method) {
      setPaymentMethod(current.payment.method);
    }

    setLoaded(true);
  }, [router]);

  if (!loaded || !draft.doctor || !draft.schedule || !draft.patient) {
    return null;
  }

  const subtotal = draft.doctor.consultationFee;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const processing = 2.5;
  const total = Number((subtotal + tax + processing).toFixed(2));

  async function confirmPayment() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const latest = updateBookingDraft({
      payment: {
        method: paymentMethod,
      },
    });

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draft: latest,
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        appointmentId: string;
        status: "BOOKED" | "ALREADY_BOOKED" | "SLOT_UNAVAILABLE";
        message?: string;
      };

      if (!response.ok && result.status === "SLOT_UNAVAILABLE") {
        setMessage(result.message ?? "This slot is not available. Please select another time.");
        return;
      }

      if (!response.ok && result.status === "ALREADY_BOOKED") {
        setMessage("This slot is already booked. Please pick another slot.");
        return;
      }

      if (!response.ok) {
        throw new Error("Payment save failed");
      }

      updateBookingDraft({
        confirmation: {
          appointmentId: result.appointmentId,
          status: "paid",
          paidAt: new Date().toISOString(),
        },
      });

      router.push("/payment-success");
    } catch {
      setMessage("Unable to complete payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#edf2f0] text-[#182221]">
      <header className="border-b border-[#d8e0dd] bg-[#eaf2ef]">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-[2rem] font-bold leading-none tracking-tight text-[#093530]">
              Clinic Booking
            </Link>
            <nav className="hidden gap-6 text-sm md:flex">
              <Link href="/find-doctor" className="border-b-2 border-[#0f6157] pb-1 font-semibold text-[#0f3e38]">
                Find Doctors
              </Link>
            </nav>
          </div>

          <DoctorSearchInput />

          <Link href="/doctor-login" className="rounded-full bg-[#005e52] px-5 py-2 text-sm font-semibold text-white">
            Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-6 pb-20 pt-10">
        <BookingProgress
          steps={progressSteps}
          currentStep={4}
          stepLinks={["/find-doctor", `/doctor/${draft.doctor.id}`, "/patient-details", "/payment-summary"]}
          enableStepNavigation
          className="mx-auto mb-8 max-w-[760px]"
        />

        <div className="mb-6">
          <Link href="/patient-details" className="inline-flex items-center gap-2 text-sm font-semibold text-[#355852]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Patient Details
          </Link>
          <h1 className="mt-2 text-5xl font-extrabold tracking-tight text-[#0d3f37]">Payment Summary</h1>
        </div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <article className="rounded-2xl bg-[#e7ecea] p-5">
              <h2 className="text-xl font-bold text-[#163630]">Booking Summary</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr_1fr] md:items-center">
                <Image
                  src={draft.doctor.photoUrl}
                  alt={draft.doctor.fullName}
                  width={68}
                  height={68}
                  className="h-17 w-17 rounded-xl object-cover"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#5d706c]">Practitioner</p>
                  <p className="text-3xl font-extrabold tracking-tight">{draft.doctor.fullName}</p>
                  <p className="text-[#3f5551]">{draft.doctor.roleTitle}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#5d706c]">Schedule</p>
                  <p className="text-2xl font-bold">{draft.schedule.dateLabel}</p>
                  <p className="text-[#3f5551]">{draft.schedule.slot}</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-[#e7ecea] p-5">
              <h2 className="text-xl font-bold text-[#163630]">Payment Method</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`rounded-2xl border p-4 text-left ${
                    paymentMethod === "card"
                      ? "border-[#005e52] bg-[#f7faf8]"
                      : "border-transparent bg-[#dce3e0]"
                  }`}
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <CreditCard className="h-4 w-4" aria-hidden="true" /> Credit / Debit Card
                  </p>
                  <p className="mt-1 text-sm text-[#4a605b]">Ending in **4291</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("wallet")}
                  className={`rounded-2xl border p-4 text-left ${
                    paymentMethod === "wallet"
                      ? "border-[#005e52] bg-[#f7faf8]"
                      : "border-transparent bg-[#dce3e0]"
                  }`}
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <Wallet className="h-4 w-4" aria-hidden="true" /> Digital Wallet
                  </p>
                  <p className="mt-1 text-sm text-[#4a605b]">PayPal or Apple Pay</p>
                </button>
              </div>
            </article>
          </div>

          <article className="rounded-2xl bg-[#dde4e1] p-5">
            <h2 className="text-2xl font-bold text-[#163630]">Invoice Overview</h2>
            <div className="mt-5 space-y-3 text-[#2d4440]">
              <div className="flex items-center justify-between">
                <span>Consultation Fee</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Clinical Service Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Digital Processing</span>
                <span>${processing.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5 border-t border-[#c4ceca] pt-4">
              <p className="text-xs uppercase tracking-[0.15em] text-[#61746f]">Total Payable</p>
              <p className="mt-1 text-5xl font-extrabold text-[#0d4a42]">${total.toFixed(2)}</p>
            </div>

            <button
              type="button"
              onClick={confirmPayment}
              disabled={isSubmitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#005e52] px-5 py-4 text-lg font-bold text-white transition enabled:hover:bg-[#0c6a5f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="h-5 w-5" aria-hidden="true" />
              {isSubmitting ? "Processing..." : "Pay & Confirm"}
            </button>

            {message ? <p className="mt-3 text-sm font-medium text-[#0f4a42]">{message}</p> : null}
          </article>
        </section>
      </main>
    </div>
  );
}