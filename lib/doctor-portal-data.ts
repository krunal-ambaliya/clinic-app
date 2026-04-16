export type AppointmentStatus = "confirmed" | "completed" | "cancelled";

export type DoctorAppointment = {
  id: string;
  patientName: string;
  phone: string;
  symptoms: string;
  dateIso: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
};

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateWithOffset(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export const doctorAppointments: DoctorAppointment[] = [
  {
    id: "APT-1001",
    patientName: "Rahul Sharma",
    phone: "9876543210",
    symptoms: "Headache and light dizziness",
    dateIso: dateWithOffset(0),
    time: "09:30 AM",
    status: "confirmed",
    notes: "First consultation. Bring last blood test reports.",
  },
  {
    id: "APT-1002",
    patientName: "Anita Patel",
    phone: "9898989898",
    symptoms: "Skin rash for 3 days",
    dateIso: dateWithOffset(0),
    time: "11:00 AM",
    status: "confirmed",
    notes: "Possible allergic reaction. Check medication history.",
  },
  {
    id: "APT-1003",
    patientName: "Manoj Iyer",
    phone: "9811122233",
    symptoms: "Chest tightness after exercise",
    dateIso: dateWithOffset(0),
    time: "02:30 PM",
    status: "confirmed",
    notes: "ECG follow-up required.",
  },
  {
    id: "APT-1004",
    patientName: "Sana Khan",
    phone: "9765432101",
    symptoms: "Recurring migraine",
    dateIso: dateWithOffset(1),
    time: "10:15 AM",
    status: "confirmed",
    notes: "Track trigger patterns and sleep cycle.",
  },
  {
    id: "APT-1005",
    patientName: "Vikram Joshi",
    phone: "9123456789",
    symptoms: "Follow-up for anxiety treatment",
    dateIso: dateWithOffset(2),
    time: "12:00 PM",
    status: "completed",
    notes: "Continue current treatment plan for 2 weeks.",
  },
  {
    id: "APT-1006",
    patientName: "Priya Menon",
    phone: "9000011111",
    symptoms: "Mild fever and cough",
    dateIso: dateWithOffset(3),
    time: "04:00 PM",
    status: "cancelled",
    notes: "Patient requested reschedule due to travel.",
  },
];

export const weeklyAvailability = [
  { day: "Monday", enabled: true, start: "09:00", end: "13:00" },
  { day: "Tuesday", enabled: true, start: "10:00", end: "14:00" },
  { day: "Wednesday", enabled: true, start: "09:00", end: "13:00" },
  { day: "Thursday", enabled: true, start: "10:00", end: "14:00" },
  { day: "Friday", enabled: true, start: "09:00", end: "13:00" },
  { day: "Saturday", enabled: false, start: "09:00", end: "11:00" },
  { day: "Sunday", enabled: false, start: "09:00", end: "11:00" },
] as const;

export function formatPrettyDate(dateIso: string) {
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
