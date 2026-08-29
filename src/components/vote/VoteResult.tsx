"use client";

import { useRouter } from "next/navigation";

import type { Dictionary } from "@/i18n/get-dictionary";
import { getNeighbourhood } from "@/lib/spots/neighbourhoods";
import type { Spot } from "@/lib/spots/schema";
import type { Slot } from "@/lib/vote/ballot";
import { resolve, type Vote } from "@/lib/vote/resolve";
import { useRoute } from "@/store/route";

const fill = (t: string, v: Record<string, string | number>): string =>
  Object.entries(v).reduce((o, [k, val]) => o.replaceAll(`{${k}}`, String(val)), t);

/**
 * The answer.
 *
 * Two things it does that a tally alone would not. It states the winner as a
 * decision rather than a leaderboard — the group came here to stop arguing, not
 * to study numbers. And it **names the objection out loud** (D30): there is no
 * veto, so someone's "no" has to be visible or the product has quietly
 * overruled them. A silent veto produces an argument; a visible dissent count
 * produces a conversation.
 */
export function VoteResult({
  slot,
  candidates,
  votes,
  stops,
  dict,
  onBack,
  locale,
}: {
  slot: Slot;
  candidates: Spot[];
  votes: Vote[];
  stops: number;
  dict: Dictionary;
  onBack: () => void;
  locale: string;
}) {
  const router = useRouter();
  const setStops = useRoute((s) => s.setStops);

  const result = resolve({ slot, candidates, roomId: "", stops }, votes);

  if (result.empty || !result.winner) {
    return (
      <section className="mx-auto w-full max-w-lg px-5 py-12">
        <p className="eyebrow">{dict.vote.resultEyebrow}</p>
        <h1 className="mt-3 font-display text-2xl font-bold">{dict.vote.nobodyVoted}</h1>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 min-h-11 text-sm text-accent underline underline-offset-4"
        >
          {dict.vote.undo}
        </button>
      </section>
    );
  }

  const winner = result.winner;

  return (
    <section className="mx-auto w-full max-w-lg px-5 py-10">
      <p className="eyebrow">{dict.vote.resultEyebrow}</p>

      <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05]">
        {winner.name.en}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {fill(dict.vote.winnerWhere, {
          neighbourhood: getNeighbourhood(winner.neighbourhood).name,
          price: "$".repeat(winner.priceLevel),
        })}
      </p>

      {/*
        Stated, not buried in the tally. The design has no veto by choice, so
        the objection has to be somewhere a reader cannot miss it.
      */}
      <p className="mt-5 border-l-2 border-border pl-3 text-sm leading-relaxed">
        {result.dissent.length === 0
          ? dict.vote.noDissent
          : result.dissent.length === 1
            ? dict.vote.dissentOne
            : fill(dict.vote.dissentMany, { count: result.dissent.length })}
      </p>

      {/*
        The night, and the way out of this screen.

        Voting answers *what*; the timeline answers *when and in what order*
        (D37). Before this the vote resolved to a winner and then had nowhere
        to go, which made the whole thing feel like a poll rather than a plan.
      */}
      {result.chosen.length > 0 ? (
        <div className="mt-7">
          <h2 className="eyebrow">{dict.vote.chosenHeading}</h2>
          <p className="mt-1 text-[11px] text-muted">
            {fill(dict.vote.chosenOf, {
              count: result.chosen.length,
              total: candidates.length,
            })}
          </p>

          <ol className="mt-3 space-y-1">
            {result.chosen.map((spot, i) => (
              <li
                key={spot.id}
                className="flex items-baseline gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
              >
                <span className="text-xs tabular-nums text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 text-sm">{spot.name.en}</span>
                <span className="shrink-0 text-[11px] text-muted">
                  {getNeighbourhood(spot.neighbourhood).name}
                </span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => {
              setStops(result.chosen);
              router.push(`/${locale}/discover#day`);
            }}
            className="mt-4 min-h-12 w-full rounded-full bg-accent px-5 text-sm font-bold text-accent-contrast"
          >
            {dict.vote.planTheNight}
          </button>
        </div>
      ) : null}

      {result.runnerUp ? (
        <p className="mt-3 text-xs text-muted">
          {fill(dict.vote.runnerUp, { name: result.runnerUp.name.en })}
        </p>
      ) : null}

      <h2 className="eyebrow mt-9">{dict.vote.tallyHeading}</h2>
      <ul className="mt-3 space-y-1">
        {result.tally.map((t) => (
          <li
            key={t.spot.id}
            className="flex items-baseline justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
          >
            <span className="min-w-0 flex-1 truncate text-sm">{t.spot.name.en}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted">
              {t.yes} · {t.maybe} · {t.no}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-muted">
        {dict.vote.yes} · {dict.vote.maybe} · {dict.vote.no}
      </p>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 min-h-11 text-sm text-accent underline underline-offset-4"
      >
        {dict.vote.undo}
      </button>
    </section>
  );
}
