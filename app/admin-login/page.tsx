"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <div className="min-h-screen bg-[#f1f6f4] text-[#182221]">
      <header className="border-b border-[#d8e0dd] bg-[#eaf2ef]">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-[2rem] font-bold leading-none tracking-tight text-[#093530]">
              Clinic Booking
            </Link>
            <nav className="hidden gap-6 text-sm md:flex">
              <Link href="/find-doctor" className="border-b-2 border-[#0f6157] pb-1 font-semibold text-[#0f3e38]">
                Find Doctors
              </Link>
            </nav>
          </div>

          <Link href="/doctor-login" className="rounded-full bg-[#005e52] px-5 py-2 text-sm font-semibold text-white">
            Sign In
          </Link>
        </div>
      </header>

      <main className="px-5 py-12">
        <section className="mx-auto w-full max-w-[430px] rounded-2xl border border-[#d8e3df] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60736e]">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#173f39]">Admin Login</h1>
          <p className="mt-2 text-sm text-[#5a716a]">Login to manage doctor accounts and profile details.</p>

          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
            event.preventDefault();
            setErrorMessage("");
            setIsSubmitting(true);

            try {
              const response = await fetch("/api/admin-auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              });

              const result = (await response.json()) as { error?: string };

              if (!response.ok) {
                setErrorMessage(result.error ?? "Unable to login.");
                return;
              }

              router.replace("/admin-doctors");
            } catch {
              setErrorMessage("Unable to login right now. Please try again.");
            } finally {
              setIsSubmitting(false);
            }
            }}
          >
            <label className="block text-sm font-semibold text-[#22423d]">
              Admin Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#d6e0dc] bg-[#f7faf8] px-4 py-3 outline-none ring-[#0c6a5f] focus:ring-2"
                placeholder="admin@site.com"
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
              {isSubmitting ? "Signing in..." : "Login as Admin"}
            </button>

            <Link
              href="/doctor-login"
              className="block text-center text-xs font-semibold text-[#365f58] underline decoration-[#9cb8b1] underline-offset-4 transition hover:text-[#1f4d45]"
            >
              Doctor Login
            </Link>

            {errorMessage ? <p className="text-sm font-semibold text-[#9d3f3f]">{errorMessage}</p> : null}
          </form>
        </section>
      </main>
    </div>
  );
}
