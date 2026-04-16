import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";

import { getSql, isNeonConfigured } from "@/lib/neon";

export const DOCTOR_SESSION_COOKIE = "doctor_portal_session";
const SESSION_DURATION_DAYS = 7;

type DoctorUserRow = {
  id: number;
  full_name: string;
  email: string;
  specialty: string;
  doctor_profile_id?: number | null;
  profession?: string | null;
  experience_years?: number | null;
  photo_url?: string | null;
  bio?: string | null;
  created_at?: string | Date;
};

type DoctorProfileIdRow = {
  id: number;
};

export type DoctorAuthUser = {
  id: number;
  fullName: string;
  email: string;
  specialty: string;
};

export type DoctorAdminUser = {
  id: number;
  fullName: string;
  email: string;
  specialty: string;
  profession: string;
  experienceYears: number;
  photoUrl: string;
  bio: string;
  createdAt: string;
};

export type CreateDoctorAdminInput = {
  fullName: string;
  email: string;
  password: string;
  specialty: string;
  profession: string;
  experienceYears: number;
  photoUrl: string;
  bio: string;
};

export type UpdateDoctorAdminInput = {
  fullName: string;
  email: string;
  specialty: string;
  profession: string;
  experienceYears: number;
  photoUrl: string;
  bio: string;
  password?: string;
};

let authTablesReadyPromise: Promise<void> | null = null;
let authTablesReady = false;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, encoded: string) {
  const [salt, hashHex] = encoded.split(":");
  if (!salt || !hashHex) {
    return false;
  }

  const incoming = scryptSync(password, salt, 64);
  const existing = Buffer.from(hashHex, "hex");

  if (incoming.length !== existing.length) {
    return false;
  }

  return timingSafeEqual(incoming, existing);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toUser(row: DoctorUserRow): DoctorAuthUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    specialty: row.specialty,
  };
}

function toAdminUser(row: DoctorUserRow): DoctorAdminUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    specialty: row.specialty,
    profession: row.profession ?? row.specialty,
    experienceYears: row.experience_years ?? 0,
    photoUrl: row.photo_url ?? "",
    bio: row.bio ?? "",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

async function ensurePublicDoctorsTable(sql: ReturnType<typeof getSql>) {
  await sql`
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
  `;

  await sql`
    ALTER TABLE doctors
    ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
  `;
}

async function syncDoctorToPublicListing(sql: ReturnType<typeof getSql>, doctor: DoctorUserRow) {
  const roleTitle = (doctor.profession ?? doctor.specialty).trim();
  const specialty = doctor.specialty.trim();
  const experienceYears = Math.max(0, Math.trunc(doctor.experience_years ?? 0));
  const photoUrl = (doctor.photo_url ?? "").trim();
  const bio = (doctor.bio ?? "").trim();

  const rows = (await sql`
    INSERT INTO doctors (
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
      board_certified,
      email
    )
    VALUES (
      ${doctor.full_name.trim()},
      ${roleTitle},
      ${specialty},
      ${experienceYears},
      250,
      ${photoUrl},
      'AVAILABLE TODAY',
      'Central Atelier Medical, Medical District',
      ${bio},
      'EN',
      true,
      ${doctor.email.trim().toLowerCase()}
    )
    ON CONFLICT (email)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role_title = EXCLUDED.role_title,
      specialty = EXCLUDED.specialty,
      experience_years = EXCLUDED.experience_years,
      photo_url = EXCLUDED.photo_url,
      bio = EXCLUDED.bio
    RETURNING id;
  `) as DoctorProfileIdRow[];

  return rows[0]?.id ?? null;
}

