import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  ChevronRight,
  CirclePlay,
  Heart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const doctorAvatars = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDZRI-uGGFFqEkMrDBiwK9bViVpUbN_4iZfK4yFyxshYSlBMPdq-x2DMwbj8ojNjqxeOK_R3P6yBue6QBEW1O2av4GfcUirYOuNJHseNNv4vyWD37G4hoTi1CRDCcSUVO3SIGbSzGOxkAcK2xGohCw1QpE0JN1nhAy9YtX27Pn9xu4GE7B5CR7A4P5BuBQ69yqM9oG2RpCl3oSmTFS4wXU5IClnaOynJSi0hAaXo3rwKm9PSmfRc3nL5IlDf5MHDa66-uBWXGraF-QY",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-xyAL8DJB5fmqk41b8B-bRrX-xutj4hyMVlNJalBfaNxIskSDAbBmnF5XywYOBPDV77m7FgKH7Hi3qX1oRWB2aVYY2A1EDnwhWe7adhXSC3XEZ-N-MPmFyg6qj9aPrrzVWerLJWfowh7vr8R1wWmmaoXWQBoWvpMAEwLrTkqJlVI5dek6ap5Bi58ttwEmV5HMDsMZ1A03NjlaVGZ-BgN40ilBjUY-TSK8YiacTXh6QELmsKRcnBAOuVdBgi42XCfA3yGWqIfzzYqz",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCQieDzxH8peD2Z2LZyGD109ujSGm1AKdO58alCYRG3e6OhSiyKHxwe92C_oOt5kfWKEOfyNSB41jXa-V9bsRgHRFIg7qgN3wfwytQxHvUDSzOwIrTJPm8nywMjakvDJ4711AZX75thdhbVfDY3y4nIrLFMKi7xyv5fQC8E_hGsisDVa8SqyeXKezLzPSc4W40FvNM0of3ZNNFMSubaayFYYj0zQPJZ8qr_leRHQhj9WCzxUrkFmoKA0FwKIHsXk7-A3oKv_yqu-IMD",
];

const departments = [
  {
    title: "Cardiology",
    description:
      "Advanced heart care with precision diagnostics and personalized treatment plans.",
    icon: "heart",
  },
  {
    title: "Neurology",
    description:
      "Expert neurological consultation for complex disorders and brain health management.",
    icon: "brain",
  },
  {
    title: "Dermatology",
    description:
      "Comprehensive skin care, diagnosis, and long-term treatment strategies.",
    icon: "sparkles",
  },
  {
    title: "Psychiatry",
    description:
      "Compassionate mental health care focused on sustainable, practical recovery plans.",
    icon: "brain",
  },
];

