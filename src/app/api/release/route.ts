import { NextResponse } from "next/server";
import { releaseKiosk } from "@/lib/controlPlane";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { kioskId?: string; userId?: string | null };
  try {
    body = (await request.json()) as { kioskId?: string; userId?: string | null };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.kioskId) {
    return NextResponse.json({ error: "kioskId is required" }, { status: 400 });
  }

  try {
    const kiosk = await releaseKiosk(body.kioskId, body.userId);
    return NextResponse.json({ ok: true, kiosk });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Release failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