export async function ensureDoctorAuthTables() {
  if (authTablesReady) {
    return;
  }

  if (authTablesReadyPromise) {
    return authTablesReadyPromise;
  }

  if (!isNeonConfigured()) {
    return;
  }

  const sql = getSql();

  authTablesReadyPromise = sql`
    CREATE TABLE IF NOT EXISTS doctor_users (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      specialty TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
    );
  `
    .then(async () => {
      await ensurePublicDoctorsTable(sql);

      await sql`
        CREATE TABLE IF NOT EXISTS doctor_portal_sessions (
          id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          doctor_user_id INTEGER NOT NULL REFERENCES doctor_users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
        );
      `;

      await sql`
        ALTER TABLE doctor_users
        ADD COLUMN IF NOT EXISTS profession TEXT;
      `;

      await sql`
        ALTER TABLE doctor_users
        ADD COLUMN IF NOT EXISTS experience_years INTEGER;
      `;

      await sql`
        ALTER TABLE doctor_users
        ADD COLUMN IF NOT EXISTS photo_url TEXT;
      `;

      await sql`
        ALTER TABLE doctor_users
        ADD COLUMN IF NOT EXISTS bio TEXT;
      `;

      await sql`
        ALTER TABLE doctor_users
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');
      `;

      await sql`
        ALTER TABLE doctor_users
        ADD COLUMN IF NOT EXISTS doctor_profile_id INTEGER;
      `;

      await sql`
        UPDATE doctor_users
        SET
          profession = COALESCE(profession, specialty),
          experience_years = COALESCE(experience_years, 0),
          photo_url = COALESCE(photo_url, ''),
          bio = COALESCE(bio, '')
        WHERE profession IS NULL
           OR experience_years IS NULL
           OR photo_url IS NULL
           OR bio IS NULL;
      `;

      await sql`
        INSERT INTO doctors (
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
          board_certified,
          email
        )
        SELECT
          u.full_name,
          COALESCE(NULLIF(u.profession, ''), u.specialty),
          u.specialty,
          COALESCE(u.experience_years, 0),
          250,
          COALESCE(u.photo_url, ''),
          'AVAILABLE TODAY',
          'Central Atelier Medical, Medical District',
          COALESCE(u.bio, ''),
          'EN',
          true,
          u.email
        FROM doctor_users u
        WHERE u.doctor_profile_id IS NULL
        ON CONFLICT (email)
        DO UPDATE SET
          full_name = EXCLUDED.full_name,
          role_title = EXCLUDED.role_title,
          specialty = EXCLUDED.specialty,
          experience_years = EXCLUDED.experience_years,
          photo_url = EXCLUDED.photo_url,
          bio = EXCLUDED.bio;
      `;

      await sql`
        UPDATE doctor_users u
        SET doctor_profile_id = d.id
        FROM doctors d
        WHERE u.doctor_profile_id IS NULL
          AND d.email = u.email;
      `;

      authTablesReady = true;
    })
    .then(() => undefined)
    .finally(() => {
      authTablesReadyPromise = null;
    });

  return authTablesReadyPromise;
}

export async function loginDoctor(email: string, password: string) {
  if (!isNeonConfigured()) {
    return { ok: false as const, reason: "NEON_NOT_CONFIGURED" };
  }

  await ensureDoctorAuthTables();
  const sql = getSql();
  const normalizedEmail = normalizeEmail(email);

  const rows = (await sql`
    SELECT id, full_name, email, specialty, password_hash
    FROM doctor_users
    WHERE email = ${normalizedEmail}
    LIMIT 1;
  `) as Array<DoctorUserRow & { password_hash: string }>;

  const user = rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    return { ok: false as const, reason: "INVALID_CREDENTIALS" };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await sql`
    INSERT INTO doctor_portal_sessions (doctor_user_id, token_hash, expires_at)
    VALUES (${user.id}, ${tokenHash}, ${expiresAt.toISOString()});
  `;

  return {
    ok: true as const,
    token,
    user: toUser(user),
    maxAgeSeconds: SESSION_DURATION_DAYS * 24 * 60 * 60,
  };
}

export async function logoutDoctorByToken(token: string) {
  if (!isNeonConfigured() || !token) {
    return;
  }

  await ensureDoctorAuthTables();
  const sql = getSql();
  const tokenHash = hashSessionToken(token);

  await sql`
    DELETE FROM doctor_portal_sessions
    WHERE token_hash = ${tokenHash};
  `;
}

export async function getDoctorUserByToken(token: string): Promise<DoctorAuthUser | null> {
  if (!isNeonConfigured() || !token) {
    return null;
  }

  await ensureDoctorAuthTables();
  const sql = getSql();
  const tokenHash = hashSessionToken(token);

  const rows = (await sql`
    SELECT u.id, u.full_name, u.email, u.specialty
    FROM doctor_portal_sessions s
    JOIN doctor_users u ON u.id = s.doctor_user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > (NOW() AT TIME ZONE 'Asia/Kolkata')
    LIMIT 1;
  `) as DoctorUserRow[];

  return rows.length > 0 ? toUser(rows[0]) : null;
}

export async function getDoctorFromRequest(request: NextRequest): Promise<DoctorAuthUser | null> {
  const token = request.cookies.get(DOCTOR_SESSION_COOKIE)?.value ?? "";
  if (!token) {
    return null;
  }

  return getDoctorUserByToken(token);
}

