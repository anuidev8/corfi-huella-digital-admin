/**
 * Load attendee packages from `data/roster/*.json`.
 * Used to sync moderator Supabase `attendee_packages`.
 */

import fs from "node:fs";
import path from "node:path";
import type { CorfilinkCheckIn, KioskPackage } from "@/lib/types";

type FootprintEnvelope = {
  codigo_externo: string;
  payload: {
    attendee: {
      id: string;
      firstName: string;
      lastName?: string;
      role?: string;
      company?: string;
      sector?: string;
      email?: string;
    };
    overallScore?: number;
    headline?: string;
    [key: string]: unknown;
  };
};

export type AttendeePackageRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  company: string;
  sector: string;
  email: string;
  overall_score: number;
  headline: string;
  package_status: "ready" | "missing";
  payload: Record<string, unknown>;
};

function rosterDir(): string {
  return path.join(process.cwd(), "data/roster");
}

function rosterPath(): string {
  return path.join(process.cwd(), "data/roster.json");
}

function parseEnvelopeFile(filePath: string): FootprintEnvelope[] {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as
    | FootprintEnvelope
    | FootprintEnvelope[];
  return Array.isArray(raw) ? raw : [raw];
}

function loadEnvelopes(): FootprintEnvelope[] {
  const dir = rosterDir();
  if (fs.existsSync(dir)) {
    const files = fs
      .readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .sort();
    if (files.length > 0) {
      return files.flatMap((name) =>
        parseEnvelopeFile(path.join(dir, name))
      );
    }
  }

  const file = rosterPath();
  if (!fs.existsSync(file)) {
    throw new Error(
      `No roster data — add data/roster/*.json or data/roster.json under huella-moderator/`
    );
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as FootprintEnvelope[];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("roster.json is empty or invalid");
  }
  return raw;
}

function envelopeToRow(env: FootprintEnvelope): AttendeePackageRow {
  const p = env.payload;
  const a = p.attendee;
  return {
    user_id: a.id,
    first_name: a.firstName,
    last_name: a.lastName ?? "",
    role: a.role?.trim() || "—",
    company: a.company?.trim() || "—",
    sector: a.sector?.trim() || "—",
    email: a.email?.trim() || "",
    overall_score: p.overallScore ?? 0,
    headline: p.headline?.trim() || "",
    package_status: "ready",
    payload: p as Record<string, unknown>,
  };
}

/** All packages from roster JSON files. */
export function loadAttendeePackageRows(): AttendeePackageRow[] {
  const envelopes = loadEnvelopes();
  return envelopes
    .map((env) => envelopeToRow(env))
    .sort((a, b) => a.user_id.localeCompare(b.user_id));
}

function displayNombre(row: AttendeePackageRow): string {
  return [row.first_name, row.last_name].filter(Boolean).join(" ");
}

/** Demo Corfilink check-ins for every synced roster attendee. */
export function loadDemoCheckInSamples(): CorfilinkCheckIn[] {
  return loadAttendeePackageRows().map((row) => ({
    userId: row.user_id,
    nombre: displayNombre(row),
    cargo: row.role,
    company: row.company,
    email: row.email || undefined,
  }));
}

export function loadKioskPackages(): Record<string, KioskPackage> {
  const rows = loadAttendeePackageRows();
  return Object.fromEntries(
    rows.map((row) => [
      row.user_id,
      {
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        company: row.company,
        sector: row.sector,
        email: row.email,
        overallScore: row.overall_score,
        headline: row.headline,
        packageStatus: row.package_status,
      } satisfies KioskPackage,
    ])
  );
}
