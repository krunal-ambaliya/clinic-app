import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DoctorPortalShell } from "@/app/components/doctor-portal-shell";
import { DOCTOR_SESSION_COOKIE, getDoctorUserByToken } from "@/lib/doctor-auth";

function DoctorPortalPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-2xl bg-[#eef3f1]" />
      <div className="h-32 animate-pulse rounded-2xl bg-[#eef3f1]" />
      <div className="h-32 animate-pulse rounded-2xl bg-[#eef3f1]" />
    </div>
  );
}

export default async function DoctorPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(DOCTOR_SESSION_COOKIE)?.value ?? "";
  const doctor = await getDoctorUserByToken(sessionToken);

  if (!doctor) {
    redirect("/doctor-login");
  }

  return (
    <DoctorPortalShell doctorName={doctor.fullName}>
      <Suspense fallback={<DoctorPortalPageSkeleton />}>{children}</Suspense>
    </DoctorPortalShell>
  );
}
