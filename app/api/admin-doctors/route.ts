import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { createDoctorAccount, listDoctorAccounts } from "@/lib/doctor-auth";

type DbError = {
  code?: string;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);

  if (!admin) {
    return unauthorized();
  }

  const doctors = await listDoctorAccounts();
  return NextResponse.json({ ok: true, doctors });
}

export async function POST(request: NextRequest) {
  const admin = getAdminFromRequest(request);

  if (!admin) {
    return unauthorized();
  }

  const body = (await request.json()) as {
    fullName?: string;
    email?: string;
    password?: string;
    specialty?: string;
    profession?: string;
    experienceYears?: number;
    photoUrl?: string;
    bio?: string;
  };

  const fullName = (body.fullName ?? "").trim();
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  const specialty = (body.specialty ?? "").trim();
  const profession = (body.profession ?? "").trim();
  const experienceYears = Number(body.experienceYears ?? 0);
  const photoUrl = (body.photoUrl ?? "").trim();
  const bio = (body.bio ?? "").trim();

  if (!fullName || !email || !password || !specialty || !profession) {
    return NextResponse.json(
      { error: "Name, email, password, specialty and profession are required." },
      { status: 400 },
    );
  }

  try {
    const doctor = await createDoctorAccount({
      fullName,
      email,
      password,
      specialty,
      profession,
      experienceYears,
      photoUrl,
      bio,
    });

    return NextResponse.json({ ok: true, doctor }, { status: 201 });
  } catch (error) {
    const dbError = error as DbError;

    if (dbError?.code === "23505") {
      return NextResponse.json({ error: "A doctor with this email already exists." }, { status: 409 });
    }

    if (error instanceof Error && error.message === "NEON_NOT_CONFIGURED") {
      return NextResponse.json({ error: "DATABASE_URL is missing." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create doctor." }, { status: 500 });
  }
}
