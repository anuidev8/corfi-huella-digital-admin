/**
 * Thin client for the Huella Digital Attendees API (AWS API Gateway).
 *
 * Endpoints used by the webhook handler:
 *   GET  /attendees/wristband/{uid}   → resolve wristband UID → attendee_id
 *   GET  /attendees/{attendee_id}     → fetch full attendee record + analysis payload
 *
 * Base URL  → ATTENDEES_API_URL  env var
 * Auth key  → ATTENDEES_API_KEY  env var  (header: x-api-key)
 */

import { normalizeGender, type Gender } from "@/lib/gender";

/** Minimal reference returned by the wristband lookup endpoint. */
export type AttendeeApiRef = {
  attendee_id: string;
};

/** Media/file fields stripped from payload before storage — not needed by the kiosk. */
const MEDIA_FIELDS = ["pdf_key", "photo_key", "photo_url", "banner_url", "bundle_key"] as const;

/**
 * Full attendee record with analysis payload (media fields stripped).
 * Maps to attendee_packages in Supabase.
 */
export type AttendeeApiFull = {
  attendee_id: string;
  full_name: string;
  company: string;
  email: string;
  sector: string;
  /** Normalized "hombre" | "mujer", or null when missing/unrecognized upstream. */
  gender: Gender | null;
  /** Analysis payload with media fields removed. null if API returned no payload. */
  payload: Record<string, unknown> | null;
  /** External API's own completion status — the source of truth to mirror locally. */
  status: "pending" | "completed" | null;
};

function baseUrl(): string {
  return (
    process.env.ATTENDEES_API_URL?.replace(/\/$/, "") ??
    "https://kxg0obna8f.execute-api.us-east-2.amazonaws.com/dev"
  );
}

function apiKey(): string {
  return process.env.ATTENDEES_API_KEY ?? "";
}

function headers(): HeadersInit {
  return {
    "x-api-key": apiKey(),
    "Content-Type": "application/json",
  };
}

export function isAttendeesApiConfigured(): boolean {
  return Boolean(process.env.ATTENDEES_API_URL && process.env.ATTENDEES_API_KEY);
}

/**
 * Update the status of an attendee in the external Attendees API.
 * status accepts only 'pending' or 'completed'.
 * Returns true on success, false if the attendee was not found or API is not configured.
 * Never throws — failures are logged and swallowed so they don't block the moderator flow.
 */
export async function updateAttendeeStatus(
  attendeeId: string,
  status: "pending" | "completed"
): Promise<boolean> {
  if (!isAttendeesApiConfigured()) return false;
  try {
    const res = await fetch(
      `${baseUrl()}/attendees/update/${encodeURIComponent(attendeeId)}`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ status }),
        cache: "no-store",
      }
    );
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`attendees_api_update_${res.status}`);
    return true;
  } catch (err) {
    console.error("[attendees-api] updateAttendeeStatus failed:", err);
    return false;
  }
}

/**
 * Resolve a wristband NFC UID to an attendee_id.
 * Returns null when not found (404) or API is not configured.
 * Only the attendee_id is extracted here — call getAttendeeById for full data.
 */
export async function getAttendeeByWristband(
  wristbandUid: string
): Promise<AttendeeApiRef | null> {
  if (!isAttendeesApiConfigured()) return null;
  try {
    const res = await fetch(
      `${baseUrl()}/attendees/wristband/${encodeURIComponent(wristbandUid)}`,
      { headers: headers(), cache: "no-store" }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`attendees_api_wristband_${res.status}`);
    const data = (await res.json()) as { attendee_id?: string };
    if (!data.attendee_id) return null;
    return { attendee_id: data.attendee_id };
  } catch (err) {
    console.error("[attendees-api] wristband lookup failed:", err);
    return null;
  }
}

/**
 * Fetch the full attendee record including analysis payload.
 * Returns null when not found (404) or API is not configured.
 * Media fields (photo_url, photo_key, pdf_key, etc.) are stripped — not needed by the kiosk.
 */
export async function getAttendeeById(
  attendeeId: string
): Promise<AttendeeApiFull | null> {
  if (!isAttendeesApiConfigured()) return null;
  try {
    const res = await fetch(
      `${baseUrl()}/attendees/${encodeURIComponent(attendeeId)}`,
      { headers: headers(), cache: "no-store" }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`attendees_api_id_${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    if (!data.attendee_id) return null;

    const rawPayload = data.payload as Record<string, unknown> | null | undefined;
    let cleanPayload: Record<string, unknown> | null = null;
    if (rawPayload && typeof rawPayload === "object") {
      cleanPayload = { ...rawPayload };
      for (const field of MEDIA_FIELDS) {
        delete cleanPayload[field];
      }
    }

    const rawStatus = data.status as string | undefined;
    const status =
      rawStatus === "pending" || rawStatus === "completed" ? rawStatus : null;

    return {
      attendee_id: data.attendee_id as string,
      full_name: (data.full_name as string) || "",
      company: (data.company as string) || "",
      email: (data.email as string) || "",
      sector: (data.sector as string) || "",
      gender: normalizeGender(data.gender as string | undefined),
      payload: cleanPayload,
      status,
    };
  } catch (err) {
    console.error("[attendees-api] id lookup failed:", err);
    return null;
  }
}
