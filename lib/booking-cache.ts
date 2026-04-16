export type BookingDoctorSnapshot = {
  id: string;
  fullName: string;
  roleTitle: string;
  specialty: string;
  consultationFee: number;
  photoUrl: string;
  locationName: string;
};

export type BookingSchedule = {
  dateIso: string;
  dateLabel: string;
  slot: string;
};

export type BookingPatientDetails = {
  fullName: string;
  phoneNumber: string;
  symptoms?: string;
  notes?: string;
};

export type BookingPayment = {
  method: "card" | "wallet";
};

export type BookingConfirmation = {
  appointmentId: string;
  status: "paid";
  paidAt: string;
};

export type BookingDraft = {
  doctor?: BookingDoctorSnapshot;
  schedule?: BookingSchedule;
  patient?: BookingPatientDetails;
  payment?: BookingPayment;
  confirmation?: BookingConfirmation;
  maxReachedStep?: number;
  updatedAt?: string;
};

const BOOKING_CACHE_KEY = "clinic-booking-draft-v1";

function hasWindow() {
  return typeof window !== "undefined";
}

export function getBookingDraft(): BookingDraft {
  if (!hasWindow()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(BOOKING_CACHE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as BookingDraft;
  } catch {
    return {};
  }
}

export function saveBookingDraft(draft: BookingDraft) {
  if (!hasWindow()) {
    return;
  }

  const withTimestamp: BookingDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(BOOKING_CACHE_KEY, JSON.stringify(withTimestamp));
}

export function updateBookingDraft(patch: Partial<BookingDraft>) {
  const current = getBookingDraft();

  const next: BookingDraft = {
    ...current,
  };

  if ("doctor" in patch) {
    next.doctor = patch.doctor;
  }
  if ("schedule" in patch) {
    next.schedule = patch.schedule;
  }
  if ("patient" in patch) {
    next.patient = patch.patient;
  }
  if ("payment" in patch) {
    next.payment = patch.payment;
  }
  if ("confirmation" in patch) {
    next.confirmation = patch.confirmation;
  }

  saveBookingDraft(next);
  return next;
}

export function clearBookingDraft() {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(BOOKING_CACHE_KEY);
}

export function markReachedStep(step: number) {
  const normalized = Math.max(1, Math.min(4, step));
  const current = getBookingDraft();
  const previous = current.maxReachedStep ?? 1;

  saveBookingDraft({
    ...current,
    maxReachedStep: Math.max(previous, normalized),
  });
}

export function hasUnlockedProgressNavigation() {
  const current = getBookingDraft();
  return (current.maxReachedStep ?? 1) >= 4;
}
