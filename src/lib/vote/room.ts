import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Mark, Vote } from "@/lib/vote/resolve";

export { isValidRoomId, newRoomId, parseMarks, ROOM_ID } from "@/lib/vote/validate";

/**
 * The vote store. The only server-side thing in this project (D30, D35).
 *
 * **The service key lives here and nowhere else.** `server-only` makes an
 * accidental import from a client component a build error rather than a
 * production leak — a build that ships this key is a total compromise, so the
 * guard is worth more than the convention.
 */

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Whether the store is configured at all. Absent → the route 503s honestly. */
export const isConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

/**
 * Votes in a room, or `null` if the store could not be read.
 *
 * The null matters. Returning `[]` on a failure is indistinguishable from "no
 * votes yet", so a broken store would show a group an empty tally forever
 * rather than an error — the exact silent-failure shape this project keeps
 * finding by running things. The route turns null into a 502.
 */
export async function readVotes(roomId: string): Promise<Vote[] | null> {
  const db = client();
  if (!db) return null;

  const { data, error } = await db
    .from("votes")
    .select("voter, marks")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error || !data) return null;
  return data.map((row) => ({
    voter: String(row.voter),
    marks: (row.marks ?? {}) as Record<string, Mark>,
  }));
}

export async function appendVote(
  roomId: string,
  voter: string,
  marks: Record<string, Mark>,
): Promise<boolean> {
  const db = client();
  if (!db) return false;

  const { error } = await db.from("votes").insert({ room_id: roomId, voter, marks });
  if (error) return false;

  /**
   * Opportunistic expiry, on top of the scheduled sweep in the migration.
   *
   * Postgres has no TTL, so the 24-hour window has to be built rather than
   * intended (D30). Doing it here as well means a cron job that silently stops
   * degrades the guarantee for abandoned rooms rather than breaking it for
   * every room — and a store that quietly stops expiring is a data-retention
   * problem nobody would notice.
   */
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await db.from("votes").delete().lt("created_at", cutoff);

  /**
   * Live updates go over Broadcast, not `postgres_changes`, and that is a
   * security choice rather than a performance one: `postgres_changes` would
   * need an RLS policy expressing "knows the room id", which is not an auth
   * claim and is the policy shape that gets written permissively (D35).
   */
  const channel = db.channel(`room:${roomId}`);
  await channel.subscribe();
  await channel.send({ type: "broadcast", event: "vote", payload: { voter } });
  await db.removeChannel(channel);

  return true;
}
