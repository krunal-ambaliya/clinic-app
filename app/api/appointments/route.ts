import { NextResponse } from "next/server";

import { getDoctorAvailabilityByDoctorName } from "@/lib/doctor-portal-db";
import { getSql, isNeonConfigured } from "@/lib/neon";

type AppointmentDraftPayload = {
  doctor?: {
    id?: string;
    fullName?: string;
    consultationFee?: number;
    locationName?: string;
  };
  schedule?: {
    dateIso?: string;
    dateLabel?: string;
    slot?: string;
  };
  patient?: {
    fullName?: string;
    phoneNumber?: string;
    symptoms?: string;
    notes?: string;
  };
  payment?: {
    method?: string;
  };
};

let appointmentsTableReadyPromise: Promise<void> | null = null;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateIso(dateIso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function isDateInAllowedBookingWindow(dateIso: string) {
  const appointmentDate = parseDateIso(dateIso);
  if (!appointmentDate) {
    return false;
  }

  const today = startOfDay(new Date());
  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 1);

  const normalizedAppointmentDate = startOfDay(appointmentDate);
  const minTime = today.getTime();
  const maxTime = startOfDay(maxDate).getTime();
  const appointmentTime = normalizedAppointmentDate.getTime();

  return appointmentTime >= minTime && appointmentTime <= maxTime;
}

function getDayNameFromIso(dateIso: string) {
  const parsed = parseDateIso(dateIso);

  if (!parsed) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(parsed);
}

function time24ToMinutes(time: string) {
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return Number.NaN;
  }

  return hour * 60 + minute;
}

function minutesToSlotLabel(minutes: number) {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

function buildSlots(startTime: string, endTime: string, slotDuration: number) {
  const startMinutes = time24ToMinutes(startTime);
  const endMinutes = time24ToMinutes(endTime);

  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) {
    return [] as string[];
  }

  const duration = slotDuration === 15 ? 15 : 30;
  const slots: string[] = [];

  for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
    slots.push(minutesToSlotLabel(current));
  }

  return slots;
}

