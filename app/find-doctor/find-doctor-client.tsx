"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BriefcaseMedical, DollarSign, Stethoscope } from "lucide-react";

import type { Doctor } from "@/api/doctors";
import { updateBookingDraft } from "@/lib/booking-cache";

type FindDoctorClientProps = {
  doctors: Doctor[];
  initialSpecialty?: string;
};

export function FindDoctorClient({ doctors, initialSpecialty = "All" }: FindDoctorClientProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [minExperience, setMinExperience] = useState(0);
  const [priceOrder, setPriceOrder] = useState<"high-to-low" | "low-to-high">("high-to-low");

  const specialties = useMemo(() => {
    const uniqueSpecialties = Array.from(new Set(doctors.map((doctor) => doctor.specialty)));
    return ["All", ...uniqueSpecialties];
  }, [doctors]);
  const effectiveSelectedSpecialty = specialties.includes(selectedSpecialty)
    ? selectedSpecialty
    : "All";

  const filteredDoctors = useMemo(() => {
    let result = doctors;

    if (effectiveSelectedSpecialty !== "All") {
      result = result.filter((doctor) => doctor.specialty === effectiveSelectedSpecialty);
    }

    if (minExperience > 0) {
      result = result.filter((doctor) => doctor.experienceYears >= minExperience);
    }

    const sorted = [...result].sort((a, b) => {
      if (priceOrder === "high-to-low") {
        return b.consultationFee - a.consultationFee;
      }

      return a.consultationFee - b.consultationFee;
    });

    return sorted;
  }, [doctors, effectiveSelectedSpecialty, minExperience, priceOrder]);

  const gridColsClass = filteredDoctors.length <= 1 ? "md:grid-cols-1" : "md:grid-cols-2";

  const experienceOptions = [
    { label: "5+ Yrs", value: 5 },
    { label: "10+ Yrs", value: 10 },
    { label: "15+ Yrs", value: 15 },
    { label: "20+ Yrs", value: 20 },
  ];

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl bg-[#dde4e1] p-5">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#40615b]">
          Filter Results
        </p>

        <div className="space-y-5">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1e3531]">
              <Stethoscope className="h-4 w-4" aria-hidden="true" />
              Specialization
            </p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {specialties.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => setSelectedSpecialty(specialty)}
                  className={`rounded-full px-4 py-2 text-left ${
                    effectiveSelectedSpecialty === specialty
                      ? "bg-[#005e52] text-white"
                      : "bg-white text-[#2d4641]"
                  }`}
                >
                  {specialty === "All" ? "All Specializations" : specialty}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1e3531]">
              <BriefcaseMedical className="h-4 w-4" aria-hidden="true" />
              Experience
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-[#2d4641]">
              {experienceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMinExperience(option.value)}
                  className={`rounded-full px-4 py-2 text-center ${
                    minExperience === option.value
                      ? "bg-[#005e52] text-white"
                      : "bg-white text-[#2d4641]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMinExperience(0)}
              className="mt-2 text-xs font-semibold text-[#345752] hover:text-[#0f6157]"
            >
              Clear experience
            </button>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1e3531]">
              <DollarSign className="h-4 w-4" aria-hidden="true" />
              Price
            </p>
            <button
              type="button"
              onClick={() =>
                setPriceOrder((previous) =>
                  previous === "high-to-low" ? "low-to-high" : "high-to-low",
                )
              }
              className="w-full rounded-full bg-white px-4 py-2 text-left text-sm text-[#2d4641]"
            >
              {priceOrder === "high-to-low" ? "High to Low" : "Low to High"}
            </button>
          </div>
        </div>
      </aside>

      <div className={`grid grid-cols-1 items-start gap-5 ${gridColsClass}`}>
        {filteredDoctors.length === 0 ? (
          <article className="rounded-2xl border border-[#d7dfdc] bg-[#f7faf8] p-6">
            <h2 className="text-2xl font-bold text-[#183431]">No doctors found</h2>
            <p className="mt-2 text-[#49625d]">
              Try changing specialization, experience, or price filters.
            </p>
          </article>
        ) : null}

        {filteredDoctors.map((doctor) => (
          <article key={doctor.id} className="rounded-2xl border border-[#d7dfdc] bg-[#f7faf8] p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              {doctor.photoUrl.trim() ? (
                <Image
                  src={doctor.photoUrl}
                  alt={doctor.fullName}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#d8e8e2] text-sm font-bold text-[#2f5e56]">
                  {doctor.fullName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("") || "DR"}
                </div>
              )}
              <span className="rounded-md bg-[#d8ebe4] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#325d56]">
                {doctor.availabilityTag}
              </span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-[#182221]">{doctor.fullName}</h2>
            <p className="mt-1 text-base font-medium text-[#1a4f48]">{doctor.roleTitle}</p>

            <div className="mt-4 space-y-2 text-sm text-[#435a56]">
              <p>{doctor.experienceYears} Years Experience</p>
              <p>${doctor.consultationFee.toFixed(2)} / Visit</p>
            </div>

            <Link
              href={`/doctor/${doctor.id}`}
              onClick={() => {
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
              }}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#005e52] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0c6a5f]"
            >
              Book Appointment
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}