import { getSql, isNeonConfigured } from "@/lib/neon";

type DbError = {
  code?: string;
  constraint?: string;
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

type DoctorSeed = Omit<Doctor, "id">;

const fallbackDoctors: DoctorSeed[] = [
  {
    fullName: "Dr. Julian Sterling",
    roleTitle: "Senior Cardiologist",
    specialty: "Cardiology",
    experienceYears: 14,
    consultationFee: 250,
    photoUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDZRI-uGGFFqEkMrDBiwK9bViVpUbN_4iZfK4yFyxshYSlBMPdq-x2DMwbj8ojNjqxeOK_R3P6yBue6QBEW1O2av4GfcUirYOuNJHseNNv4vyWD37G4hoTi1CRDCcSUVO3SIGbSzGOxkAcK2xGohCw1QpE0JN1nhAy9YtX27Pn9xu4GE7B5CR7A4P5BuBQ69yqM9oG2RpCl3oSmTFS4wXU5IClnaOynJSi0hAaXo3rwKm9PSmfRc3nL5IlDf5MHDa66-uBWXGraF-QY",
    availabilityTag: "AVAILABLE TODAY",
    locationName: "Central Atelier Medical, Medical District",
    bio: "Dr. Sterling focuses on preventive cardiology and personalized treatment pathways for long-term heart health.",
    languages: "EN, FR",
    boardCertified: true,
  },
  {
    fullName: "Dr. Sarah Chen",
    roleTitle: "Dermatology Lead",
    specialty: "Dermatology",
    experienceYears: 11,
    consultationFee: 180,
    photoUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC-xyAL8DJB5fmqk41b8B-bRrX-xutj4hyMVlNJalBfaNxIskSDAbBmnF5XywYOBPDV77m7FgKH7Hi3qX1oRWB2aVYY2A1EDnwhWe7adhXSC3XEZ-N-MPmFyg6qj9aPrrzVWerLJWfowh7vr8R1wWmmaoXWQBoWvpMAEwLrTkqJlVI5dek6ap5Bi58ttwEmV5HMDsMZ1A03NjlaVGZ-BgN40ilBjUY-TSK8YiacTXh6QELmsKRcnBAOuVdBgi42XCfA3yGWqIfzzYqz",
    availabilityTag: "NEXT AVAIL. MON",
    locationName: "Central Atelier Medical, Medical District",
    bio: "Dr. Chen combines medical and aesthetic dermatology with a focus on evidence-based skin treatment plans.",
    languages: "EN, ZH",
    boardCertified: true,
  },
  {
    fullName: "Dr. Marcus Thorne",
    roleTitle: "Neurology Specialist",
    specialty: "Neurology",
    experienceYears: 19,
    consultationFee: 320,
    photoUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCQieDzxH8peD2Z2LZyGD109ujSGm1AKdO58alCYRG3e6OhSiyKHxwe92C_oOt5kfWKEOfyNSB41jXa-V9bsRgHRFIg7qgN3wfwytQxHvUDSzOwIrTJPm8nywMjakvDJ4711AZX75thdhbVfDY3y4nIrLFMKi7xyv5fQC8E_hGsisDVa8SqyeXKezLzPSc4W40FvNM0of3ZNNFMSubaayFYYj0zQPJZ8qr_leRHQhj9WCzxUrkFmoKA0FwKIHsXk7-A3oKv_yqu-IMD",
    availabilityTag: "AVAILABLE TODAY",
    locationName: "Central Atelier Medical, Medical District",
    bio: "Dr. Thorne treats complex neurological disorders with a patient-centric approach and targeted diagnostics.",
    languages: "EN",
    boardCertified: true,
  },
  {
    fullName: "Dr. Elena Rodriguez",
    roleTitle: "Psychiatry Specialist",
    specialty: "Psychiatry",
    experienceYears: 8,
    consultationFee: 165,
    photoUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtSBdBny-0gc-qlThGKOB4B2rgD9l9BdTsQ8gkBlLE7yeYDsyVPI9svh3SQHys8T2SMMc_HRkohSVnqV2KlqkP7zLKQrkWih_E9vae_RcB5YyjPqH0kHkHZ4fFsJvCI01d2b6JAW18ZCeWcMwtZoKgJ9OSXjFSs9qpOQc6ID_SoMJaK2tdA2CTp9ghjRA8ob9qEdzt1E6Qi7P257pgloVkmSEVmvFqHKtHVan9Zl0MoA5Bj-tFFWW7k3cXGTe-TTAKRyPpf7unxv0P",
    availabilityTag: "AVAILABLE TODAY",
    locationName: "Central Atelier Medical, Medical District",
    bio: "Dr. Rodriguez provides compassionate psychiatric care with practical plans tailored for each patient.",
    languages: "EN, ES",
    boardCertified: true,
  },
];

let seedPromise: Promise<void> | null = null;
let hasSeededDoctors = false;

function getFallbackDoctors(specialty?: string): Doctor[] {
  const seed = fallbackDoctors.map((doctor, index) =>
    createFallbackDoctor(index + 1, doctor),
  );

  if (!specialty || specialty === "All") {
    return seed;
  }

  return seed.filter((doctor) => doctor.specialty === specialty);
}

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

function createFallbackDoctor(id: number, doctor: DoctorSeed): Doctor {
  return {
    id: String(id),
    ...doctor,
  };
}

async function ensureDoctorsSeededInternal() {
  if (!isNeonConfigured()) {
    return;
  }

  const sql = getSql();

  try {
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
  } catch (error) {
    const dbError = error as DbError;
    const isKnownConcurrentCreateRace =
      dbError.code === "23505" && dbError.constraint === "pg_class_relname_nsp_index";

    if (!isKnownConcurrentCreateRace) {
      throw error;
    }
  }

  for (const doctor of fallbackDoctors) {
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
        board_certified
      )
      SELECT
        ${doctor.fullName},
        ${doctor.roleTitle},
        ${doctor.specialty},
        ${doctor.experienceYears},
        ${doctor.consultationFee},
        ${doctor.photoUrl},
        ${doctor.availabilityTag},
        ${doctor.locationName},
        ${doctor.bio},
        ${doctor.languages},
        ${doctor.boardCertified}
      WHERE NOT EXISTS (
        SELECT 1
        FROM doctors
        WHERE full_name = ${doctor.fullName}
      );
    `;
  }
}

async function ensureDoctorsSeeded() {
  if (hasSeededDoctors) {
    return;
  }

  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = ensureDoctorsSeededInternal()
    .then(() => {
      hasSeededDoctors = true;
    })
    .finally(() => {
      seedPromise = null;
    });

  return seedPromise;
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
    return dedupeDoctors(getFallbackDoctors(specialty));
  }

  try {
    await ensureDoctorsSeeded();
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
      return dedupeDoctors(getFallbackDoctors(specialty));
    }

    throw error;
  }
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  if (!isNeonConfigured()) {
    const seedDoctor = getFallbackDoctors().find((doctor) => doctor.id === id);

    return seedDoctor ?? null;
  }

  try {
    await ensureDoctorsSeeded();
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
      const seedDoctor = getFallbackDoctors().find((doctor) => doctor.id === id);
      return seedDoctor ?? null;
    }

    throw error;
  }
}