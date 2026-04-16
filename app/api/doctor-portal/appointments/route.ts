import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDoctorFromRequest } from "@/lib/doctor-auth";
import {
  createDoctorManualAppointment,
  listDoctorAppointmentsByName,
  updateDoctorAppointmentStatus,
} from "@/lib/doctor-portal-db";

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPendingStatus(status: string) {
  const normalized = normalizeStatus(status);
  return normalized === "confirmed" || normalized === "pending" || normalized === "booked";
}

export async function GET(request: NextRequest) {
  const doctor = await getDoctorFromRequest(request);

  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter = request.nextUrl.searchParams.get("filter") ?? "all";
  const todayIso = new Date().toISOString().slice(0, 10);
  const allAppointments = await listDoctorAppointmentsByName(doctor.fullName);

  const seenPendingKeys = new Set<string>();

  const appointments = allAppointments.filter((appointment) => {
    const status = normalizeStatus(appointment.status);

    if (filter === "today") {
      return appointment.dateIso === todayIso && isPendingStatus(status);
    }

    if (filter === "upcoming") {
      if (!isIsoDate(appointment.dateIso)) {
        return false;
      }

      if (appointment.dateIso < todayIso || !isPendingStatus(status)) {
        return false;
      }

      const dedupeKey = `${appointment.patientName}|${appointment.phone}|${appointment.dateIso}|${appointment.time}`;
      if (seenPendingKeys.has(dedupeKey)) {
        return false;
      }

      seenPendingKeys.add(dedupeKey);
      return true;
    }

    if (filter === "completed") {
      return status === "completed";
    }

    return true;
  });

  return NextResponse.json({ ok: true, appointments });
}

export async function POST(request: NextRequest) {
  const doctor = await getDoctorFromRequest(request);

  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    patientName?: string;
    phone?: string;
    dateIso?: string;
    time?: string;
    symptoms?: string;
    notes?: string;
  };

  const patientName = (body.patientName ?? "").trim();
  const phone = sanitizePhone(body.phone ?? "");
  const dateIso = body.dateIso ?? "";
  const time = body.time ?? "";

  if (patientName.length < 2 || !/^\d{10}$/.test(phone) || !dateIso || !time) {
    return NextResponse.json({ error: "Invalid appointment input." }, { status: 400 });
  }

  const appointmentId = await createDoctorManualAppointment({
    doctorUserId: doctor.id,
    doctorName: doctor.fullName,
    patientName,
    phone,
    dateIso,
    time,
    symptoms: body.symptoms,
    notes: body.notes,
  });

  if (!appointmentId) {
    return NextResponse.json({ error: "Unable to create appointment." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, appointmentId });
}

export async function PATCH(request: NextRequest) {
  const doctor = await getDoctorFromRequest(request);

  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    appointmentId?: number;
    status?: "confirmed" | "completed" | "cancelled";
  };

  if (!body.appointmentId || !body.status) {
    return NextResponse.json({ error: "Appointment and status are required." }, { status: 400 });
  }

  const ok = await updateDoctorAppointmentStatus({
    doctorName: doctor.fullName,
    appointmentId: Number(body.appointmentId),
    status: body.status,
  });

  if (!ok) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
