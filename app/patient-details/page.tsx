"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LifeBuoy, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { BookingProgress } from "@/app/components/booking-progress";
import {
  getBookingDraft,
  hasUnlockedProgressNavigation,
  markReachedStep,
  updateBookingDraft,
} from "@/lib/booking-cache";

const progressSteps = ["Find Doctor", "Schedule", "Patient", "Payment"];

function sanitizePhoneNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export default function PatientDetailsPage() {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [enableStepNavigation, setEnableStepNavigation] = useState(false);
  const [formState, setFormState] = useState({
    fullName: "",
    phoneNumber: "",
    symptoms: "",
    notes: "",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const draft = getBookingDraft();

      markReachedStep(3);
      setEnableStepNavigation(hasUnlockedProgressNavigation());

      if (!draft.doctor || !draft.schedule) {
        router.replace("/find-doctor");
        return;
      }

      setDoctorId(draft.doctor.id);
      setFormState({
        fullName: draft.patient?.fullName ?? "",
        phoneNumber: sanitizePhoneNumber(draft.patient?.phoneNumber ?? ""),
        symptoms: draft.patient?.symptoms ?? "",
        notes: draft.patient?.notes ?? "",
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [router]);

  const isNameValid = formState.fullName.trim().length > 1;
  const isPhoneValid = /^\d{10}$/.test(formState.phoneNumber);
  const canContinue = isNameValid && isPhoneValid;

  const stepLinks = useMemo(() => {
    return [
      "/find-doctor",
      doctorId ? `/doctor/${doctorId}` : "/find-doctor",
      "/patient-details",
      "/payment-summary",
    ];
  }, [doctorId]);

  function continueToPayment() {
    if (!canContinue) {
      return;
    }

    updateBookingDraft({
      patient: {
        fullName: formState.fullName.trim(),
        phoneNumber: formState.phoneNumber,
        symptoms: formState.symptoms.trim(),
        notes: formState.notes.trim(),
      },
    });

    router.push("/payment-summary");
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
              <a href="#" className="text-[#4f6460] hover:text-[#0f6157]">
                Emergency Care
              </a>
            </nav>
          </div>

          <div className="hidden w-[320px] items-center rounded-full bg-white/85 px-4 py-2 text-sm text-[#607370] md:flex">
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Search conditions...</span>
          </div>

          <button className="rounded-full bg-[#005e52] px-5 py-2 text-sm font-semibold text-white">
            Sign In
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-6 pb-20 pt-10">
        <BookingProgress
          steps={progressSteps}
          currentStep={3}
          stepLinks={stepLinks}
          enableStepNavigation={enableStepNavigation}
          className="mx-auto mb-8 max-w-[760px]"
        />

        <section className="mx-auto max-w-[760px] rounded-2xl bg-[#f2f5f3] p-6 shadow-sm">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#5a6f6a]">Step 3 of 4</p>
          <h1 className="mt-2 text-center text-4xl font-extrabold tracking-tight text-[#172221]">Patient Details</h1>
          <p className="mt-2 text-center text-[#4a5f5b]">Please provide the patient information.</p>

          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[#23423d]">
              Full Name
              <input
                value={formState.fullName}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    fullName: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl bg-[#dde4e1] px-4 py-3 outline-none ring-[#005e52] focus:ring-2"
                placeholder="e.g. Julianne Moore"
              />
            </label>

            <label className="text-sm font-semibold text-[#23423d]">
              Phone Number
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={formState.phoneNumber}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    phoneNumber: sanitizePhoneNumber(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-xl bg-[#dde4e1] px-4 py-3 outline-none ring-[#005e52] focus:ring-2"
                placeholder="9876543210"
              />
              {formState.phoneNumber.length > 0 && !isPhoneValid ? (
                <p className="mt-2 text-xs text-[#9a3b3b]">Enter a valid 10-digit mobile number.</p>
              ) : null}
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-[#23423d]">
            Symptoms
            <span className="ml-2 text-xs text-[#6a7e7a]">Optional</span>
            <input
              value={formState.symptoms}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  symptoms: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl bg-[#dde4e1] px-4 py-3 outline-none ring-[#005e52] focus:ring-2"
              placeholder="Describe symptoms (fever, cough...)"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-[#23423d]">
            Additional Notes
            <span className="ml-2 text-xs text-[#6a7e7a]">Optional</span>
            <textarea
              value={formState.notes}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  notes: event.target.value,
                }))
              }
              className="mt-2 min-h-24 w-full rounded-xl bg-[#dde4e1] px-4 py-3 outline-none ring-[#005e52] focus:ring-2"
              placeholder="Medical history or specific requests..."
            />
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={doctorId ? `/doctor/${doctorId}` : "/find-doctor"}
              className="inline-flex items-center gap-2 font-semibold text-[#0f4a42]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Link>

            <button
              type="button"
              onClick={continueToPayment}
              disabled={!canContinue}
              className="rounded-xl bg-[#005e52] px-7 py-3 text-sm font-bold text-white transition enabled:hover:bg-[#0c6a5f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Step 4
            </button>
          </div>
        </section>

        <section className="mx-auto mt-4 grid max-w-[760px] grid-cols-1 gap-3 md:grid-cols-2">
          <article className="rounded-2xl bg-[#dce8e3] p-4 text-sm text-[#1f3f39]">
            <p className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Secure Data
            </p>
            <p className="mt-1 text-[#476560]">HIPAA-compliant encrypted storage in your browser during booking.</p>
          </article>
          <article className="rounded-2xl bg-[#e4eae7] p-4 text-sm text-[#1f3f39]">
            <p className="flex items-center gap-2 font-bold">
              <LifeBuoy className="h-4 w-4" aria-hidden="true" /> Need Help?
            </p>
            <p className="mt-1 text-[#476560]">(800) 123-4567 for assistance.</p>
          </article>
        </section>
      </main>
    </div>
  );
}