"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DoctorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#d6e0dc] bg-[#f7faf8] px-4 py-3 pr-12 outline-none ring-[#0c6a5f] focus:ring-2"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#52736c] hover:text-[#21453f] focus:outline-none"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.58 10.58a2 2 0 102.83 2.83M9.88 5.09A9.8 9.8 0 0112 4c5 0 8.27 4 9 8a13.24 13.24 0 01-2.23 4.36M6.1 6.1C3.97 7.58 2.59 9.64 2 12c.73 4 4 8 10 8 1.66 0 3.14-.31 4.45-.86"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8-10-8-10-8z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#0c6a5f] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Login to Portal"}
          </button>

          <Link
            href="/admin-login"
            className="block text-center text-xs font-semibold text-[#365f58] underline decoration-[#9cb8b1] underline-offset-4 transition hover:text-[#1f4d45]"
          >
            Admin Login
          </Link>

          {errorMessage ? <p className="text-sm font-semibold text-[#9e3d3d]">{errorMessage}</p> : null}
        </form>
      </section>
    </div>
  );
}
