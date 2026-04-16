import { getSql, isNeonConfigured } from "@/lib/neon";

type DbError = {
  code?: string;
  message?: string;
  sourceError?: unknown;
};

export type Doctor = {
  id: string;
  fullName: string;
  roleTitle: string;
  specialty: string;
  experienceYears: number;
  consultationFee: number;
  photoUrl: string;
  availabilityTag: string;
  locationName: string;
  bio: string;
  languages: string;
  boardCertified: boolean;
};

let doctorsTableReadyPromise: Promise<void> | null = null;
let doctorsTableReady = false;

function isRecoverableConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const dbError = error as DbError & { cause?: unknown };
  const message = (dbError.message ?? "").toLowerCase();
  const code = (dbError.code ?? "").toUpperCase();

  if (
    message.includes("fetch failed") ||
    message.includes("connect timeout") ||
    message.includes("error connecting to database") ||
    code === "UND_ERR_CONNECT_TIMEOUT"
  ) {
    return true;
  }

  return (
    isRecoverableConnectionError(dbError.sourceError) ||
    isRecoverableConnectionError(dbError.cause)
  );
}

async function ensureDoctorsTable() {
  if (doctorsTableReady) {
    return;
  }

  if (doctorsTableReadyPromise) {
    return doctorsTableReadyPromise;
  }

  if (!isNeonConfigured()) {
    return;
  }

  const sql = getSql();

  doctorsTableReadyPromise = sql`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        full_name TEXT NOT NULL,
        role_title TEXT NOT NULL,
        specialty TEXT NOT NULL,
        experience_years INTEGER NOT NULL,
        consultation_fee NUMERIC(10, 2) NOT NULL,
        photo_url TEXT NOT NULL,
        availability_tag TEXT NOT NULL,
        location_name TEXT NOT NULL,
        bio TEXT NOT NULL,
        languages TEXT NOT NULL,
        board_certified BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `
    .then(() =>
      sql`
        ALTER TABLE doctors
        ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
      `,
    )
    .then(() => {
      doctorsTableReady = true;
    })
    .finally(() => {
      doctorsTableReadyPromise = null;
    });

  return doctorsTableReadyPromise;
}

function mapDoctorRow(row: Record<string, unknown>): Doctor {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    roleTitle: String(row.role_title),
    specialty: String(row.specialty),
    experienceYears: Number(row.experience_years),
    consultationFee: Number(row.consultation_fee),
    photoUrl: String(row.photo_url),
    availabilityTag: String(row.availability_tag),
    locationName: String(row.location_name),
    bio: String(row.bio),
    languages: String(row.languages),
    boardCertified: Boolean(row.board_certified),
  };
}

function dedupeDoctors(doctors: Doctor[]): Doctor[] {
  const seen = new Set<string>();
  const uniqueDoctors: Doctor[] = [];

  for (const doctor of doctors) {
    const key = `${doctor.fullName}|${doctor.roleTitle}|${doctor.specialty}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueDoctors.push(doctor);
  }

  return uniqueDoctors;
}

export async function listDoctors(specialty?: string): Promise<Doctor[]> {
  if (!isNeonConfigured()) {
    return [];
  }

  try {
    await ensureDoctorsTable();
    const sql = getSql();

    const rows = (await sql`
      SELECT
        id,
        full_name,
        role_title,
        specialty,
        experience_years,
        consultation_fee,
        photo_url,
        availability_tag,
        location_name,
        bio,
        languages,
        board_certified
      FROM doctors
      WHERE (${specialty ?? null}::text IS NULL OR specialty = ${specialty ?? null})
      ORDER BY id;
    `) as Array<Record<string, unknown>>;

    return dedupeDoctors(rows.map((row) => mapDoctorRow(row)));
  } catch (error) {
    if (isRecoverableConnectionError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  if (!isNeonConfigured()) {
    return null;
  }

  try {
    await ensureDoctorsTable();
    const sql = getSql();

    const rows = (await sql`
      SELECT
        id,
        full_name,
        role_title,
        specialty,
        experience_years,
        consultation_fee,
        photo_url,
        availability_tag,
        location_name,
        bio,
        languages,
        board_certified
      FROM doctors
      WHERE id = ${Number(id)}
      LIMIT 1;
    `) as Array<Record<string, unknown>>;

    if (rows.length === 0) {
      return null;
    }

    return mapDoctorRow(rows[0]);
  } catch (error) {
    if (isRecoverableConnectionError(error)) {
      return null;
    }

    throw error;
  }
}