import { NextResponse } from "next/server";
import { setKioskAgent } from "@/lib/controlPlane";
import { KNOWN_AGENTS } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kioskId: string }> };

/**
 * PATCH /api/kiosks/[kioskId]/agent
 * Body: { agentId: string | null }
 *
 * Assigns (or clears) the LiveKit agent name for a kiosk.
 * The agentId must match the LIVEKIT_AGENT_NAME of a running agent process.
 */
export async function PATCH(request: Request, ctx: Ctx) {
  const { kioskId } = await ctx.params;
  try {
    const body = (await request.json()) as { agentId?: string | null };
    const agentId = body.agentId ?? null;

    if (agentId !== null) {
      const known = KNOWN_AGENTS.map((a) => a.id);
      if (!known.includes(agentId)) {
        return NextResponse.json(
          { error: `Unknown agent "${agentId}". Known: ${known.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const kiosk = await setKioskAgent(kioskId, agentId);
    return NextResponse.json({ ok: true, kiosk });
  } catch (err) {
    const message = err instanceof Error ? err.message : "agent_set_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
