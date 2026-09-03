/**
 * Normalizes the "gender" field returned by the external Attendees API.
 * Source values are Spanish ("hombre" / "mujer"), but casing, accents, and
 * a couple of common form-entry aliases (M/F, masculino/femenino) aren't
 * guaranteed — normalize before it ever reaches attendee_packages.
 */
export type Gender = "hombre" | "mujer";

const MALE_VALUES = new Set(["hombre", "masculino", "m"]);
const FEMALE_VALUES = new Set(["mujer", "femenino", "f"]);

function normalizeToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Maps a raw gender string to "hombre" | "mujer", or null when missing/unrecognized. */
export function normalizeGender(raw: string | null | undefined): Gender | null {
  if (!raw) return null;
  const token = normalizeToken(raw);
  if (!token) return null;
  if (FEMALE_VALUES.has(token)) return "mujer";
  if (MALE_VALUES.has(token)) return "hombre";
  return null;
}
