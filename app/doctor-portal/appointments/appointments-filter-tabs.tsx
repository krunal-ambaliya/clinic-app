"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type AppointmentFilter = "today" | "upcoming" | "completed";

type AppointmentsFilterTabsProps = {
  filter: AppointmentFilter;
};

const filters: Array<{ value: AppointmentFilter; label: string }> = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

export function AppointmentsFilterTabs({ filter }: AppointmentsFilterTabsProps) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {filters.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => {
            if (item.value === filter) {
              return;
            }

            startTransition(() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("filter", item.value);
              params.set("page", "1");
              router.replace(`${pathname}?${params.toString()}`);
            });
          }}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            filter === item.value ? "bg-[#0c6a5f] text-white" : "bg-[#edf3f1] text-[#244641]"
          } ${isPending ? "opacity-70" : "opacity-100"}`}
          disabled={isPending}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
