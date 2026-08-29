import type { Instant } from "@/lib/hours/open";
import { getSpotById } from "@/lib/spots";
import { isValidRoomId, newRoomId } from "@/lib/vote/validate";
import type { Spot } from "@/lib/spots/schema";

/**
 * A ballot: some candidates, and the moment they are being judged for.
 *
 * It travels in the URL, following the same pattern as a shared day
 * (`lib/route/share.ts`). That is not just convenience — it means the candidate
 * list is never a database row, so the vote store holds only votes and can be
 * wiped without losing anything an organiser cannot regenerate by re-sending
 * their link (D30, D35).
 *
 * Only ids are encoded. The venue content stays in the seed file (D3), so a
 * ballot opened tomorrow picks up corrected hours rather than a frozen copy of
 * yesterday's.
 */

export type Slot = {
  /** `YYYY-MM-DD` in Phnom Penh. */
  isoDate: string;
  /** Minutes from midnight — when the group is deciding *for*. */
  startMins: number;
  /** 0 = Monday. Carried so `isOpenAt` needs no date arithmetic. */
  day: number;
};

export type Ballot = {
  v: 1;
  slot: Slot;
  candidateIds: string[];
  /**
   * The room this ballot's votes are stored under, and the only secret in the
   * system.
   *
   * It carries its own 128 bits rather than being derived from the ballot,
   * which was the first design and was wrong: a ballot payload is a date plus a
   * few ids from a public dataset, so a hash of it is *guessable*. Anyone could
   * compute the room for a plausible Friday-night ballot and read or stuff it.
   *
   * Generated once when the ballot is made, and travels in the link with
   * everything else.
   */
  roomId: string;
  /** Who set it up. Optional, and only ever a display name. */
  by?: string;
};

export type ResolvedBallot = { slot: Slot; candidates: Spot[]; roomId: string; by?: string };

export const slotInstant = (slot: Slot): Instant => ({
  day: slot.day,
  mins: slot.startMins,
});

const base64urlEncode = (input: string): string =>
  btoa(unescape(encodeURIComponent(input)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const base64urlDecode = (input: string): string =>
  decodeURIComponent(escape(atob(input.replace(/-/g, "+").replace(/_/g, "/"))));

/** `friday-8pm-5-places.<payload>` — prefix for humans, payload for the app. */
export function encodeBallot(ballot: Ballot): string {
  const payload = base64urlEncode(
    JSON.stringify({
      v: 1,
      s: [ballot.slot.isoDate, ballot.slot.startMins, ballot.slot.day],
      c: ballot.candidateIds,
      r: ballot.roomId,
      ...(ballot.by ? { b: ballot.by } : {}),
    }),
  );

  const hour = Math.floor(ballot.slot.startMins / 60);
  const count = ballot.candidateIds.length;
  return `${ballot.slot.isoDate}-${hour}h-${count}-places.${payload}`;
}

/**
 * Returns null rather than throwing on anything malformed. A ballot link is
 * input from outside the app — a truncated paste, an old version, a candidate
 * since removed from the seed file — and all of those must read as "this link
 * doesn't work", never as a crash.
 */
export function decodeBallot(id: string): Ballot | null {
  const payload = id.slice(id.lastIndexOf(".") + 1);
  if (payload.length === 0) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64urlDecode(payload));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const { v, s, c, r, b } = parsed as Record<string, unknown>;
  if (v !== 1 || !Array.isArray(s) || s.length !== 3 || !Array.isArray(c)) return null;
  if (typeof r !== "string" || !isValidRoomId(r)) return null;

  const [isoDate, startMins, day] = s as [unknown, unknown, unknown];
  if (
    typeof isoDate !== "string" ||
    typeof startMins !== "number" ||
    typeof day !== "number" ||
    day < 0 ||
    day > 6
  ) {
    return null;
  }

  const candidateIds = c.filter((id): id is string => typeof id === "string");
  if (candidateIds.length === 0) return null;

  return {
    v: 1,
    slot: { isoDate, startMins, day },
    candidateIds,
    roomId: r,
    ...(typeof b === "string" ? { by: b } : {}),
  };
}

/**
 * Ids to spots, dropping anything the seed file no longer has.
 *
 * **R9/D33: a memorial site can never be a candidate.** The filter is here, at
 * the single point where a ballot becomes something a group votes on, rather
 * than in each surface that renders one — a rule enforced in one place cannot
 * be forgotten in the next component someone writes. C19 is the record of what
 * happens when it lives in prose instead.
 */
export function resolveBallot(ballot: Ballot): ResolvedBallot {
  const candidates = ballot.candidateIds
    .map((id) => getSpotById(id))
    .filter((s): s is Spot => s !== undefined && s.sensitive === undefined);

  return {
    slot: ballot.slot,
    candidates,
    roomId: ballot.roomId,
    ...(ballot.by ? { by: ballot.by } : {}),
  };
}

/** A ballot for a set of spots at a moment. Generates the room id. */
export function createBallot(
  candidates: readonly Spot[],
  slot: Slot,
  by?: string,
): Ballot {
  return {
    v: 1,
    slot,
    // Memorial sites are filtered at resolve time too, but excluding them here
    // means one can never even be written into a link (D33).
    candidateIds: candidates.filter((s) => !s.sensitive).map((s) => s.id),
    roomId: newRoomId(),
    ...(by ? { by } : {}),
  };
}
