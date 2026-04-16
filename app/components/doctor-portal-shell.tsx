"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarClock, CalendarPlus2, Clock3, LayoutDashboard } from "lucide-react";

type DoctorPortalShellProps = {
  children: React.ReactNode;
  doctorName: string;
};

const navItems = [
  { label: "Dashboard", href: "/doctor-portal", icon: LayoutDashboard },
  { label: "All Appointments", href: "/doctor-portal/appointments", icon: CalendarClock },
  { label: "New Appointment", href: "/doctor-portal/appointments/new", icon: CalendarPlus2 },
  { label: "Manage Availability", href: "/doctor-portal/availability", icon: Clock3 },
];

function isActive(pathname: string, href: string) {
  if (href === "/doctor-portal/appointments/new") {
    return pathname === href;
  }

  if (href === "/doctor-portal/appointments") {
    return (
      pathname === href ||
      (pathname.startsWith("/doctor-portal/appointments/") &&
        !pathname.startsWith("/doctor-portal/appointments/new"))
    );
  }

  if (href === "/doctor-portal") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function DoctorPortalShell({ children, doctorName }: DoctorPortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f2f6f5] text-[#182221]">
      <header className="border-b border-[#dce5e2] bg-white">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-4 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f726d]">Doctor Portal</p>
            <h1 className="text-xl font-extrabold text-[#113934]">Clinic Atelier</h1>
            <p className="text-sm font-semibold text-[#4b615c]">{doctorName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/find-doctor"
              className="rounded-xl bg-[#0c6a5f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00564b]"
            >
              Patient Side
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/doctor-auth/logout", { method: "POST" });
                router.replace("/doctor-login");
              }}
              className="rounded-xl bg-[#e8efec] px-4 py-2 text-sm font-semibold text-[#204843]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-2xl border border-[#dce5e2] bg-white p-3 shadow-sm">
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[#e1f0ec] text-[#0f4f46]"
                      : "text-[#4b615c] hover:bg-[#f2f6f5] hover:text-[#113934]"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
