#!/usr/bin/env node
/**
 * Backfills public.attendee_directory (a read-only search cache for the
 * kiosk's manual-search screen) from the external Attendees API.
 *
 * Why: attendee_packages only gets a row per attendee reactively, when their
 * wristband gets tapped at the totem — so it's a tiny fraction of the real
 * roster at any given time, and manual search (which queries it) can't find
 * anyone who hasn't tapped in yet. The Attendees API has no bulk-list
 * endpoint (`GET /attendees` → 404, confirmed), only GET /attendees/{id}, so
 * this enumerates ids and upserts every hit into attendee_directory.
 *
 * IDs are not guaranteed to be a clean contiguous 1..N block (id 1001 exists
 * as what looks like an internal test record alongside the main 1..N range),
 * so this tolerates a run of consecutive misses instead of stopping at the
 * very first 404 — but if you know the real registered count/range from
 * event ops, prefer passing --start/--end explicitly over guessing.
 *
 * Requires public.attendee_directory to already exist — see
 * supabase/migrations/20260902_attendee_directory.sql (apply it via the
 * Supabase SQL editor first; this script does not run migrations).
 *
 * Usage:
 *   node scripts/sync-attendee-directory.mjs [--start 1] [--end 300] [--max-misses 25] [--concurrency 5]
 *
 * Env (read from process.env, falling back to .env.local in this directory):
 *   ATTENDEES_API_URL, ATTENDEES_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = { start: 1, end: 300, maxMisses: 25, concurrency: 5 };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const val = argv[i + 1];
    if (flag === "--start") args.start = Number(val);
    if (flag === "--end") args.end = Number(val);
    if (flag === "--max-misses") args.maxMisses = Number(val);
    if (flag === "--concurrency") args.concurrency = Number(val);
  }
  return args;
}

async function fetchAttendee(baseUrl, apiKey, id) {
  const res = await fetch(`${baseUrl}/attendees/${encodeURIComponent(id)}`, {
    headers: { "x-api-key": apiKey },
  });
  if (res.status === 404) return null;
  if (res.status === 429) {
    // Rate-limited — back off and retry once.
    await new Promise((r) => setTimeout(r, 1500));
    return fetchAttendee(baseUrl, apiKey, id);
  }
  if (!res.ok) {
    throw new Error(`GET /attendees/${id} → HTTP ${res.status}`);
  }
  return res.json();
}

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || fullName, lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

async function main() {
  loadDotEnvLocal();
  const { start, end, maxMisses, concurrency } = parseArgs(process.argv.slice(2));

  const baseUrl = (
    process.env.ATTENDEES_API_URL ||
    "https://kxg0obna8f.execute-api.us-east-2.amazonaws.com/dev"
  ).replace(/\/$/, "");
  const apiKey = process.env.ATTENDEES_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey) throw new Error("ATTENDEES_API_KEY is not set");
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set"
    );
  }

  const sb = createClient(supabaseUrl, serviceKey);

  // Fail fast with a clear message if the table hasn't been created yet.
  const probe = await sb.from("attendee_directory").select("attendee_id").limit(1);
  if (probe.error) {
    console.error(
      "\n✗ Could not query public.attendee_directory:",
      probe.error.message
    );
    console.error(
      "  Run supabase/migrations/20260902_attendee_directory.sql in the Supabase SQL editor first.\n"
    );
    process.exit(1);
  }

  console.log(
    `Scanning attendee ids ${start}..${end} (stop after ${maxMisses} consecutive misses, concurrency ${concurrency})…`
  );

  const found = [];
  let consecutiveMisses = 0;
  let scanned = 0;

  for (let batchStart = start; batchStart <= end; batchStart += concurrency) {
    const ids = [];
    for (let id = batchStart; id < batchStart + concurrency && id <= end; id += 1) {
      ids.push(id);
    }

    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const data = await fetchAttendee(baseUrl, apiKey, String(id));
          return { id, data };
        } catch (err) {
          console.warn(`  ⚠ id=${id} fetch failed: ${err.message}`);
          return { id, data: null, errored: true };
        }
      })
    );

    for (const { id, data, errored } of results) {
      scanned += 1;
      if (data && data.attendee_id) {
        found.push(data);
        consecutiveMisses = 0;
        process.stdout.write(`  ✓ id=${id} ${data.full_name || "(no name)"}\n`);
      } else if (!errored) {
        consecutiveMisses += 1;
      }
    }

    if (found.length > 0 && consecutiveMisses >= maxMisses) {
      console.log(
        `\nStopping after ${consecutiveMisses} consecutive misses (scanned up to id=${batchStart + concurrency - 1}).`
      );
      break;
    }
  }

  console.log(`\nScanned ${scanned} ids, found ${found.length} real attendees.`);

  if (found.length === 0) {
    console.log("Nothing to upsert.");
    return;
  }

  const rows = found.map((a) => {
    const { firstName, lastName } = splitName(a.full_name || "");
    return {
      attendee_id: a.attendee_id,
      full_name: a.full_name || "",
      first_name: firstName,
      last_name: lastName,
      company: a.company || "",
      sector: a.sector || "",
      email: a.email || "",
      synced_at: new Date().toISOString(),
    };
  });

  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await sb
      .from("attendee_directory")
      .upsert(chunk, { onConflict: "attendee_id" });
    if (error) throw new Error(`Upsert failed: ${error.message}`);
  }

  console.log(`✓ Upserted ${rows.length} rows into attendee_directory.`);
}

main().catch((err) => {
  console.error("\n✗ Sync failed:", err.message);
  process.exit(1);
});
