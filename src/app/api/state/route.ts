import { NextResponse } from "next/server";
import { getModeratorState, isSupabaseConfigured } from "@/lib/controlPlane";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getModeratorState();
    return NextResponse.json({
      ...state,
      backend: isSupabaseConfigured() ? "supabase" : "memory",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "state_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
