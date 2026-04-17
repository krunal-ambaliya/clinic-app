"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type DoctorSearchInputProps = {
  initialQuery?: string;
};

const SEARCH_DEBOUNCE_MS = 300;

export function DoctorSearchInput({ initialQuery = "" }: DoctorSearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const isFirstRender = useRef(true);
  const hasUserTyped = useRef(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!hasUserTyped.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const normalizedQuery = query.trim();
      const targetPath = normalizedQuery
        ? `/find-doctor?q=${encodeURIComponent(normalizedQuery)}`
        : "/find-doctor";

      router.replace(targetPath);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, router]);

  return (
    <div className="hidden w-[320px] items-center rounded-full bg-white/85 px-4 py-2 text-sm text-[#607370] md:flex">
      <Search className="mr-2 h-4 w-4" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(event) => {
          hasUserTyped.current = true;
          setQuery(event.target.value);
        }}
        placeholder="Search doctors..."
        className="w-full bg-transparent outline-none placeholder:text-[#607370]"
      />
    </div>
  );
}