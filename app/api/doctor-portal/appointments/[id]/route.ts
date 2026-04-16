import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDoctorFromRequest } from "@/lib/doctor-auth";
import { getDoctorAppointmentById, updateDoctorAppointmentStatus } from "@/lib/doctor-portal-db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const doctor = await getDoctorFromRequest(request);

  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const appointment = await getDoctorAppointmentById(doctor.fullName, Number(id));

  if (!appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, appointment });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const doctor = await getDoctorFromRequest(request);

  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    status?: "confirmed" | "completed" | "cancelled";
    symptoms?: string;
    notes?: string;
  };

  const ok = await updateDoctorAppointmentStatus({
    doctorName: doctor.fullName,
    appointmentId: Number(id),
    status: body.status,
    symptoms: body.symptoms,
    notes: body.notes,
  });

  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
