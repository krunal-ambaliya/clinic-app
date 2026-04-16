import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDoctorFromRequest } from "@/lib/doctor-auth";
import { listDoctorAvailability, saveDoctorAvailability } from "@/lib/doctor-portal-db";

export async function GET(request: NextRequest) {
  const doctor = await getDoctorFromRequest(request);

  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const availability = await listDoctorAvailability(doctor.id);

  return NextResponse.json({ ok: true, ...availability });
}

export async function POST(request: NextRequest) {
  const doctor = await getDoctorFromRequest(request);

  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    slotDuration?: number;
    days?: Array<{ dayName: string; enabled: boolean; start: string; end: string }>;
  };

  const slotDuration = body.slotDuration === 15 ? 15 : 30;
  const days = body.days ?? [];

  if (days.length === 0) {
    return NextResponse.json({ error: "Schedule is required." }, { status: 400 });
  }

  await saveDoctorAvailability({
    doctorUserId: doctor.id,
    slotDuration,
    days,
  });

  return NextResponse.json({ ok: true });
}
