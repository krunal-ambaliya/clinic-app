import { NextResponse } from "next/server";

import { DOCTOR_SESSION_COOKIE, loginDoctor } from "@/lib/doctor-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const result = await loginDoctor(email, password);

  if (!result.ok) {
    if (result.reason === "NEON_NOT_CONFIGURED") {
      return NextResponse.json({ error: "DATABASE_URL is missing." }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    user: {
      id: result.user.id,
      fullName: result.user.fullName,
      email: result.user.email,
      specialty: result.user.specialty,
    },
  });

  response.cookies.set({
    name: DOCTOR_SESSION_COOKIE,
    value: result.token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: result.maxAgeSeconds,
  });

  return response;
}
