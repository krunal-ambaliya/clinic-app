"use client";

import { useState, useTransition } from "react";

import { saveAvailabilityAction } from "@/app/doctor-portal/actions";

type DaySchedule = {
  dayName: string;
  enabled: boolean;
  start: string;
  end: string;
};

type ManageAvailabilityClientProps = {
  initialSlotDuration: number;
  initialSchedule: DaySchedule[];
};

export function ManageAvailabilityClient({
  initialSlotDuration,
  initialSchedule,
}: ManageAvailabilityClientProps) {
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [slotDuration, setSlotDuration] = useState(String(initialSlotDuration === 15 ? 15 : 30));
  const [schedule, setSchedule] = useState<DaySchedule[]>(initialSchedule);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-2xl border border-[#dbe5e1] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60736e]">Weekly Setup</p>
      <h2 className="mt-1 text-3xl font-extrabold text-[#133a35]">Manage Availability</h2>
      <p className="mt-2 text-sm text-[#5e726d]">Set your weekly working hours in less than a minute.</p>

      <div className="mt-6 space-y-3">
        {schedule.map((day, index) => (
          <article
            key={day.dayName}
            className="grid grid-cols-1 gap-3 rounded-xl border border-[#e2ebe8] p-4 md:grid-cols-[1.2fr_auto_auto_auto] md:items-center"
          >
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
          onClick={() => {
            setSaved(false);
            setErrorMessage("");

            startTransition(async () => {
              const result = await saveAvailabilityAction({
                slotDuration: Number(slotDuration),
                days: schedule,
              });

              if (!result.ok) {
                setErrorMessage(result.error ?? "Unable to save schedule.");
                return;
              }

              setSaved(true);
            });
          }}
          className="rounded-xl bg-[#0c6a5f] px-6 py-3 text-sm font-bold text-white disabled:opacity-70"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save Schedule"}
        </button>
      </div>

      {saved ? <p className="mt-3 text-sm font-semibold text-[#176844]">Schedule saved successfully.</p> : null}
      {errorMessage ? <p className="mt-3 text-sm font-semibold text-[#9e3d3d]">{errorMessage}</p> : null}
    </section>
  );
}
