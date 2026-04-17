import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { listDoctors } from "@/api/doctors";
import { BookingProgress } from "@/app/components/booking-progress";
import { DoctorSearchInput } from "@/app/components/doctor-search-input";
import { FindDoctorClient } from "@/app/find-doctor/find-doctor-client";

const progressSteps = ["Find Doctor", "Schedule", "Patient", "Payment"];

export const revalidate = 120;

type FindDoctorPageProps = {
  searchParams?: Promise<{ specialty?: string; q?: string }>;
};

export default async function FindDoctorPage({ searchParams }: FindDoctorPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSpecialty = resolvedSearchParams?.specialty ?? "All";
  const initialQuery = resolvedSearchParams?.q?.trim() ?? "";
  const doctors = await listDoctors();

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

          <DoctorSearchInput initialQuery={initialQuery} />

          <Link href="/doctor-login" className="rounded-full bg-[#005e52] px-5 py-2 text-sm font-semibold text-white">
            Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-6 pb-20 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#dce6e2] px-4 py-2 text-sm font-semibold text-[#1f403a]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        </div>

        <BookingProgress
          steps={progressSteps}
          currentStep={1}
          stepLinks={["/find-doctor", undefined, undefined, undefined]}
          className="mx-auto mb-8 max-w-[760px]"
        />

        <section className="mb-8">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#172221]">Find your specialist.</h1>
          <p className="mt-3 text-lg text-[#4d625e]">
            Expert care tailored to your needs. Browse our directory and book in seconds.
          </p>
        </section>

        <FindDoctorClient doctors={doctors} initialSpecialty={initialSpecialty} initialQuery={initialQuery} />
      </main>

      <footer className="border-t border-[#d8e0dd] bg-[#e6efeb]">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-6 py-6 text-sm text-[#55726d] md:flex-row md:items-center md:justify-between">
          <p className="font-semibold text-[#204540]">Clinic Atelier</p>
          <div className="flex gap-6">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Legal Notice</a>
          </div>
        </div>
      </footer>
    </div>
  );
}