import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, createAdminSession, verifyAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  const session = createAdminSession(email);
  const response = NextResponse.json({ ok: true, email: email.toLowerCase() });

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.maxAgeSeconds,
  });

  return response;
}
