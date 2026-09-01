/**
 * Thin client for the Huella Digital Attendees API (AWS API Gateway).
 *
 * Endpoints used by the webhook handler:
 *   GET  /attendees/wristband/{uid}   → resolve wristband UID → attendee_id
 *   GET  /attendees/{attendee_id}     → confirm attendee_id exists
 *
 * PRIVACY: only the attendee_id is extracted from responses.
 * No personal data (name, company, email, sector) is stored or forwarded.
 *
 * Base URL  → ATTENDEES_API_URL  env var
 * Auth key  → ATTENDEES_API_KEY  env var  (header: x-api-key)
 */

/** Only the identifier is used — all other fields from the API are discarded. */
export type AttendeeApiRef = {
  attendee_id: string;
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
 * Resolve a wristband NFC UID to an attendee_id.
 * Returns null when not found (404) or API is not configured.
 * Only the attendee_id field is extracted — all other response data is dropped.
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
 * Confirm that an attendee_id exists in the attendees pipeline.
 * Returns null when not found (404) or API is not configured.
 * Only the attendee_id field is extracted — all other response data is dropped.
 */
export async function getAttendeeById(
  attendeeId: string
): Promise<AttendeeApiRef | null> {
  if (!isAttendeesApiConfigured()) return null;
  try {
    const res = await fetch(
      `${baseUrl()}/attendees/${encodeURIComponent(attendeeId)}`,
      { headers: headers(), cache: "no-store" }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`attendees_api_id_${res.status}`);
    const data = (await res.json()) as { attendee_id?: string };
    if (!data.attendee_id) return null;
    return { attendee_id: data.attendee_id };
  } catch (err) {
    console.error("[attendees-api] id lookup failed:", err);
    return null;
  }
}
