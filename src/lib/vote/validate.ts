import type { Mark } from "@/lib/vote/resolve";

/**
 * The validation boundary for the vote route.
 *
 * Split out of `room.ts` because that module is `server-only` — importing it
 * from a test (or a client component) is a build error, which is exactly the
 * guard the service key needs and exactly the wrong place for pure functions.
 *
 * This route is unauthenticated and is the only mutation surface in the
 * project, so what it refuses matters more than what it accepts.
 */

const MARKS: readonly Mark[] = ["yes", "maybe", "no"];

/**
 * 16–128 characters of url-safe text. The room id IS the authorisation: 128
 * bits of entropy makes it unguessable, and there is no listing endpoint, so a
 * room cannot be found by anything except being told.
 */
export const ROOM_ID = /^[A-Za-z0-9_-]{16,128}$/;

export function isValidRoomId(id: string): boolean {
  return ROOM_ID.test(id);
}

/** Narrows unknown JSON to marks. The route is the only writer. */
export function parseMarks(input: unknown): Record<string, Mark> | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;

  const out: Record<string, Mark> = {};
  for (const [spotId, mark] of Object.entries(input)) {
    if (typeof spotId !== "string" || spotId.length === 0 || spotId.length > 64) return null;
    if (typeof mark !== "string" || !MARKS.includes(mark as Mark)) return null;
    out[spotId] = mark as Mark;
  }
  // An empty object is a real state — "I looked and marked nothing" — but 200
  // candidates is not, and this endpoint has no auth in front of it.
  return Object.keys(out).length > 64 ? null : out;
}

/** A url-safe 128-bit room id. */
export function newRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
