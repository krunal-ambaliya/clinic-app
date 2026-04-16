import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DOCTOR_SESSION_COOKIE, logoutDoctorByToken } from "@/lib/doctor-auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(DOCTOR_SESSION_COOKIE)?.value ?? "";

  if (token) {
    await logoutDoctorByToken(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: DOCTOR_SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