async function ensureAppointmentsTable() {
  if (appointmentsTableReadyPromise) {
    return appointmentsTableReadyPromise;
  }

  const sql = getSql();
  appointmentsTableReadyPromise = sql`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      doctor_id INTEGER,
      doctor_name TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_slot TEXT NOT NULL,
      consultation_fee NUMERIC(10, 2) NOT NULL,
      payment_method TEXT NOT NULL,
      symptoms TEXT,
      notes TEXT,
      location_name TEXT,
      booking_payload JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
    );
  `
    .then(async () => {
      const createdAtColumn = (await sql`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'appointments'
          AND column_name = 'created_at'
        LIMIT 1;
      `) as Array<{ data_type: string }>;

      if (createdAtColumn[0]?.data_type === "timestamp with time zone") {
        await sql`
          ALTER TABLE appointments
          ALTER COLUMN created_at TYPE TIMESTAMP
          USING created_at AT TIME ZONE 'Asia/Kolkata';
        `;
      }

      await sql`
        ALTER TABLE appointments
        ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');
      `;

      await sql`
        DELETE FROM appointments existing
        USING appointments duplicate
        WHERE existing.id > duplicate.id
          AND existing.doctor_name = duplicate.doctor_name
          AND existing.appointment_date = duplicate.appointment_date
          AND existing.appointment_slot = duplicate.appointment_slot;
      `;

      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS appointments_doctor_slot_uidx
        ON appointments (doctor_name, appointment_date, appointment_slot);
      `;
    })
    .then(() => undefined);

  return appointmentsTableReadyPromise;
}

export async function POST(request: Request) {
  if (!isNeonConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is missing. Configure Neon connection first." },
      { status: 400 },
    );
  }

  const payload = (await request.json()) as { draft?: AppointmentDraftPayload };
  const draft = payload.draft;

  if (!draft?.doctor?.fullName || !draft?.patient?.fullName || !draft?.patient?.phoneNumber) {
    return NextResponse.json({ error: "Missing required booking fields." }, { status: 400 });
  }

  if (!draft?.schedule?.slot) {
    return NextResponse.json({ error: "Schedule is missing." }, { status: 400 });
  }

  const normalizedPhoneNumber = (draft.patient.phoneNumber ?? "").replace(/\D/g, "").slice(0, 10);

  if (!/^\d{10}$/.test(normalizedPhoneNumber)) {
    return NextResponse.json({ error: "Phone number must be a valid 10-digit number." }, { status: 400 });
  }

  const appointmentDate = draft.schedule.dateIso ?? draft.schedule.dateLabel ?? "";

  if (!isDateInAllowedBookingWindow(appointmentDate)) {
    return NextResponse.json(
      {
        ok: false,
        status: "SLOT_UNAVAILABLE",
        appointmentId: "",
        message: "Selected date is outside the allowed booking window.",
      },
      { status: 400 },
    );
  }

  await ensureAppointmentsTable();

  const sql = getSql();
  const parsedDoctorId = Number(draft.doctor.id);
  const doctorId = Number.isFinite(parsedDoctorId) ? parsedDoctorId : null;

  const rows = (await sql`
    INSERT INTO appointments (
      doctor_id,
      doctor_name,
      patient_name,
      patient_phone,
      appointment_date,
      appointment_slot,
      consultation_fee,
      payment_method,
      symptoms,
      notes,
      location_name,
      booking_payload
    )
    VALUES (
      ${doctorId},
      ${draft.doctor.fullName},
      ${draft.patient.fullName},
      ${normalizedPhoneNumber},
      ${appointmentDate},
      ${draft.schedule.slot},
      ${draft.doctor.consultationFee ?? 0},
      ${draft.payment?.method ?? "card"},
      ${draft.patient.symptoms ?? ""},
      ${draft.patient.notes ?? ""},
      ${draft.doctor.locationName ?? ""},
      ${JSON.stringify(draft)}::jsonb
    )
    ON CONFLICT (doctor_name, appointment_date, appointment_slot) DO NOTHING
    RETURNING id;
  `) as Array<{ id: number }>;

  if (rows.length > 0) {
    return NextResponse.json({
      ok: true,
      appointmentId: String(rows[0].id),
      status: "BOOKED",
    });
  }

  const existingRows = (await sql`
    SELECT id, patient_phone
    FROM appointments
    WHERE doctor_name = ${draft.doctor.fullName}
      AND appointment_date = ${appointmentDate}
      AND appointment_slot = ${draft.schedule.slot}
    LIMIT 1;
  `) as Array<{ id: number; patient_phone: string }>;

  const existing = existingRows[0];

  if (existing && existing.patient_phone === normalizedPhoneNumber) {
    return NextResponse.json(
      {
        ok: false,
        status: "ALREADY_BOOKED",
        appointmentId: String(existing.id),
        message: "You already booked this same slot.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      status: "SLOT_UNAVAILABLE",
      appointmentId: existing ? String(existing.id) : "",
      message: "This slot is no longer available. Please choose another slot.",
    },
    { status: 409 },
  );
}

export async function GET(request: Request) {
  if (!isNeonConfigured()) {
    return NextResponse.json({
      ok: true,
      bookedSlots: [] as string[],
      availableSlots: [] as string[],
      enabledDayNames: [] as string[],
      slotDuration: 30,
    });
  }

  const { searchParams } = new URL(request.url);
  const doctorIdParam = searchParams.get("doctorId");
  const doctorName = searchParams.get("doctorName");
  const dateIso = searchParams.get("dateIso");

  if (!dateIso || !isDateInAllowedBookingWindow(dateIso)) {
    return NextResponse.json({
      ok: true,
      bookedSlots: [] as string[],
      availableSlots: [] as string[],
      enabledDayNames: [] as string[],
      slotDuration: 30,
    });
  }

  const parsedDoctorId = Number(doctorIdParam);
  const hasDoctorId = Number.isFinite(parsedDoctorId);

  if (!hasDoctorId && !doctorName) {
    return NextResponse.json({
      ok: true,
      bookedSlots: [] as string[],
      availableSlots: [] as string[],
      enabledDayNames: [] as string[],
      slotDuration: 30,
    });
  }

  await ensureAppointmentsTable();
  const sql = getSql();

  const rows = hasDoctorId
    ? ((await sql`
        SELECT appointment_slot
        FROM appointments
        WHERE doctor_id = ${parsedDoctorId}
          AND appointment_date = ${dateIso};
      `) as Array<{ appointment_slot: string }>)
    : ((await sql`
        SELECT appointment_slot
        FROM appointments
        WHERE doctor_name = ${doctorName ?? ""}
          AND appointment_date = ${dateIso};
      `) as Array<{ appointment_slot: string }>);

  const availability = await getDoctorAvailabilityByDoctorName(doctorName ?? "");
  const dayName = getDayNameFromIso(dateIso);
  const daySchedule = availability.days.find((day) => day.dayName === dayName && day.enabled);
  const availableSlots = daySchedule
    ? buildSlots(daySchedule.start, daySchedule.end, availability.slotDuration)
    : [];

  return NextResponse.json({
    ok: true,
    bookedSlots: rows.map((row) => row.appointment_slot),
    availableSlots,
    enabledDayNames: availability.days.filter((day) => day.enabled).map((day) => day.dayName),
    slotDuration: availability.slotDuration,
    fetchedAt: new Date(Date.now() + DAY_MS * 0).toISOString(),
  });
}