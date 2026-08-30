import { estimateLeg } from "@/lib/route/estimate";
import { isOpenAt } from "@/lib/hours/open";
import { slotInstant, type ResolvedBallot } from "@/lib/vote/ballot";
import type { Spot } from "@/lib/spots/schema";

/**
 * Turning several people's marks into one answer.
 *
 * **Pure, no I/O.** It runs identically on a server tallying stored votes or a
 * client tallying codes pasted into a group chat, which keeps the zero-backend
 * fallback viable and makes this testable with no infrastructure at all (D30).
 *
 * Approval voting, not ranked choice. Five friends and six options do not need
 * IRV; ranking six bars is more work than the decision is worth. Approval's
 * failure mode is a bland consensus pick, which is exactly what a group
 * deciding where to go actually wants.
 */

export type Mark = "yes" | "maybe" | "no";

export type Vote = {
  voter: string;
  marks: Record<string, Mark>;
};

export type Tally = {
  spot: Spot;
  yes: number;
  maybe: number;
  no: number;
  /** yes = 1, maybe = 0.5, no = 0. Ordering only; never shown. */
  score: number;
};

export type Result = {
  winner: Spot | null;
  runnerUp: Spot | null;
  /**
   * The night, in approval order — the top `ballot.stops` candidates (D37).
   *
   * This is what the planner receives. Voting answers *what*; the timeline
   * answers *when and in what order*, and before this existed the vote resolved
   * to a single winner and then had nowhere to go.
   *
   * A candidate nobody approved at all is excluded even if the group asked for
   * more stops than that leaves: a night of three should not include a place
   * every single person said no to just to reach three.
   */
  chosen: Spot[];
  tally: Tally[];
  /** Who marked the winner "no". Surfaced, never used to veto. */
  dissent: string[];
  voters: string[];
  /** True when nobody marked anything at all. */
  empty: boolean;
};

const MARK_SCORE: Record<Mark, number> = { yes: 1, maybe: 0.5, no: 0 };

/**
 * Total travel from every other candidate — a stand-in for "central to the
 * group" while there are no accounts to know where anyone actually is. Lower is
 * better, and it only ever breaks a tie.
 */
function centrality(spot: Spot, all: readonly Spot[]): number {
  return all
    .filter((other) => other.id !== spot.id)
    .reduce((total, other) => total + estimateLeg(spot, other).minutes, 0);
}

/**
 * One vote per person, and the last one is the one that counts.
 *
 * The unique index in migration 0002 is the real guarantee — this is the same
 * rule expressed where it can be *tested* without a database. Both exist on
 * purpose: a store-only guarantee cannot be asserted by the suite, and a
 * resolver-only one is undone by the first writer that is not this route.
 *
 * `readVotes` orders by `created_at` ascending, so later entries overwrite
 * earlier ones and the newest marks win. That ordering is load-bearing; a
 * descending read would silently keep the stale vote.
 */
function oneEach(votes: readonly Vote[]): Vote[] {
  const latest = new Map<string, Vote>();
  for (const vote of votes) latest.set(vote.voter, vote);
  return [...latest.values()];
}

export function resolve(ballot: ResolvedBallot, allVotes: readonly Vote[]): Result {
  const at = slotInstant(ballot.slot);
  const votes = oneEach(allVotes);

  const tally: Tally[] = ballot.candidates.map((spot) => {
    let yes = 0;
    let maybe = 0;
    let no = 0;

    for (const vote of votes) {
      const mark = vote.marks[spot.id];
      if (mark === "yes") yes += 1;
      else if (mark === "maybe") maybe += 1;
      else if (mark === "no") no += 1;
    }

    return { spot, yes, maybe, no, score: yes * MARK_SCORE.yes + maybe * MARK_SCORE.maybe };
  });

  /**
   * Tie-breaks, in order: most yes, then fewest no, then open at the slot, then
   * most central. Each is a weaker signal than the last, and stopping at "most
   * yes" would leave the order incidental.
   *
   * **There is no hard veto.** One "no" must not kill an option — but it is
   * surfaced below, because a silent veto produces an argument and a visible
   * dissent count produces a conversation.
   */
  const ranked = [...tally].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.yes !== a.yes) return b.yes - a.yes;
    if (a.no !== b.no) return a.no - b.no;

    const aOpen = isOpenAt(a.spot.hours, at) === "open" ? 0 : 1;
    const bOpen = isOpenAt(b.spot.hours, at) === "open" ? 0 : 1;
    if (aOpen !== bOpen) return aOpen - bOpen;

    const central =
      centrality(a.spot, ballot.candidates) - centrality(b.spot, ballot.candidates);
    if (central !== 0) return central;

    return a.spot.name.en.localeCompare(b.spot.name.en);
  });

  const anyMarks = tally.some((t) => t.yes + t.maybe + t.no > 0);
  const winner = anyMarks ? (ranked[0]?.spot ?? null) : null;

  const chosen = anyMarks
    ? ranked
        .filter((t) => t.score > 0)
        .slice(0, Math.max(1, ballot.stops))
        .map((t) => t.spot)
    : [];

  return {
    winner,
    runnerUp: anyMarks ? (ranked[1]?.spot ?? null) : null,
    tally: ranked,
    chosen,
    dissent: winner
      ? votes.filter((v) => v.marks[winner.id] === "no").map((v) => v.voter)
      : [],
    // Already unique: `oneEach` keys by voter.
    voters: votes.map((v) => v.voter),
    empty: !anyMarks,
  };
}
