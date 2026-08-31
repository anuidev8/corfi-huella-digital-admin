import { NextResponse } from "next/server";
import { getKioskSession } from "@/lib/controlPlane";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kioskId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { kioskId } = await ctx.params;
  try {
    const session = await getKioskSession(kioskId);
    if (!session) {
      return NextResponse.json({
        ok: true,
        assigned: false,
        kioskId,
        session: null,
      });
    }
    return NextResponse.json({
      ok: true,
      assigned: true,
      kioskId,
      session,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "session_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
