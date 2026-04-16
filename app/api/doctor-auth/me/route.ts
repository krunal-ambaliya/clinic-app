import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDoctorFromRequest } from "@/lib/doctor-auth";

export async function GET(request: NextRequest) {
  const user = await getDoctorFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
