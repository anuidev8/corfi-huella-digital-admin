import { NextResponse } from "next/server";
import { heartbeatKiosk } from "@/lib/controlPlane";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { kioskId?: string; screen?: string | null; userId?: string | null };
  try {
    body = (await request.json()) as {
      kioskId?: string;
      screen?: string | null;
      userId?: string | null;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.kioskId) {
    return NextResponse.json({ error: "kioskId is required" }, { status: 400 });
  }

  try {
    const kiosk = await heartbeatKiosk({
      kioskId: body.kioskId,
      screen: body.screen,
      userId: body.userId,
    });
    return NextResponse.json({ ok: true, kiosk });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Heartbeat failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
