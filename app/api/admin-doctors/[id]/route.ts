import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { deleteDoctorAccount, updateDoctorAccount } from "@/lib/doctor-auth";

type DbError = {
  code?: string;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function parseId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(request);

  if (!admin) {
    return unauthorized();
  }

  const params = await context.params;
  const doctorId = parseId(params.id);

  if (!doctorId) {
    return NextResponse.json({ error: "Invalid doctor ID." }, { status: 400 });
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
  const specialty = (body.specialty ?? "").trim();
  const profession = (body.profession ?? "").trim();
  const experienceYears = Number(body.experienceYears ?? 0);
  const photoUrl = (body.photoUrl ?? "").trim();
  const bio = (body.bio ?? "").trim();
  const password = (body.password ?? "").trim();

  if (!fullName || !email || !specialty || !profession) {
    return NextResponse.json({ error: "Name, email, specialty and profession are required." }, { status: 400 });
  }

  try {
    const updated = await updateDoctorAccount(doctorId, {
      fullName,
      email,
      specialty,
      profession,
      experienceYears,
      photoUrl,
      bio,
      password,
    });

    if (!updated) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, doctor: updated });
  } catch (error) {
    const dbError = error as DbError;

    if (dbError?.code === "23505") {
      return NextResponse.json({ error: "A doctor with this email already exists." }, { status: 409 });
    }

    if (error instanceof Error && error.message === "NEON_NOT_CONFIGURED") {
      return NextResponse.json({ error: "DATABASE_URL is missing." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to update doctor." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(request);

  if (!admin) {
    return unauthorized();
  }

  const params = await context.params;
  const doctorId = parseId(params.id);

  if (!doctorId) {
    return NextResponse.json({ error: "Invalid doctor ID." }, { status: 400 });
  }

  try {
    const deleted = await deleteDoctorAccount(doctorId);

    if (!deleted) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NEON_NOT_CONFIGURED") {
      return NextResponse.json({ error: "DATABASE_URL is missing." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to delete doctor." }, { status: 500 });
  }
}
