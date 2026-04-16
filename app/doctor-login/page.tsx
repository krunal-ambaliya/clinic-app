"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DoctorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen bg-[#f2f6f5] px-5 py-10">
      <section className="mx-auto w-full max-w-[420px] rounded-2xl border border-[#dbe5e1] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60736e]">Doctor Portal</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#133a35]">Doctor Login</h1>
        <p className="mt-2 text-sm text-[#5e726d]">Use your doctor account to access appointments and schedule.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setErrorMessage("");
            setIsSubmitting(true);

            try {
              const response = await fetch("/api/doctor-auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              });

              const result = (await response.json()) as { error?: string };

              if (!response.ok) {
                setErrorMessage(result.error ?? "Unable to login.");
                return;
              }

              router.replace("/doctor-portal");
            } catch {
              setErrorMessage("Unable to login right now. Please try again.");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <label className="block text-sm font-semibold text-[#22423d]">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d6e0dc] bg-[#f7faf8] px-4 py-3 outline-none ring-[#0c6a5f] focus:ring-2"
              placeholder="doctor@example.com"
              required
            />
          </label>

          <label className="block text-sm font-semibold text-[#22423d]">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d6e0dc] bg-[#f7faf8] px-4 py-3 outline-none ring-[#0c6a5f] focus:ring-2"
              placeholder="Enter password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#0c6a5f] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Login to Portal"}
          </button>

          {errorMessage ? <p className="text-sm font-semibold text-[#9e3d3d]">{errorMessage}</p> : null}
        </form>
      </section>
    </div>
  );
}
