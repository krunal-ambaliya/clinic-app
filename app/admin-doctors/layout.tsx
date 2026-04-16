import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE, getAdminUserByToken } from "@/lib/admin-auth";

export default async function AdminDoctorsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  const admin = getAdminUserByToken(sessionToken);

  if (!admin) {
    redirect("/admin-login");
  }

  return children;
}
