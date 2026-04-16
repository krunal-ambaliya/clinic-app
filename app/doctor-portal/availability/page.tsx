"use client";

import { useEffect, useState } from "react";

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

export default function ManageAvailabilityPage() {
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [slotDuration, setSlotDuration] = useState("30");
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultDays);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/doctor-portal/availability");
        const result = (await response.json()) as {
          slotDuration?: number;
          days?: DaySchedule[];
          error?: string;
        };

        if (!response.ok) {
          if (!cancelled) {
            setErrorMessage(result.error ?? "Unable to load availability.");
          }
          return;
        }

        if (!cancelled) {
          setSlotDuration(String(result.slotDuration ?? 30));
          setSchedule(result.days ?? defaultDays);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("Unable to load availability right now.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-[#dbe5e1] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60736e]">Weekly Setup</p>
      <h2 className="mt-1 text-3xl font-extrabold text-[#133a35]">Manage Availability</h2>
      <p className="mt-2 text-sm text-[#5e726d]">Set your weekly working hours in less than a minute.</p>

      <div className="mt-6 space-y-3">
        {schedule.map((day, index) => (
          <article key={day.dayName} className="grid grid-cols-1 gap-3 rounded-xl border border-[#e2ebe8] p-4 md:grid-cols-[1.2fr_auto_auto_auto] md:items-center">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#183d37]">{day.dayName}</p>
              <button
                type="button"
                onClick={() =>
                  setSchedule((prev) =>
                    prev.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, enabled: !item.enabled } : item,
                    ),
                  )
                }
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  day.enabled ? "bg-[#e3f4ee] text-[#0d614f]" : "bg-[#eceff0] text-[#5d6d68]"
                }`}
              >
                {day.enabled ? "ON" : "OFF"}
              </button>
            </div>

            <input
              type="time"
              disabled={!day.enabled}
              value={day.start}
              onChange={(event) =>
                setSchedule((prev) =>
                  prev.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, start: event.target.value } : item,
                  ),
                )
              }
              className="rounded-lg border border-[#d6e0dc] px-3 py-2 text-sm disabled:opacity-50"
            />

            <input
              type="time"
              disabled={!day.enabled}
              value={day.end}
              onChange={(event) =>
                setSchedule((prev) =>
                  prev.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, end: event.target.value } : item,
                  ),
                )
              }
              className="rounded-lg border border-[#d6e0dc] px-3 py-2 text-sm disabled:opacity-50"
            />

            <span className="text-xs font-semibold text-[#60736e]">Working hours</span>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-[#22423d]">
          Slot duration
          <select
            value={slotDuration}
            onChange={(event) => setSlotDuration(event.target.value)}
            className="ml-3 rounded-lg border border-[#d6e0dc] bg-[#f7faf8] px-3 py-2 text-sm"
          >
            <option value="15">15 mins</option>
            <option value="30">30 mins</option>
          </select>
        </label>

        <button
          type="button"
          onClick={async () => {
            setSaved(false);
            setErrorMessage("");

            try {
              const response = await fetch("/api/doctor-portal/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  slotDuration: Number(slotDuration),
                  days: schedule,
                }),
              });

              if (!response.ok) {
                const result = (await response.json()) as { error?: string };
                setErrorMessage(result.error ?? "Unable to save schedule.");
                return;
              }

              setSaved(true);
            } catch {
              setErrorMessage("Unable to save schedule right now.");
            }
          }}
          className="rounded-xl bg-[#0c6a5f] px-6 py-3 text-sm font-bold text-white"
        >
          Save Schedule
        </button>
      </div>

      {isLoading ? <p className="mt-3 text-sm text-[#5e726d]">Loading schedule...</p> : null}
      {saved ? <p className="mt-3 text-sm font-semibold text-[#176844]">Schedule saved successfully.</p> : null}
      {errorMessage ? <p className="mt-3 text-sm font-semibold text-[#9e3d3d]">{errorMessage}</p> : null}
    </section>
  );
}
