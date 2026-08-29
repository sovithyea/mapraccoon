import { NextResponse } from "next/server";

import {
  appendVote,
  isConfigured,
  isValidRoomId,
  parseMarks,
  readVotes,
} from "@/lib/vote/room";

/**
 * The vote room. Two operations, and deliberately nothing else (D30, D35).
 *
 *   POST  { voter, marks }  → append, then broadcast
 *   GET                     → { votes }
 *
 * No accounts and no listing endpoint. **Possession of the room id is the
 * authorisation** — 128 bits, unguessable, the same model the shared-day links
 * already use. `docs/SECURITY.md` states the consequence rather than leaving it
 * to be discovered: a link forwarded outside the group is a vote from outside
 * the group, and that is the right trade at five-friends scale and the wrong
 * one the moment anything is at stake beyond dinner.
 */

export const dynamic = "force-dynamic";

/**
 * A crude per-instance limiter. It is the only mutation surface and has no auth
 * in front of it, so *something* is required (SECURITY.md).
 *
 * **It does not survive a cold start and does not span instances.** That is a
 * real limitation, stated rather than papered over: it stops a stuck client
 * hammering the endpoint, not a determined attacker. A durable limiter belongs
 * with Phase 4's accounts, where there is an identity to limit.
 */
const RATE_LIMIT = 30;
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(roomId: string): boolean {
  const now = Date.now();
  const entry = hits.get(roomId);

  if (!entry || now > entry.resetAt) {
    hits.set(roomId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  // Same 404 for malformed and unknown, so the endpoint cannot be used to
  // probe which room ids exist.
  if (!isValidRoomId(id)) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isConfigured()) {
    return NextResponse.json({ error: "vote store not configured" }, { status: 503 });
  }

  const votes = await readVotes(id);
  if (votes === null) {
    // Not 404: the room id was fine, the store was not. An empty array here
    // would read as "nobody has voted yet" and a group would wait on it.
    return NextResponse.json({ error: "could not read votes" }, { status: 502 });
  }

  return NextResponse.json(
    { votes },
    // Never cache: a CDN holding a tally is worse than no live updates.
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  if (!isValidRoomId(id)) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isConfigured()) {
    return NextResponse.json({ error: "vote store not configured" }, { status: 503 });
  }
  if (rateLimited(id)) {
    return NextResponse.json({ error: "too many votes" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { voter, marks } = (body ?? {}) as { voter?: unknown; marks?: unknown };

  if (typeof voter !== "string" || voter.trim().length === 0 || voter.length > 40) {
    return NextResponse.json({ error: "voter must be a short name" }, { status: 400 });
  }

  const parsed = parseMarks(marks);
  if (!parsed) return NextResponse.json({ error: "invalid marks" }, { status: 400 });

  const ok = await appendVote(id, voter.trim(), parsed);
  if (!ok) return NextResponse.json({ error: "could not record vote" }, { status: 502 });

  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
