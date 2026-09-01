import { NextResponse } from "next/server";
import { resetStore } from "@/lib/controlPlane";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { action?: string };
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (body.action === "reset") {
      await resetStore();
      return NextResponse.json({ ok: true, action: "reset" });
    }

    return NextResponse.json(
      { error: "action must be: reset" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "demo_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
