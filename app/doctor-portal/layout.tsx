import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DoctorPortalShell } from "@/app/components/doctor-portal-shell";
import { DOCTOR_SESSION_COOKIE, getDoctorUserByToken } from "@/lib/doctor-auth";

export default async function DoctorPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(DOCTOR_SESSION_COOKIE)?.value ?? "";
  const doctor = await getDoctorUserByToken(sessionToken);

  if (!doctor) {
    redirect("/doctor-login");
  }

  return <DoctorPortalShell doctorName={doctor.fullName}>{children}</DoctorPortalShell>;
}
