"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock3, Globe, Info, Medal, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import type { Doctor } from "@/api/doctors";
import { BookingProgress } from "@/app/components/booking-progress";
import {
  getBookingDraft,
  hasUnlockedProgressNavigation,
  markReachedStep,
  updateBookingDraft,
} from "@/lib/booking-cache";

const progressSteps = ["Find Doctor", "Schedule", "Patient", "Payment"];
const availableSlots = ["09:00 AM", "09:45 AM", "10:30 AM", "11:15 AM", "01:00 PM", "02:30 PM"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateLabel(dateIso: string) {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isDateWithinRange(dateIso: string, minIso: string, maxIso: string) {
  return dateIso >= minIso && dateIso <= maxIso;
}

function slotLabelToMinutes(slot: string) {
  const [time, period] = slot.split(" ");
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return Number.NaN;
  }

  const normalizedHour = hour % 12;
  const hour24 = period === "PM" ? normalizedHour + 12 : normalizedHour;
  return hour24 * 60 + minute;
}

type DoctorBookingClientProps = {
  doctor: Doctor;
};

export function DoctorBookingClient({ doctor }: DoctorBookingClientProps) {
  const router = useRouter();
  const todayDate = useMemo(() => startOfDay(new Date()), []);
  const todayIso = useMemo(() => toIsoDate(todayDate), [todayDate]);
  const maxBookDate = useMemo(() => {
    const maxDate = new Date(todayDate);
    maxDate.setMonth(maxDate.getMonth() + 1);
    return startOfDay(maxDate);
  }, [todayDate]);
  const maxBookDateIso = useMemo(() => toIsoDate(maxBookDate), [maxBookDate]);
  const minCalendarMonth = useMemo(() => startOfMonth(todayDate), [todayDate]);
  const maxCalendarMonth = useMemo(() => startOfMonth(maxBookDate), [maxBookDate]);
  const [selectedDateIso, setSelectedDateIso] = useState(todayIso);
  const [displayedMonth, setDisplayedMonth] = useState(startOfMonth(todayDate));
  const [nowMinutes, setNowMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [enableStepNavigation, setEnableStepNavigation] = useState(false);
  const selectedDateLabel = useMemo(() => toDateLabel(selectedDateIso), [selectedDateIso]);
  const displayedMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(displayedMonth),
    [displayedMonth],
  );
  const timezoneLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());
  }, []);

  const canGoToPreviousMonth = displayedMonth.getTime() > minCalendarMonth.getTime();
  const canGoToNextMonth = displayedMonth.getTime() < maxCalendarMonth.getTime();

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = startOfMonth(displayedMonth);
    const monthIndex = firstDayOfMonth.getMonth();
    const daysInMonth = new Date(firstDayOfMonth.getFullYear(), monthIndex + 1, 0).getDate();
    const leadingBlanks = firstDayOfMonth.getDay();
    const cells: Array<{ key: string; dayNumber: number | null; dateIso: string | null }> = [];

    for (let blank = 0; blank < leadingBlanks; blank += 1) {
      cells.push({
        key: `blank-${blank}`,
        dayNumber: null,
        dateIso: null,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(firstDayOfMonth.getFullYear(), monthIndex, day);
      const dateIso = toIsoDate(date);

      cells.push({
        key: dateIso,
        dayNumber: day,
        dateIso,
      });
    }

    return cells;
  }, [displayedMonth]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const cached = getBookingDraft();

      markReachedStep(2);
      setEnableStepNavigation(hasUnlockedProgressNavigation());

      if (cached.doctor?.id === doctor.id && cached.schedule?.slot) {
        setSelectedSlot(cached.schedule.slot);
      }

      if (cached.doctor?.id === doctor.id && cached.schedule?.dateIso) {
        if (isDateWithinRange(cached.schedule.dateIso, todayIso, maxBookDateIso)) {
          setSelectedDateIso(cached.schedule.dateIso);
          const [year, month] = cached.schedule.dateIso.split("-").map(Number);
          setDisplayedMonth(new Date(year, month - 1, 1));
        } else {
          setSelectedDateIso(todayIso);
          setDisplayedMonth(startOfMonth(todayDate));
        }
      }
    }, 0);

    updateBookingDraft({
      doctor: {
        id: doctor.id,
        fullName: doctor.fullName,
        roleTitle: doctor.roleTitle,
        specialty: doctor.specialty,
        consultationFee: doctor.consultationFee,
        photoUrl: doctor.photoUrl,
        locationName: doctor.locationName,
      },
    });

    return () => {
      window.clearTimeout(timer);
    };
  }, [doctor, maxBookDateIso, todayDate, todayIso]);

  useEffect(() => {
    let cancelled = false;

    async function loadBookedSlots() {
      setAvailabilityMessage("");

      try {
        const response = await fetch(
          `/api/appointments?doctorId=${encodeURIComponent(doctor.id)}&doctorName=${encodeURIComponent(
            doctor.fullName,
          )}&dateIso=${encodeURIComponent(selectedDateIso)}`,
        );

        if (!response.ok) {
          setBookedSlots([]);
          setAvailabilityMessage("Unable to refresh slot availability right now.");
          return;
        }

        const result = (await response.json()) as { bookedSlots?: string[] };
        const reserved = result.bookedSlots ?? [];

        if (cancelled) {
          return;
        }

        setBookedSlots(reserved);

      } catch {
        if (!cancelled) {
          setBookedSlots([]);
          setAvailabilityMessage("Unable to refresh slot availability right now.");
        }
      }
    }

    loadBookedSlots();

    return () => {
      cancelled = true;
    };
  }, [doctor.fullName, doctor.id, selectedDateIso]);

  const stepLinks = useMemo(() => {
    return ["/find-doctor", `/doctor/${doctor.id}`, "/patient-details", "/payment-summary"];
  }, [doctor.id]);

  function isSlotDisabled(slot: string | null) {
    if (!slot) {
      return true;
    }

    const isBooked = bookedSlots.includes(slot);
    const isPastSlotForToday = selectedDateIso === todayIso && slotLabelToMinutes(slot) <= nowMinutes;
    return isBooked || isPastSlotForToday;
  }

  function continueToPatientDetails() {
    if (!selectedSlot) {
      setAvailabilityMessage("Please select a slot to continue.");
      return;
    }

    if (bookedSlots.includes(selectedSlot)) {
      setAvailabilityMessage("That slot has already been booked. Please choose another slot.");
      return;
    }

    if (isSlotDisabled(selectedSlot)) {
      setAvailabilityMessage("That slot has already passed. Please choose a future slot.");
      return;
    }

    updateBookingDraft({
      doctor: {
        id: doctor.id,
        fullName: doctor.fullName,
        roleTitle: doctor.roleTitle,
        specialty: doctor.specialty,
        consultationFee: doctor.consultationFee,
        photoUrl: doctor.photoUrl,
        locationName: doctor.locationName,
      },
      schedule: {
        dateIso: selectedDateIso,
        dateLabel: selectedDateLabel,
        slot: selectedSlot,
      },
    });

    router.push("/patient-details");
  }

  const hasAvailableSlots = availableSlots.some((slot) => !isSlotDisabled(slot));

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
            <span>Search doctors...</span>
          </div>

          <button className="rounded-full bg-[#005e52] px-5 py-2 text-sm font-semibold text-white">
            Sign In
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-6 pb-20 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/find-doctor"
            className="inline-flex items-center gap-2 rounded-full bg-[#dce6e2] px-4 py-2 text-sm font-semibold text-[#1f403a]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        </div>

        <BookingProgress
          steps={progressSteps}
          currentStep={2}
          stepLinks={stepLinks}
          enableStepNavigation={enableStepNavigation}
          className="mx-auto mb-8 max-w-[760px]"
        />

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1.4fr]">
          <article className="rounded-2xl bg-[#eff4f2] p-5">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Image
                src={doctor.photoUrl}
                alt={doctor.fullName}
                width={120}
                height={120}
                className="h-30 w-30 rounded-2xl object-cover"
              />

              <div>
                <span className="inline-flex rounded-md bg-[#d6e9e3] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#38635c]">
                  Senior Specialist
                </span>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#0d3f37]">{doctor.fullName}</h1>
                <p className="mt-1 text-2xl text-[#1b302d]">{doctor.specialty}</p>

                <div className="mt-4 grid grid-cols-2 gap-6 text-sm text-[#4e6460]">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em]">Experience</p>
                    <p className="text-2xl font-bold text-[#182221]">{doctor.experienceYears}+ Years</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em]">Consultation</p>
                    <p className="text-2xl font-bold text-[#182221]">${doctor.consultationFee.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 text-base leading-relaxed text-[#3f5551]">{doctor.bio}</p>

            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#dfe8e4] px-3 py-2 text-[#1f403a]">
                <Medal className="h-4 w-4" aria-hidden="true" />
                {doctor.boardCertified ? "Board Certified" : "Certified Specialist"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#dfe8e4] px-3 py-2 text-[#1f403a]">
                <Globe className="h-4 w-4" aria-hidden="true" />
                {doctor.languages}
              </span>
            </div>
          </article>

          <article className="rounded-2xl bg-[#e7ecea] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#163630]">Select Date</h2>
              <p className="font-semibold text-[#0f6157]">{selectedDateLabel} Slots</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-[#1d302d]">{displayedMonthLabel}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!canGoToPreviousMonth}
                      onClick={() => {
                        if (!canGoToPreviousMonth) {
                          return;
                        }

                        setDisplayedMonth((previous) => addMonths(previous, -1));
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ecf2ef] text-[#32514b] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={!canGoToNextMonth}
                      onClick={() => {
                        if (!canGoToNextMonth) {
                          return;
                        }

                        setDisplayedMonth((previous) => addMonths(previous, 1));
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ecf2ef] text-[#32514b] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6a7d79]">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((cell) => {
                    if (!cell.dateIso || !cell.dayNumber) {
                      return <div key={cell.key} className="h-9" />;
                    }

                    const isUnavailableDate = !isDateWithinRange(cell.dateIso, todayIso, maxBookDateIso);
                    const isSelectedDate = selectedDateIso === cell.dateIso;

                    return (
                      <button
                        key={cell.key}
                        type="button"
                        disabled={isUnavailableDate}
                        onClick={() => {
                          if (isUnavailableDate) {
                            return;
                          }

                          setAvailabilityMessage("");
                          setSelectedDateIso(cell.dateIso ?? todayIso);
                        }}
                        className={`h-9 rounded-full text-sm font-semibold transition ${
                          isUnavailableDate
                            ? "cursor-not-allowed text-[#b8c4c0]"
                            : isSelectedDate
                              ? "bg-[#005e52] text-white"
                              : "text-[#31504a] hover:bg-[#e5ece9]"
                        }`}
                      >
                        {cell.dayNumber}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-[#5f726e]">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  <span>{timezoneLabel}</span>
                </div>

                <p className="mt-3 text-xs text-[#5f726e]">
                  Booking window: {toDateLabel(todayIso)} to {toDateLabel(maxBookDateIso)}
                </p>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setAvailabilityMessage("");
                        setSelectedSlot(slot);
                      }}
                      disabled={isSlotDisabled(slot)}
                      className={`rounded-md px-3 py-2 text-xs font-semibold ${
                        isSlotDisabled(slot)
                          ? "cursor-not-allowed bg-[#d2d9d6] text-[#6f807c]"
                          : ""
                      } ${
                        slot === selectedSlot ? "bg-[#005e52] text-white" : "bg-white text-[#304844]"
                      }`}
                    >
                      {bookedSlots.includes(slot)
                        ? `${slot} (Booked)`
                        : selectedDateIso === todayIso && slotLabelToMinutes(slot) <= nowMinutes
                          ? `${slot}`
                          : slot}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-[#dfe4e2] p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.15em] text-[#5c6e6a]">Selected</p>
                  <p className="mt-2 text-xl font-bold text-[#172321]">
                    {selectedDateLabel}, {selectedSlot ?? "No slot selected"}
                  </p>
                </div>

                {availabilityMessage ? (
                  <p className="mt-3 text-sm font-medium text-[#0f4a42]">{availabilityMessage}</p>
                ) : null}

                {!hasAvailableSlots ? (
                  <p className="mt-3 text-sm font-medium text-[#0f4a42]">
                    No slots are available for this date. Please choose another day.
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={continueToPatientDetails}
                  disabled={!hasAvailableSlots || !selectedSlot || isSlotDisabled(selectedSlot)}
                  className="mt-4 w-full rounded-full bg-[#005e52] px-5 py-3 font-bold text-white transition hover:bg-[#0c6a5f]"
                >
                  Continue to Step 3
                </button>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl bg-[#e7ecea] p-5">
            <p className="mb-4 flex items-center gap-2 text-xl font-bold text-[#113a34]">
              <Info className="h-5 w-5" aria-hidden="true" /> Important
            </p>
            <ul className="space-y-2 text-[#3f5551]">
              <li>Consultations typically last 45 minutes.</li>
              <li>Please bring recent medical records.</li>
            </ul>
          </article>

          <article className="overflow-hidden rounded-2xl bg-[#005e52] p-4 text-[#d3ebe4]">
            <h3 className="text-2xl font-bold text-white">Location</h3>
            <p className="mt-1 text-sm">{doctor.locationName}</p>
            <div className="relative mt-4 h-28 overflow-hidden rounded-xl bg-[#93bdb2]">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiG-eCh7m4o8fdE6lKnK50ChdwiqmTGpEIhv3GMtReKyy8leEBg9REVBwVNtlmOPI7nugfT1SrTXGrFhLtXmSSLXAHt2MfUS46bpQg7ccujp_YopkMBqNMHivdQpc8qRO-90MKle3-X8mZoGYjWXYSb64h5b-7oraok9hMl7fGMQszEQVNwvJeLZlfHXJYGxU2GmGDZLY9IY30lLmV9OeXnRhutSozm103mZ_alFabHYoz0uMRygiUf1kRIh_B2Jsv5nTxTmd5hYVQ"
                alt="Map location preview"
                fill
                sizes="(min-width: 1024px) 24vw, 100vw"
                className="object-cover opacity-35"
              />
            </div>
          </article>
        </section>
      </main>

      <footer className="border-t border-[#d8e0dd] bg-[#e6efeb]">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-6 py-6 text-sm text-[#55726d] md:flex-row md:items-center md:justify-between">
          <p className="font-semibold text-[#204540]">Clinic Atelier</p>
          <div className="flex gap-6">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
