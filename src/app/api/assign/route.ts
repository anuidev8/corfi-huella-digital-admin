import { NextResponse } from "next/server";
import { assignToKiosk } from "@/lib/controlPlane";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { queueId?: string; kioskId?: string };
  try {
    body = (await request.json()) as { queueId?: string; kioskId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.queueId || !body.kioskId) {
    return NextResponse.json(
      { error: "queueId and kioskId are required" },
      { status: 400 }
    );
  }

  try {
    const result = await assignToKiosk({
      queueId: body.queueId,
      kioskId: body.kioskId,
    });
    return NextResponse.json({
      ok: true,
      ...result,
      deliveryChannel: "supabase_or_memory",
      message: `Package for ${result.entry.nombre} delivered to ${result.kiosk.label}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assign failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
