import { getSql, isNeonConfigured } from "@/lib/neon";

export type DoctorPortalAppointment = {
  id: number;
  patientName: string;
  phone: string;
  symptoms: string;
  dateIso: string;
  time: string;
  status: "confirmed" | "completed" | "cancelled";
  notes: string;
  createdAt: string;
};

export type DoctorAvailabilityRow = {
  dayName: string;
  enabled: boolean;
  start: string;
  end: string;
};

export type DoctorAvailabilitySnapshot = {
  slotDuration: number;
  days: DoctorAvailabilityRow[];
};

export type DoctorAppointmentFilter = "today" | "upcoming" | "completed" | "all";

export type DoctorAppointmentsPageResult = {
  appointments: DoctorPortalAppointment[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

export type DoctorDashboardSnapshot = {
  todayAppointments: DoctorPortalAppointment[];
  upcomingAppointments: DoctorPortalAppointment[];
};

const defaultAvailability: DoctorAvailabilityRow[] = [
  { dayName: "Monday", enabled: true, start: "09:00", end: "13:00" },
  { dayName: "Tuesday", enabled: true, start: "10:00", end: "14:00" },
  { dayName: "Wednesday", enabled: true, start: "09:00", end: "13:00" },
  { dayName: "Thursday", enabled: true, start: "10:00", end: "14:00" },
  { dayName: "Friday", enabled: true, start: "09:00", end: "13:00" },
  { dayName: "Saturday", enabled: false, start: "09:00", end: "11:00" },
  { dayName: "Sunday", enabled: false, start: "09:00", end: "11:00" },
];

let portalTablesReadyPromise: Promise<void> | null = null;
let portalTablesReady = false;

function normalizeStatusValue(status: string) {
  return status.trim().toLowerCase();
}

function isPendingStatus(status: string) {
  const normalized = normalizeStatusValue(status);
  return normalized === "confirmed" || normalized === "pending" || normalized === "booked";
}

function mapAppointmentRow(row: Record<string, unknown>): DoctorPortalAppointment {
  const status = String(row.status ?? "confirmed") as DoctorPortalAppointment["status"];

  return {
    id: Number(row.id),
    patientName: String(row.patient_name ?? ""),
    phone: String(row.patient_phone ?? ""),
    symptoms: String(row.symptoms ?? ""),
    dateIso: String(row.appointment_date ?? ""),
    time: String(row.appointment_slot ?? ""),
    status,
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

export async function ensureDoctorPortalTables() {
  if (portalTablesReady) {
    return;
  }

  if (portalTablesReadyPromise) {
    return portalTablesReadyPromise;
  }

  if (!isNeonConfigured()) {
    return;
  }

  const sql = getSql();

  portalTablesReadyPromise = sql`
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
      await sql`
        ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed';
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS doctor_availability (
          id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          doctor_user_id INTEGER NOT NULL,
          day_name TEXT NOT NULL,
          enabled BOOLEAN NOT NULL DEFAULT true,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
          updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
          UNIQUE (doctor_user_id, day_name)
        );
      `;

      await sql`
        ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS patient_id INTEGER;
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS appointments_doctor_id_idx
        ON appointments (doctor_id);
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS appointments_patient_id_idx
        ON appointments (patient_id);
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS appointments_date_idx
        ON appointments (appointment_date);
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS appointments_doctor_name_date_idx
        ON appointments (doctor_name, appointment_date);
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS appointments_doctor_name_status_date_idx
        ON appointments (doctor_name, status, appointment_date);
      `;

      portalTablesReady = true;
    })
    .then(() => undefined)
    .finally(() => {
      portalTablesReadyPromise = null;
    });

  return portalTablesReadyPromise;
}

export async function listDoctorAppointmentsByName(doctorName: string) {
  if (!isNeonConfigured()) {
    return [] as DoctorPortalAppointment[];
  }

  await ensureDoctorPortalTables();
  const sql = getSql();

  const rows = (await sql`
    SELECT
      id,
      patient_name,
      patient_phone,
      symptoms,
      appointment_date,
      appointment_slot,
      status,
      notes,
      created_at
    FROM appointments
    WHERE doctor_name = ${doctorName}
    ORDER BY appointment_date ASC, appointment_slot ASC;
  `) as Array<Record<string, unknown>>;

  return rows.map((row) => mapAppointmentRow(row));
}

export async function listDoctorAppointmentsPage(input: {
  doctorName: string;
  filter: DoctorAppointmentFilter;
  page: number;
  pageSize: number;
}): Promise<DoctorAppointmentsPageResult> {
  if (!isNeonConfigured()) {
    return {
      appointments: [],
      totalCount: 0,
      totalPages: 1,
      page: 1,
      pageSize: input.pageSize,
    };
  }

  await ensureDoctorPortalTables();
  const sql = getSql();

  const todayIso = new Date().toISOString().slice(0, 10);
  const page = Math.max(1, Math.trunc(input.page));
  const pageSize = Math.max(1, Math.min(50, Math.trunc(input.pageSize)));
  const offset = (page - 1) * pageSize;

  let rows: Array<Record<string, unknown>> = [];
  let countRows: Array<{ count: number }> = [];

  if (input.filter === "today") {
    rows = (await sql`
      SELECT
        id,
        patient_name,
        patient_phone,
        symptoms,
        appointment_date,
        appointment_slot,
        status,
        notes,
        created_at
      FROM appointments
      WHERE doctor_name = ${input.doctorName}
        AND appointment_date = ${todayIso}
        AND LOWER(status) IN ('confirmed', 'pending', 'booked')
      ORDER BY appointment_slot ASC, id DESC
      LIMIT ${pageSize}
      OFFSET ${offset};
    `) as Array<Record<string, unknown>>;

    countRows = (await sql`
      SELECT COUNT(*)::int AS count
      FROM appointments
      WHERE doctor_name = ${input.doctorName}
        AND appointment_date = ${todayIso}
        AND LOWER(status) IN ('confirmed', 'pending', 'booked');
    `) as Array<{ count: number }>;
  } else if (input.filter === "upcoming") {
    rows = (await sql`
      SELECT
        id,
        patient_name,
        patient_phone,
        symptoms,
        appointment_date,
        appointment_slot,
        status,
        notes,
        created_at
      FROM appointments
      WHERE doctor_name = ${input.doctorName}
        AND appointment_date >= ${todayIso}
        AND LOWER(status) IN ('confirmed', 'pending', 'booked')
      ORDER BY appointment_date ASC, appointment_slot ASC, id DESC
      LIMIT ${pageSize}
      OFFSET ${offset};
    `) as Array<Record<string, unknown>>;

    countRows = (await sql`
      SELECT COUNT(*)::int AS count
      FROM appointments
      WHERE doctor_name = ${input.doctorName}
        AND appointment_date >= ${todayIso}
        AND LOWER(status) IN ('confirmed', 'pending', 'booked');
    `) as Array<{ count: number }>;
  } else if (input.filter === "completed") {
    rows = (await sql`
      SELECT
        id,
        patient_name,
        patient_phone,
        symptoms,
        appointment_date,
        appointment_slot,
        status,
        notes,
        created_at
      FROM appointments
      WHERE doctor_name = ${input.doctorName}
        AND LOWER(status) = 'completed'
      ORDER BY appointment_date DESC, appointment_slot DESC, id DESC
      LIMIT ${pageSize}
      OFFSET ${offset};
    `) as Array<Record<string, unknown>>;

    countRows = (await sql`
      SELECT COUNT(*)::int AS count
      FROM appointments
      WHERE doctor_name = ${input.doctorName}
        AND LOWER(status) = 'completed';
    `) as Array<{ count: number }>;
  } else {
    rows = (await sql`
      SELECT
        id,
        patient_name,
        patient_phone,
        symptoms,
        appointment_date,
        appointment_slot,
        status,
        notes,
        created_at
      FROM appointments
      WHERE doctor_name = ${input.doctorName}
      ORDER BY appointment_date DESC, appointment_slot DESC, id DESC
      LIMIT ${pageSize}
      OFFSET ${offset};
    `) as Array<Record<string, unknown>>;

    countRows = (await sql`
      SELECT COUNT(*)::int AS count
      FROM appointments
      WHERE doctor_name = ${input.doctorName};
    `) as Array<{ count: number }>;
  }

  const appointments = rows
    .map((row) => mapAppointmentRow(row))
    .filter((appointment) => {
      if (input.filter === "today") {
        return appointment.dateIso === todayIso && isPendingStatus(appointment.status);
      }

      if (input.filter === "upcoming") {
        return appointment.dateIso >= todayIso && isPendingStatus(appointment.status);
      }

      if (input.filter === "completed") {
        return normalizeStatusValue(appointment.status) === "completed";
      }

      return true;
    });

  const totalCount = countRows[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    appointments,
    totalCount,
    totalPages,
    page,
    pageSize,
  };
}

export async function getDoctorDashboardSnapshot(doctorName: string): Promise<DoctorDashboardSnapshot> {
  if (!isNeonConfigured()) {
    return {
      todayAppointments: [],
      upcomingAppointments: [],
    };
  }

  await ensureDoctorPortalTables();
  const sql = getSql();
  const todayIso = new Date().toISOString().slice(0, 10);

  const todayRows = (await sql`
    SELECT
      id,
      patient_name,
      patient_phone,
      symptoms,
      appointment_date,
      appointment_slot,
      status,
      notes,
      created_at
    FROM appointments
    WHERE doctor_name = ${doctorName}
      AND appointment_date = ${todayIso}
      AND LOWER(status) IN ('confirmed', 'pending', 'booked')
    ORDER BY appointment_slot ASC, id DESC;
  `) as Array<Record<string, unknown>>;

  const upcomingRows = (await sql`
    SELECT
      id,
      patient_name,
      patient_phone,
      symptoms,
      appointment_date,
      appointment_slot,
      status,
      notes,
      created_at
    FROM appointments
    WHERE doctor_name = ${doctorName}
      AND appointment_date > ${todayIso}
      AND LOWER(status) <> 'cancelled'
    ORDER BY appointment_date ASC, appointment_slot ASC, id DESC
    LIMIT 4;
  `) as Array<Record<string, unknown>>;

  return {
    todayAppointments: todayRows.map((row) => mapAppointmentRow(row)),
    upcomingAppointments: upcomingRows.map((row) => mapAppointmentRow(row)),
  };
}

export async function getDoctorAppointmentById(doctorName: string, appointmentId: number) {
  if (!isNeonConfigured()) {
    return null;
  }

  await ensureDoctorPortalTables();
  const sql = getSql();

  const rows = (await sql`
    SELECT
      id,
      patient_name,
      patient_phone,
      symptoms,
      appointment_date,
      appointment_slot,
      status,
      notes,
      created_at
    FROM appointments
    WHERE doctor_name = ${doctorName}
      AND id = ${appointmentId}
    LIMIT 1;
  `) as Array<Record<string, unknown>>;

  return rows[0] ? mapAppointmentRow(rows[0]) : null;
}

export async function createDoctorManualAppointment(input: {
  doctorUserId: number;
  doctorName: string;
  patientName: string;
  phone: string;
  dateIso: string;
  time: string;
  symptoms?: string;
  notes?: string;
}) {
  await ensureDoctorPortalTables();
  const sql = getSql();

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
      booking_payload,
      status
    )
    VALUES (
      ${input.doctorUserId},
      ${input.doctorName},
      ${input.patientName},
      ${input.phone},
      ${input.dateIso},
      ${input.time},
      0,
      'manual',
      ${input.symptoms ?? ""},
      ${input.notes ?? ""},
      '',
      ${JSON.stringify({ source: "doctor-portal" })}::jsonb,
      'confirmed'
    )
    RETURNING id;
  `) as Array<{ id: number }>;

  return rows[0]?.id ?? null;
}

export async function updateDoctorAppointmentStatus(input: {
  doctorName: string;
  appointmentId: number;
  status?: "confirmed" | "completed" | "cancelled";
  symptoms?: string;
  notes?: string;
}) {
  await ensureDoctorPortalTables();
  const sql = getSql();

  const rows = (await sql`
    UPDATE appointments
    SET
      status = COALESCE(${input.status ?? null}, status),
      symptoms = COALESCE(${input.symptoms ?? null}, symptoms),
      notes = COALESCE(${input.notes ?? null}, notes)
    WHERE doctor_name = ${input.doctorName}
      AND id = ${input.appointmentId}
    RETURNING id;
  `) as Array<{ id: number }>;

  return rows.length > 0;
}

export async function listDoctorAvailability(doctorUserId: number) {
  await ensureDoctorPortalTables();
  const sql = getSql();

  const existingRows = (await sql`
    SELECT day_name, enabled, start_time, end_time, slot_duration_minutes
    FROM doctor_availability
    WHERE doctor_user_id = ${doctorUserId}
    ORDER BY id ASC;
  `) as Array<{
    day_name: string;
    enabled: boolean;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
  }>;

  if (existingRows.length === 0) {
    for (const day of defaultAvailability) {
      await sql`
        INSERT INTO doctor_availability (doctor_user_id, day_name, enabled, start_time, end_time, slot_duration_minutes)
        VALUES (${doctorUserId}, ${day.dayName}, ${day.enabled}, ${day.start}, ${day.end}, 30);
      `;
    }

    return {
      slotDuration: 30,
      days: defaultAvailability.map((day) => ({ ...day })),
    };
  }

  return {
    slotDuration: existingRows[0]?.slot_duration_minutes ?? 30,
    days: existingRows.map((row) => ({
      dayName: row.day_name,
      enabled: row.enabled,
      start: row.start_time,
      end: row.end_time,
    })),
  };
}

export async function getDoctorAvailabilityByDoctorName(
  doctorName: string,
): Promise<DoctorAvailabilitySnapshot> {
  if (!isNeonConfigured()) {
    return {
      slotDuration: 30,
      days: defaultAvailability.map((day) => ({ ...day })),
    };
  }

  await ensureDoctorPortalTables();
  const sql = getSql();

  try {
    const rows = (await sql`
      SELECT id
      FROM doctor_users
      WHERE LOWER(full_name) = LOWER(${doctorName})
      LIMIT 1;
    `) as Array<{ id: number }>;

    const doctorUser = rows[0];

    if (!doctorUser) {
      return {
        slotDuration: 30,
        days: defaultAvailability.map((day) => ({ ...day })),
      };
    }

    return listDoctorAvailability(doctorUser.id);
  } catch {
    return {
      slotDuration: 30,
      days: defaultAvailability.map((day) => ({ ...day })),
    };
  }
}

export async function saveDoctorAvailability(input: {
  doctorUserId: number;
  slotDuration: number;
  days: DoctorAvailabilityRow[];
}) {
  await ensureDoctorPortalTables();
  const sql = getSql();

  for (const day of input.days) {
    await sql`
      INSERT INTO doctor_availability (
        doctor_user_id,
        day_name,
        enabled,
        start_time,
        end_time,
        slot_duration_minutes,
        updated_at
      )
      VALUES (
        ${input.doctorUserId},
        ${day.dayName},
        ${day.enabled},
        ${day.start},
        ${day.end},
        ${input.slotDuration},
        (NOW() AT TIME ZONE 'Asia/Kolkata')
      )
      ON CONFLICT (doctor_user_id, day_name)
      DO UPDATE SET
        enabled = EXCLUDED.enabled,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        slot_duration_minutes = EXCLUDED.slot_duration_minutes,
        updated_at = EXCLUDED.updated_at;
    `;
  }
}

export function formatPrettyDate(dateIso: string) {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
  let date: Date;

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateIso);
  }

  if (Number.isNaN(date.getTime())) {
    return dateIso;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
