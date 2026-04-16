import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const user = getAdminFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
