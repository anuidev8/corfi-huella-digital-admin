import { NextResponse } from "next/server";
import {
  resetStore,
  seedDemoCheckIns,
  syncAttendeePackages,
} from "@/lib/controlPlane";

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

    if (body.action === "seed") {
      const entries = await seedDemoCheckIns();
      return NextResponse.json({
        ok: true,
        action: "seed",
        count: entries.length,
      });
    }

    if (body.action === "sync-packages") {
      const result = await syncAttendeePackages();
      return NextResponse.json({
        ok: true,
        action: "sync-packages",
        ...result,
      });
    }

    /** Upsert roster packages, prune stale IDs, then seed check-ins. */
    if (body.action === "sync-all") {
      const packages = await syncAttendeePackages();
      const entries = await seedDemoCheckIns();
      return NextResponse.json({
        ok: true,
        action: "sync-all",
        packages,
        checkIns: entries.length,
      });
    }

    return NextResponse.json(
      { error: "action must be seed, reset, sync-packages, or sync-all" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "demo_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
