import { NextResponse } from "next/server";
import { AgentDispatchClient } from "livekit-server-sdk";
import { getKioskSession } from "@/lib/controlPlane";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kioskId: string }> };

const LIVEKIT_URL = process.env.LIVEKIT_URL ?? "";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY ?? "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET ?? "";

/**
 * POST /api/kiosks/[kioskId]/dispatch-agent
 * Body (optional): { agentName?: string; roomName?: string }
 *
 * Dispatches a LiveKit agent to the kiosk room.
 * - roomName defaults to "room-{kioskId}" (convention used by huella-digital).
 * - agentName defaults to "huella-guide" (the kiosk voice guide agent).
 *
 * The room must already exist (huella-digital creates it when the kiosk boots).
 * If the room does not exist, LiveKit will queue the dispatch and connect the
 * agent when the room is created.
 */
export async function POST(request: Request, ctx: Ctx) {
  const { kioskId } = await ctx.params;

  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return NextResponse.json(
      {
        error:
          "LiveKit not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.",
      },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      agentName?: string;
      roomName?: string;
    };

    const session = await getKioskSession(kioskId);
    const agentName = body.agentName ?? "huella-guide";
    const roomName = body.roomName ?? `room-${kioskId}`;

    const client = new AgentDispatchClient(
      LIVEKIT_URL,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    );

    const dispatch = await client.createDispatch(roomName, agentName, {
      metadata: session
        ? JSON.stringify({
            kioskId,
            userId: session.userId,
            nombre: session.nombre,
          })
        : JSON.stringify({ kioskId }),
    });

    return NextResponse.json({
      ok: true,
      dispatch: {
        id: dispatch.id,
        agentName: dispatch.agentName,
        room: dispatch.room,
        metadata: dispatch.metadata,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "dispatch_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