export async function listDoctorAccounts(): Promise<DoctorAdminUser[]> {
  if (!isNeonConfigured()) {
    return [];
  }

  await ensureDoctorAuthTables();
  const sql = getSql();

  const rows = (await sql`
    SELECT id, full_name, email, specialty, profession, experience_years, photo_url, bio, created_at
    FROM doctor_users
    ORDER BY id DESC;
  `) as DoctorUserRow[];

  return rows.map((row) => toAdminUser(row));
}

export async function createDoctorAccount(input: CreateDoctorAdminInput): Promise<DoctorAdminUser> {
  if (!isNeonConfigured()) {
    throw new Error("NEON_NOT_CONFIGURED");
  }

  await ensureDoctorAuthTables();
  const sql = getSql();

  const rows = (await sql`
    INSERT INTO doctor_users (
      full_name,
      email,
      password_hash,
      specialty,
      profession,
      experience_years,
      photo_url,
      bio,
      updated_at
    )
    VALUES (
      ${input.fullName.trim()},
      ${normalizeEmail(input.email)},
      ${hashPassword(input.password)},
      ${input.specialty.trim()},
      ${input.profession.trim()},
      ${Math.max(0, Math.trunc(input.experienceYears))},
      ${input.photoUrl.trim()},
      ${input.bio.trim()},
      (NOW() AT TIME ZONE 'Asia/Kolkata')
    )
    RETURNING id, full_name, email, specialty, profession, experience_years, photo_url, bio, created_at;
  `) as DoctorUserRow[];

  const inserted = rows[0];
  const profileId = await syncDoctorToPublicListing(sql, inserted);

  if (profileId) {
    await sql`
      UPDATE doctor_users
      SET doctor_profile_id = ${profileId}
      WHERE id = ${inserted.id};
    `;
  }

  return toAdminUser(inserted);
}

export async function updateDoctorAccount(id: number, input: UpdateDoctorAdminInput): Promise<DoctorAdminUser | null> {
  if (!isNeonConfigured()) {
    throw new Error("NEON_NOT_CONFIGURED");
  }

  await ensureDoctorAuthTables();
  const sql = getSql();

  let rows: DoctorUserRow[] = [];
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedExperience = Math.max(0, Math.trunc(input.experienceYears));

  if (input.password && input.password.trim().length > 0) {
    rows = (await sql`
      UPDATE doctor_users
      SET
        full_name = ${input.fullName.trim()},
        email = ${normalizedEmail},
        password_hash = ${hashPassword(input.password)},
        specialty = ${input.specialty.trim()},
        profession = ${input.profession.trim()},
        experience_years = ${normalizedExperience},
        photo_url = ${input.photoUrl.trim()},
        bio = ${input.bio.trim()},
        updated_at = (NOW() AT TIME ZONE 'Asia/Kolkata')
      WHERE id = ${id}
      RETURNING id, full_name, email, specialty, profession, experience_years, photo_url, bio, created_at;
    `) as DoctorUserRow[];
  } else {
    rows = (await sql`
      UPDATE doctor_users
      SET
        full_name = ${input.fullName.trim()},
        email = ${normalizedEmail},
        specialty = ${input.specialty.trim()},
        profession = ${input.profession.trim()},
        experience_years = ${normalizedExperience},
        photo_url = ${input.photoUrl.trim()},
        bio = ${input.bio.trim()},
        updated_at = (NOW() AT TIME ZONE 'Asia/Kolkata')
      WHERE id = ${id}
      RETURNING id, full_name, email, specialty, profession, experience_years, photo_url, bio, created_at;
    `) as DoctorUserRow[];
  }

  if (rows.length === 0) {
    return null;
  }

  const updated = rows[0];
  const profileId = await syncDoctorToPublicListing(sql, updated);

  if (profileId) {
    await sql`
      UPDATE doctor_users
      SET doctor_profile_id = ${profileId}
      WHERE id = ${updated.id};
    `;
  }

  return toAdminUser(updated);
}

export async function deleteDoctorAccount(id: number): Promise<boolean> {
  if (!isNeonConfigured()) {
    throw new Error("NEON_NOT_CONFIGURED");
  }

  await ensureDoctorAuthTables();
  const sql = getSql();

  const existing = (await sql`
    SELECT doctor_profile_id
    FROM doctor_users
    WHERE id = ${id}
    LIMIT 1;
  `) as Array<{ doctor_profile_id?: number | null }>;

  const profileId = existing[0]?.doctor_profile_id ?? null;

  const rows = (await sql`
    DELETE FROM doctor_users
    WHERE id = ${id}
    RETURNING id;
  `) as Array<{ id: number }>;

  if (rows.length > 0 && profileId) {
    await sql`
      DELETE FROM doctors
      WHERE id = ${profileId};
    `;
  }

  return rows.length > 0;
}
