"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DoctorAdminUser = {
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

type DoctorFormState = {
  fullName: string;
  email: string;
  password: string;
  specialty: string;
  profession: string;
  experienceYears: string;
  photoUrl: string;
  bio: string;
};

const emptyForm: DoctorFormState = {
  fullName: "",
  email: "",
  password: "",
  specialty: "",
  profession: "",
  experienceYears: "",
  photoUrl: "",
  bio: "",
};

function mapDoctorToForm(doctor: DoctorAdminUser): DoctorFormState {
  return {
    fullName: doctor.fullName,
    email: doctor.email,
    password: "",
    specialty: doctor.specialty,
    profession: doctor.profession,
    experienceYears: String(doctor.experienceYears),
    photoUrl: doctor.photoUrl,
    bio: doctor.bio,
  };
}

export default function AdminDoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorAdminUser[]>([]);
  const [form, setForm] = useState<DoctorFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [viewerImageUrl, setViewerImageUrl] = useState("");

  const submitLabel = useMemo(() => {
    if (isSaving) {
      return editingId ? "Updating..." : "Creating...";
    }

    return editingId ? "Update Doctor" : "Create Doctor";
  }, [editingId, isSaving]);

  const loadDoctors = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin-doctors", { cache: "no-store" });

      if (response.status === 401) {
        router.replace("/admin-login");
        return;
      }

      const result = (await response.json()) as { doctors?: DoctorAdminUser[]; error?: string };

      if (!response.ok) {
        setErrorMessage(result.error ?? "Failed to load doctors.");
        return;
      }

      setDoctors(result.doctors ?? []);
    } catch {
      setErrorMessage("Failed to load doctors.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid image file.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";

      if (!result) {
        setErrorMessage("Unable to read uploaded image.");
        return;
      }

      setForm((current) => ({ ...current, photoUrl: result }));
      setErrorMessage("");
    };

    reader.onerror = () => {
      setErrorMessage("Unable to read uploaded image.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const specialty = form.specialty.trim();
    const profession = form.profession.trim();
    const experienceYears = Number(form.experienceYears);
    const photoUrl = form.photoUrl.trim();
    const bio = form.bio.trim();

    if (!fullName || !email || !specialty || !profession) {
      setErrorMessage("Name, email, specialty and profession are required.");
      return;
    }

    if (!editingId && form.password.trim().length < 6) {
      setErrorMessage("Password is required and must be at least 6 characters for new doctor.");
      return;
    }

    if (Number.isNaN(experienceYears) || experienceYears < 0) {
      setErrorMessage("Experience must be a valid number (0 or higher).");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        fullName,
        email,
        password: form.password,
        specialty,
        profession,
        experienceYears,
        photoUrl,
        bio,
      };

      const response = await fetch(editingId ? `/api/admin-doctors/${editingId}` : "/api/admin-doctors", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.replace("/admin-login");
        return;
      }

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setErrorMessage(result.error ?? "Unable to save doctor.");
        return;
      }

      setSuccessMessage(editingId ? "Doctor updated successfully." : "Doctor created successfully.");
      resetForm();
      await loadDoctors();
    } catch {
      setErrorMessage("Unable to save doctor right now.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(doctor: DoctorAdminUser) {
    setErrorMessage("");
    setSuccessMessage("");

    const shouldDelete = window.confirm(`Delete doctor account for ${doctor.fullName}?`);

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/admin-doctors/${doctor.id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.replace("/admin-login");
        return;
      }

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setErrorMessage(result.error ?? "Unable to delete doctor.");
        return;
      }

      if (editingId === doctor.id) {
        resetForm();
      }

      setSuccessMessage("Doctor deleted successfully.");
      await loadDoctors();
    } catch {
      setErrorMessage("Unable to delete doctor right now.");
    }
  }

  async function logoutAdmin() {
    await fetch("/api/admin-auth/logout", { method: "POST" });
    router.replace("/admin-login");
  }

  return (
    <main className="min-h-screen bg-[#eff5f3] px-4 py-6 md:px-6">
      <div className="mx-auto w-full max-w-[1280px] space-y-5">
        <header className="rounded-2xl bg-[#0f4f45] p-5 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b8d8d1]">Admin</p>
              <h1 className="mt-2 text-3xl font-extrabold">Doctor Login Management</h1>
              <p className="mt-2 text-sm text-[#d3ebe4]">
                Create, update, and delete doctor login accounts and profile details.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void logoutAdmin();
              }}
              className="rounded-xl border border-[#86bcb0] px-4 py-2 text-sm font-semibold text-[#e8f7f3] transition hover:bg-[#1d6258]"
            >
              Logout Admin
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
          <article className="rounded-2xl border border-[#d7e4df] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#123c36]">{editingId ? "Edit Doctor" : "Create Doctor"}</h2>
            <p className="mt-1 text-sm text-[#58706a]">
              {editingId
                ? "Update doctor credentials and profile details."
                : "Add a new doctor login with complete profile information."}
            </p>

            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Full name"
                className="w-full rounded-xl border border-[#d4dfdc] bg-[#f8fbfa] px-4 py-3 text-sm outline-none ring-[#0c6a5f] focus:ring-2"
                required
              />

              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email"
                className="w-full rounded-xl border border-[#d4dfdc] bg-[#f8fbfa] px-4 py-3 text-sm outline-none ring-[#0c6a5f] focus:ring-2"
                required
              />

              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={editingId ? "New password (optional)" : "Password"}
                className="w-full rounded-xl border border-[#d4dfdc] bg-[#f8fbfa] px-4 py-3 text-sm outline-none ring-[#0c6a5f] focus:ring-2"
                required={!editingId}
              />

              <input
                type="text"
                value={form.specialty}
                onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))}
                placeholder="Specialty"
                className="w-full rounded-xl border border-[#d4dfdc] bg-[#f8fbfa] px-4 py-3 text-sm outline-none ring-[#0c6a5f] focus:ring-2"
                required
              />

              <input
                type="text"
                value={form.profession}
                onChange={(event) => setForm((current) => ({ ...current, profession: event.target.value }))}
                placeholder="Profession / role"
                className="w-full rounded-xl border border-[#d4dfdc] bg-[#f8fbfa] px-4 py-3 text-sm outline-none ring-[#0c6a5f] focus:ring-2"
                required
              />

              <input
                type="number"
                min={0}
                value={form.experienceYears}
                onChange={(event) => setForm((current) => ({ ...current, experienceYears: event.target.value }))}
                placeholder="Experience in years"
                className="w-full rounded-xl border border-[#d4dfdc] bg-[#f8fbfa] px-4 py-3 text-sm outline-none ring-[#0c6a5f] focus:ring-2"
              />

              <input
                type="url"
                value={form.photoUrl}
                onChange={(event) => setForm((current) => ({ ...current, photoUrl: event.target.value }))}
                placeholder="Photo URL"
                className="w-full rounded-xl border border-[#d4dfdc] bg-[#f8fbfa] px-4 py-3 text-sm outline-none ring-[#0c6a5f] focus:ring-2"
              />

              <label className="block rounded-xl border border-dashed border-[#c8d9d3] bg-[#f7fbfa] px-4 py-3 text-sm text-[#385f56]">
                <span className="font-semibold">Upload photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="mt-2 block w-full text-xs text-[#55746d] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0c6a5f] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                />
              </label>

              {form.photoUrl ? (
                <div className="rounded-xl border border-[#dbe7e2] bg-[#f9fcfb] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#58716a]">Image Preview</p>
                  <div className="relative h-24 w-24">
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, photoUrl: "" }))}
                      className="absolute right-1 top-1 z-10 rounded-full bg-[#9b3838] px-2 py-0.5 text-xs font-semibold text-white"
                      title="Delete image"
                    >
                      X
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewerImageUrl(form.photoUrl)}
                      className="overflow-hidden rounded-lg border border-[#c5d9d2]"
                      title="Click to view image"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.photoUrl}
                        alt="Doctor preview"
                        className="h-24 w-24 object-cover"
                      />
                    </button>
                  </div>
                </div>
              ) : null}

              <textarea
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                placeholder="Doctor bio"
                rows={4}
                className="w-full rounded-xl border border-[#d4dfdc] bg-[#f8fbfa] px-4 py-3 text-sm outline-none ring-[#0c6a5f] focus:ring-2"
              />

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-[#0c6a5f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitLabel}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-[#c7d9d2] px-4 py-2 text-sm font-semibold text-[#315e55]"
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </article>

          <article className="rounded-2xl border border-[#d7e4df] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#123c36]">Doctors</h2>
            <p className="mt-1 text-sm text-[#58706a]">All doctor login accounts with profile details.</p>

            {errorMessage ? <p className="mt-4 rounded-xl bg-[#fcecec] px-3 py-2 text-sm font-semibold text-[#9a3f3f]">{errorMessage}</p> : null}
            {successMessage ? (
              <p className="mt-4 rounded-xl bg-[#e8f5ef] px-3 py-2 text-sm font-semibold text-[#286751]">{successMessage}</p>
            ) : null}

            {isLoading ? (
              <p className="mt-6 text-sm text-[#627973]">Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <p className="mt-6 text-sm text-[#627973]">No doctors found. Create one from the form.</p>
            ) : (
              <div className="mt-5 space-y-3">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="rounded-xl border border-[#dbe7e2] bg-[#f9fcfb] p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 gap-3">
                        {doctor.photoUrl ? (
                          <button
                            type="button"
                            onClick={() => setViewerImageUrl(doctor.photoUrl)}
                            className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#c8dbd4]"
                            title="Click to view image"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={doctor.photoUrl}
                              alt={`${doctor.fullName} photo`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ) : null}

                        <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-[#123d36]">{doctor.fullName}</p>
                        <p className="mt-1 text-sm text-[#4f6a64]">{doctor.email}</p>
                        <p className="mt-1 text-sm text-[#4f6a64]">
                          {doctor.profession} · {doctor.specialty} · {doctor.experienceYears} years
                        </p>
                        {doctor.bio ? <p className="mt-2 line-clamp-2 text-sm text-[#5a746d]">{doctor.bio}</p> : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(doctor.id);
                            setForm(mapDoctorToForm(doctor));
                            setSuccessMessage("");
                            setErrorMessage("");
                          }}
                          className="rounded-lg border border-[#b7d2ca] px-3 py-2 text-xs font-semibold text-[#28594f]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleDelete(doctor);
                          }}
                          className="rounded-lg border border-[#e3bbbb] bg-[#fff4f4] px-3 py-2 text-xs font-semibold text-[#9a3f3f]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>

      {viewerImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setViewerImageUrl("")}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewerImageUrl("")}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white"
            >
              Close
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewerImageUrl}
              alt="Doctor full preview"
              className="max-h-[90vh] w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
