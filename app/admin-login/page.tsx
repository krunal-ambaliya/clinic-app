"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <div className="min-h-screen bg-[#f1f6f4] px-5 py-12">
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
            {isSubmitting ? "Signing in..." : "Login as Admin"}
          </button>

          {errorMessage ? <p className="text-sm font-semibold text-[#9d3f3f]">{errorMessage}</p> : null}
        </form>
      </section>
    </div>
  );
}
