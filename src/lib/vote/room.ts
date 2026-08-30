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

/**
 * Record one person's marks. Sending again replaces what they sent before.
 *
 * **This was an insert, and that was a real defect (C32, D40).** Every POST
 * appended a row and `resolve()` counted every row, so a friend who reopened
 * the link and voted again was counted twice — while the voter count on screen
 * de-duplicated by name, so one screen showed two different totals for the same
 * room. Observed here: four distinct names, five rows, and a candidate tallying
 * five marks from four people.
 *
 * The conflict target is `(room_id, voter)`, so the identity is the typed name.
 * That is the only identity this product has, and inventing a second one means
 * inventing accounts. The cost is stated rather than left to be found: two
 * friends who both type "Sok" overwrite each other, and nothing here can tell
 * that from one person changing their mind.
 *
 * `created_at` is sent explicitly so the 24-hour window runs from the latest
 * vote rather than the first. Leaving it would let a re-vote cast at hour 23 be
 * swept an hour later.
 */
export async function appendVote(
  roomId: string,
  voter: string,
  marks: Record<string, Mark>,
): Promise<boolean> {
  const db = client();
  if (!db) return false;

  const row = { room_id: roomId, voter, marks, created_at: new Date().toISOString() };

  const { error } = await db.from("votes").upsert(row, { onConflict: "room_id,voter" });

  if (error) {
    /**
     * `42P10` is Postgres saying there is no unique constraint matching the
     * ON CONFLICT target — i.e. migration 0002 has not been applied to this
     * project yet.
     *
     * **This fallback exists because the alternative is a silent outage.**
     * Deploying the upsert against a database still on 0001 makes every single
     * POST return 502; the app would look exactly as if the store were down,
     * on the one route the product cannot work without. Verified by doing it:
     * the first write after this change 502'd against the live project.
     *
     * Remove-then-insert gets the same result without the constraint. It is
     * two round trips and leaves a race if one person submits twice at once —
     * both of which the index closes once it is applied, and `resolve`'s own
     * de-duplication covers in the meantime (D40).
     */
    if (error.code !== "42P10") return false;

    await db.from("votes").delete().eq("room_id", roomId).eq("voter", voter);
    const { error: retry } = await db.from("votes").insert(row);
    if (retry) return false;
  }

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