export default function Home() {
  return (
    <div className="w-full bg-[#f7faf8] text-[#181c1b]">
      <header className="sticky top-0 z-50 mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between border-b border-[#e0e3e1] bg-[#f7faf8]/85 px-6 backdrop-blur-xl lg:px-8">
        <div className="flex items-center gap-6 lg:gap-8">
          <span className="text-xl font-bold tracking-tight text-[#10332d] lg:text-2xl">
            Clinic Booking
          </span>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="/find-doctor"
              className="border-b-2 border-[#046b5e] pb-1 text-sm font-semibold text-[#10332d]"
            >
              Find Doctors
            </a>
            <a href="#" className="text-sm text-[#4b6862] hover:text-[#046b5e]">
              Emergency Care
            </a>
          </nav>
        </div>
        <Link
          href="/doctor-login"
          className="rounded-lg bg-[#004f45] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#00695c]"
        >
          Sign In
        </Link>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-12 lg:px-8 lg:pt-16">
          <div className="space-y-7 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#c6e6de] px-4 py-2 text-xs font-semibold tracking-wide text-[#2f4c46]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              SECURE APPOINTMENT BOOKING
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Book Doctor
              <br />
              Appointments <span className="font-medium italic text-[#046b5e]">Easily</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-[#3e4946]">
              Find doctors, choose time, and book instantly. Experience medical
              care reimagined with clinical precision and digital serenity.
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link
                href="/find-doctor"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#004f45] px-7 py-4 text-base font-bold text-white shadow-lg shadow-[#004f45]/15 transition hover:bg-[#00695c]"
              >
                Find Doctors
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e5e9e6] px-7 py-4 text-base font-bold text-[#004f45] transition hover:bg-[#dfe4e1]">
                <CirclePlay className="h-4 w-4" aria-hidden="true" />
                How it works
              </button>
            </div>

            <div className="flex items-center gap-5 pt-5">
              <div className="flex -space-x-3">
                {doctorAvatars.map((avatar, index) => (
                  <Image
                    key={avatar}
                    src={avatar}
                    alt={`Doctor avatar ${index + 1}`}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full border-4 border-[#f7faf8] object-cover"
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-[#3e4946]">
                <span className="font-bold text-[#046b5e]">500+</span> Specialized Doctors
              </p>
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="pointer-events-none absolute -left-8 -top-8 h-36 w-36 rounded-full bg-[#c6e6de] blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-[#00201b]/12">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVCjvftjBEhgj6xbpLr6F2wwghQy5UGS7M1P7pdxTjiNf0KHdRoubEywtXqfgQVrJdnOUajyaWUbTD-JOnCox2YEURjE_4nEpWrMGnLo18BMxq4tRvrfXkyjHfVsj67_YRIRMPJWad03ywqIn9XA-u1ihKqRBgOKrXZYQUqn4UPWnDO0Q2ygEXRC-6dadKluEMighhi8C2rqh_0tOGlj-Ht70U5cR2csvK52UYBcd6JktEuctotCts2jyG_5hUni4XuV3Xn6q4-IF8"
                alt="Modern clinic interior"
                width={780}
                height={960}
                priority
                className="h-[440px] w-full object-cover md:h-[520px]"
              />
              <div className="absolute inset-x-5 bottom-5 rounded-xl bg-[#f7faf8]/90 p-5 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-[#046b5e]">NEXT AVAILABLE</p>
                    <p className="text-lg font-bold">Cardiology Department</p>
                  </div>
                  <div className="rounded-lg bg-[#004f45] p-2 text-white">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f1f4f2] py-20">
          <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="mb-3 text-4xl font-bold tracking-tight">Our Specialized Departments</h2>
              <p className="max-w-2xl text-[#3e4946]">
                Choose from a wide range of medical specialties, each staffed with
                world-class experts dedicated to your well-being.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {departments.map((department) => (
                <Link
                  key={department.title}
                  href={`/find-doctor?specialty=${encodeURIComponent(department.title)}`}
                  className="group rounded-2xl border border-[#dbe3e0] bg-white p-6 transition hover:-translate-y-1 hover:border-[#bfd4ce] hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e5efeb] text-[#004f45]">
                    {department.icon === "heart" && <Heart className="h-5 w-5" aria-hidden="true" />}
                    {department.icon === "brain" && <Brain className="h-5 w-5" aria-hidden="true" />}
                    {department.icon === "sparkles" && <Sparkles className="h-5 w-5" aria-hidden="true" />}
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">{department.title}</h3>
                  <p className="text-sm text-[#3e4946]">{department.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#004f45]">
                    Explore Department
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-6 py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-[#00695c] p-10 text-[#94e5d5] lg:p-14">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 opacity-15 md:block">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiG-eCh7m4o8fdE6lKnK50ChdwiqmTGpEIhv3GMtReKyy8leEBg9REVBwVNtlmOPI7nugfT1SrTXGrFhLtXmSSLXAHt2MfUS46bpQg7ccujp_YopkMBqNMHivdQpc8qRO-90MKle3-X8mZoGYjWXYSb64h5b-7oraok9hMl7fGMQszEQVNwvJeLZlfHXJYGxU2GmGDZLY9IY30lLmV9OeXnRhutSozm103mZ_alFabHYoz0uMRygiUf1kRIh_B2Jsv5nTxTmd5hYVQ"
                alt="Hospital corridor"
                fill
                sizes="(min-width: 1024px) 33vw, 0px"
                className="object-cover"
              />
            </div>
            <div className="relative grid grid-cols-1 gap-10 text-center md:grid-cols-3 md:text-left">
              <div>
                <p className="mb-1 text-5xl font-extrabold">98%</p>
                <p className="text-lg text-[#c6e6de]">Patient Satisfaction Rate</p>
              </div>
              <div>
                <p className="mb-1 text-5xl font-extrabold">15k+</p>
                <p className="text-lg text-[#c6e6de]">Monthly Appointments</p>
              </div>
              <div>
                <p className="mb-1 text-5xl font-extrabold">24/7</p>
                <p className="text-lg text-[#c6e6de]">Emergency Assistance</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-2xl shadow-lg shadow-[#0f312c]/10">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtSBdBny-0gc-qlThGKOB4B2rgD9l9BdTsQ8gkBlLE7yeYDsyVPI9svh3SQHys8T2SMMc_HRkohSVnqV2KlqkP7zLKQrkWih_E9vae_RcB5YyjPqH0kHkHZ4fFsJvCI01d2b6JAW18ZCeWcMwtZoKgJ9OSXjFSs9qpOQc6ID_SoMJaK2tdA2CTp9ghjRA8ob9qEdzt1E6Qi7P257pgloVkmSEVmvFqHKtHVan9Zl0MoA5Bj-tFFWW7k3cXGTe-TTAKRyPpf7unxv0P"
              alt="Doctor with tablet"
              width={1100}
              height={700}
              className="h-auto w-full object-cover"
            />
          </div>

          <div className="space-y-7">
            <h2 className="text-4xl font-bold leading-tight md:text-5xl">
              Your Health, Simplified.
              <br />
              Start Your Journey Today.
            </h2>

            <div className="space-y-5">
              {["Search Specialists", "Choose Your Slot", "Instant Confirmation"].map(
                (step, index) => (
                  <div key={step} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c6e6de] text-xs font-bold text-[#2f4c46]">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold">{step}</h4>
                      <p className="text-[#3e4946]">
                        {index === 0 && "Filter by specialty, location, or availability."}
                        {index === 1 && "Select a time that perfectly fits your schedule."}
                        {index === 2 && "Receive your digital booking pass immediately."}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>

            <Link
              href="/find-doctor"
              className="inline-flex rounded-xl bg-[#004f45] px-8 py-4 text-lg font-bold text-white transition hover:bg-[#00695c]"
            >
              Book Your First Consultation
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-8 w-full bg-[#eaf1ee]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-6 px-6 py-10 text-sm md:flex-row md:px-8">
          <div className="space-y-3 text-center md:text-left">
            <p className="text-2xl font-bold text-[#10332d]">Clinic Atelier</p>
            <p className="max-w-sm text-[#4b6862]">
              Crafting serene healthcare experiences through digital precision and
              human care.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[#4b6862]">
            <a href="#" className="hover:text-[#046b5e]">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-[#046b5e]">
              Terms of Service
            </a>
            <a href="#" className="hover:text-[#046b5e]">
              Legal Notice
            </a>
          </div>
          <p className="text-[#35514b]">© 2024 Clinic Atelier. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
