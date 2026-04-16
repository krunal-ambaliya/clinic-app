"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DaySchedule = {
  dayName: string;
  enabled: boolean;
  start: string;
  end: string;
};

const defaultDays: DaySchedule[] = [
  { dayName: "Monday", enabled: true, start: "09:00", end: "13:00" },
  { dayName: "Tuesday", enabled: true, start: "10:00", end: "14:00" },
  { dayName: "Wednesday", enabled: true, start: "09:00", end: "13:00" },
  { dayName: "Thursday", enabled: true, start: "10:00", end: "14:00" },
  { dayName: "Friday", enabled: true, start: "09:00", end: "13:00" },
  { dayName: "Saturday", enabled: false, start: "09:00", end: "11:00" },
  { dayName: "Sunday", enabled: false, start: "09:00", end: "11:00" },
];

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

function isDateWithinRange(dateIso: string, minIso: string, maxIso: string) {
  return dateIso >= minIso && dateIso <= maxIso;
}

function getDayNameFromIso(dateIso: string) {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
}

function time24ToMinutes(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return Number.NaN;
  }

  return hour * 60 + minute;
}

function minutesToSlotLabel(minutes: number) {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

function buildSlots(start: string, end: string, slotDuration: number) {
  const startMinutes = time24ToMinutes(start);
  const endMinutes = time24ToMinutes(end);
  const duration = slotDuration === 15 ? 15 : 30;

  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) {
    return [] as string[];
  }

  const slots: string[] = [];

  for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
    slots.push(minutesToSlotLabel(current));
  }

  return slots;
}

