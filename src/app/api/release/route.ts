import { NextResponse } from "next/server";
import { releaseKiosk } from "@/lib/controlPlane";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { kioskId?: string; userId?: string | null; completed?: boolean };
  try {
    body = (await request.json()) as {
      kioskId?: string;
      userId?: string | null;
      completed?: boolean;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.kioskId) {
    return NextResponse.json({ error: "kioskId is required" }, { status: 400 });
  }

  // Defaults to false — a bare release (moderator "Liberar", no completed
  // flag) means the session was interrupted, not finished. Only the kiosk's
  // own finish signal sends completed: true.
  try {
    const kiosk = await releaseKiosk(body.kioskId, body.userId, body.completed === true);
    return NextResponse.json({ ok: true, kiosk });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Release failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
