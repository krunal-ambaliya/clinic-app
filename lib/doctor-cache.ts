import type { Doctor } from "@/api/doctors";

const DOCTOR_CACHE_TTL_MS = 30 * 1000;

type DoctorsListCacheEntry = {
  doctors: Doctor[];
  expiresAt: number;
};

type DoctorByIdCacheEntry = {
  doctor: Doctor | null;
  expiresAt: number;
};

const doctorsBySpecialtyCache = new Map<string, DoctorsListCacheEntry>();
const doctorByIdCache = new Map<string, DoctorByIdCacheEntry>();

function isExpired(expiresAt: number) {
  return Date.now() > expiresAt;
}

export function getCachedDoctorsBySpecialty(specialty?: string) {
  const key = specialty ?? "__all__";
  const entry = doctorsBySpecialtyCache.get(key);

  if (!entry) {
    return null;
  }

  if (isExpired(entry.expiresAt)) {
    doctorsBySpecialtyCache.delete(key);
    return null;
  }

  return entry.doctors;
}

export function setCachedDoctorsBySpecialty(doctors: Doctor[], specialty?: string) {
  const key = specialty ?? "__all__";
  doctorsBySpecialtyCache.set(key, {
    doctors,
    expiresAt: Date.now() + DOCTOR_CACHE_TTL_MS,
  });
}

export function getCachedDoctorById(id: string) {
  if (!doctorByIdCache.has(id)) {
    return undefined;
  }

  const entry = doctorByIdCache.get(id);

  if (!entry) {
    return undefined;
  }

  if (isExpired(entry.expiresAt)) {
    doctorByIdCache.delete(id);
    return undefined;
  }

  return entry.doctor;
}

export function setCachedDoctorById(id: string, doctor: Doctor | null) {
  doctorByIdCache.set(id, {
    doctor,
    expiresAt: Date.now() + DOCTOR_CACHE_TTL_MS,
  });
}

export function invalidateDoctorCache() {
  doctorsBySpecialtyCache.clear();
  doctorByIdCache.clear();
}