function slotLabelToMinutes(slot: string) {
  const [time, period] = slot.split(" ");
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  const normalizedHour = hour % 12;
  const hour24 = period === "PM" ? normalizedHour + 12 : normalizedHour;
  return hour24 * 60 + minute;
}

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export default function AddAppointmentPage() {
  const todayDate = useMemo(() => startOfDay(new Date()), []);
  const todayIso = useMemo(() => toIsoDate(todayDate), [todayDate]);
  const maxDate = useMemo(() => {
    const date = new Date(todayDate);
    date.setMonth(date.getMonth() + 1);
    return startOfDay(date);
  }, [todayDate]);
  const maxDateIso = useMemo(() => toIsoDate(maxDate), [maxDate]);
  const [displayedMonth, setDisplayedMonth] = useState(startOfMonth(todayDate));

  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotDuration, setSlotDuration] = useState(30);
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultDays);
  const [formState, setFormState] = useState({
    patientName: "",
    phone: "",
    date: todayIso,
    time: "",
    symptoms: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        const response = await fetch("/api/doctor-portal/availability");
        const result = (await response.json()) as {
          slotDuration?: number;
          days?: DaySchedule[];
        };

        if (!response.ok || cancelled) {
          return;
        }

        setSlotDuration(result.slotDuration === 15 ? 15 : 30);
        if (result.days && result.days.length > 0) {
          setSchedule(result.days);
        }
      } catch {
        // Keep default schedule fallback when API fails.
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(displayedMonth),
    [displayedMonth],
  );

  const canGoToPreviousMonth = displayedMonth.getTime() > startOfMonth(todayDate).getTime();
  const canGoToNextMonth = displayedMonth.getTime() < startOfMonth(maxDate).getTime();

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = startOfMonth(displayedMonth);
    const monthIndex = firstDayOfMonth.getMonth();
    const year = firstDayOfMonth.getFullYear();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const leadingBlanks = firstDayOfMonth.getDay();

    const cells: Array<{ key: string; dayNumber: number | null; dateIso: string | null }> = [];

    for (let blank = 0; blank < leadingBlanks; blank += 1) {
      cells.push({ key: `blank-${blank}`, dayNumber: null, dateIso: null });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateIso = toIsoDate(new Date(year, monthIndex, day));
      cells.push({ key: dateIso, dayNumber: day, dateIso });
    }

    return cells;
  }, [displayedMonth]);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const enabledDayNames = useMemo(
    () => schedule.filter((day) => day.enabled).map((day) => day.dayName),
    [schedule],
  );

  const slotsForSelectedDate = useMemo(() => {
    const dayName = getDayNameFromIso(formState.date);
    const daySchedule = schedule.find((day) => day.dayName === dayName && day.enabled);

    if (!daySchedule) {
      return [] as string[];
    }

    return buildSlots(daySchedule.start, daySchedule.end, slotDuration);
  }, [formState.date, schedule, slotDuration]);

  function isSlotDisabled(slot: string) {
    return formState.date === todayIso && slotLabelToMinutes(slot) <= nowMinutes;
  }

  const isValid =
    formState.patientName.trim().length > 1 &&
    /^\d{10}$/.test(formState.phone) &&
    Boolean(formState.date) &&
    Boolean(formState.time);

  return (
    <section className="rounded-2xl border border-[#dbe5e1] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60736e]">Manual Entry</p>
      <h2 className="mt-1 text-3xl font-extrabold text-[#133a35]">Add Appointment</h2>
      <p className="mt-2 text-sm text-[#5e726d]">Quickly create an appointment in one step.</p>

      <form
        className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaved(false);
          setErrorMessage("");

          if (!isValid) {
            return;
          }

          setIsSubmitting(true);

          try {
            const response = await fetch("/api/doctor-portal/appointments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                patientName: formState.patientName,
                phone: formState.phone,
                dateIso: formState.date,
                time: formState.time,
                symptoms: formState.symptoms,
              }),
            });

            if (!response.ok) {
              const result = (await response.json()) as { error?: string };
              setErrorMessage(result.error ?? "Unable to save appointment.");
              return;
            }

            setSaved(true);
            setFormState({
              patientName: "",
              phone: "",
              date: todayIso,
              time: "",
              symptoms: "",
            });
          } catch {
            setErrorMessage("Unable to save appointment right now.");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <label className="text-sm font-semibold text-[#22423d]">
          Patient Name
          <input
            value={formState.patientName}
            onChange={(event) => setFormState((prev) => ({ ...prev, patientName: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[#d6e0dc] bg-[#f7faf8] px-4 py-3 outline-none ring-[#0c6a5f] focus:ring-2"
            placeholder="Patient full name"
          />
        </label>

        <label className="text-sm font-semibold text-[#22423d]">
          Phone
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={formState.phone}
            onChange={(event) => setFormState((prev) => ({ ...prev, phone: sanitizePhone(event.target.value) }))}
            className="mt-2 w-full rounded-xl border border-[#d6e0dc] bg-[#f7faf8] px-4 py-3 outline-none ring-[#0c6a5f] focus:ring-2"
            placeholder="10-digit number"
          />
        </label>

        <div className="md:col-span-2">
          <p className="text-sm font-semibold text-[#22423d]">Date & Time</p>
          <div className="mt-2 grid grid-cols-1 gap-4 rounded-xl border border-[#d6e0dc] bg-[#f7faf8] p-4 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-[#1b3631]">{monthLabel}</p>
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
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf2ef] text-[#204843] disabled:cursor-not-allowed disabled:opacity-40"
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
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf2ef] text-[#204843] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6a7d79]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell) => {
                  if (!cell.dateIso || !cell.dayNumber) {
                    return <div key={cell.key} className="h-9" />;
                  }

                  const disabled = !isDateWithinRange(cell.dateIso, todayIso, maxDateIso);
                  const dayDisabled = !enabledDayNames.includes(getDayNameFromIso(cell.dateIso));
                  const isDisabled = disabled || dayDisabled;
                  const selected = formState.date === cell.dateIso;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) {
                          return;
                        }

                        setFormState((prev) => ({ ...prev, date: cell.dateIso ?? todayIso, time: "" }));
                      }}
                      className={`h-9 rounded-full text-sm font-semibold ${
                        isDisabled
                          ? "cursor-not-allowed text-[#b6c2be]"
                          : selected
                            ? "bg-[#0c6a5f] text-white"
                            : "text-[#274641] hover:bg-[#e6efec]"
                      }`}
                    >
                      {cell.dayNumber}
                    </button>
                  );
                })}
              </div>

              <p className="mt-3 text-xs text-[#60736e]">
                Available from {todayIso} to {maxDateIso}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-[#22423d]">Select a time slot</p>
              <div className="grid grid-cols-2 gap-2">
                {slotsForSelectedDate.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    disabled={isSlotDisabled(slot)}
                    onClick={() => setFormState((prev) => ({ ...prev, time: slot }))}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                      isSlotDisabled(slot)
                        ? "cursor-not-allowed bg-[#e8edeb] text-[#8fa19d]"
                        : formState.time === slot
                          ? "bg-[#0c6a5f] text-white"
                          : "bg-white text-[#274641] hover:bg-[#e6efec]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {slotsForSelectedDate.length === 0 ? (
                <p className="mt-2 text-xs font-medium text-[#9a3b3b]">
                  No slots available for this day based on your availability settings.
                </p>
              ) : null}

              <div className="mt-3 rounded-lg bg-white p-3 text-xs text-[#4d6661]">
                <p className="font-semibold text-[#22423d]">Selected</p>
                <p className="mt-1">{formState.date} {formState.time ? `| ${formState.time}` : "| No time selected"}</p>
              </div>
            </div>
          </div>
        </div>

        <label className="text-sm font-semibold text-[#22423d] md:col-span-2">
          Symptoms (optional)
          <textarea
            value={formState.symptoms}
            onChange={(event) => setFormState((prev) => ({ ...prev, symptoms: event.target.value }))}
            className="mt-2 min-h-24 w-full rounded-xl border border-[#d6e0dc] bg-[#f7faf8] px-4 py-3 outline-none ring-[#0c6a5f] focus:ring-2"
            placeholder="Short note about symptoms"
          />
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="rounded-xl bg-[#0c6a5f] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Appointment"}
          </button>
          {saved ? <p className="mt-3 text-sm font-semibold text-[#176844]">Appointment saved successfully.</p> : null}
          {errorMessage ? <p className="mt-3 text-sm font-semibold text-[#9e3d3d]">{errorMessage}</p> : null}
        </div>
      </form>
    </section>
  );
}
