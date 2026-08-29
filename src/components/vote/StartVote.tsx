"use client";

import { useState } from "react";

import type { Dictionary } from "@/i18n/get-dictionary";
import { phnomPenhNow } from "@/lib/hours/now";
import type { Spot } from "@/lib/spots/schema";
import { createBallot, encodeBallot } from "@/lib/vote/ballot";

/**
 * Turn the day you are building into something other people vote on.
 *
 * Deliberately not a separate picker. Adding places to a day is already the
 * selection gesture, and inventing a second one would mean choosing twice —
 * the product's whole claim is that it *removes* a step from the group chat,
 * not that it adds a nicer one.
 *
 * The link is the entire product: it carries the candidates, the slot and the
 * room secret, so there is nothing to create server-side before sharing it.
 */
export function StartVote({
  spots,
  dict,
  locale,
}: {
  spots: readonly Spot[];
  dict: Dictionary;
  locale: string;
}) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  /**
   * How many places the night needs, asked here because it is the question the
   * group is actually putting (D37). "Where should we go?" with one answer is a
   * different evening from "where are the three places we're going", and a vote
   * that does not know which it is has to guess afterwards.
   */
  const [stops, setStops] = useState(1);

  // Two is the minimum that is actually a decision. One candidate is a
  // suggestion, and a vote on it is theatre.
  if (spots.length < 2) {
    return (
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        {dict.route.voteNeedsTwo}
      </p>
    );
  }

  const start = () => {
    const now = phnomPenhNow();
    // The slot defaults to tonight at 20:00 rather than "now" — a group
    // deciding at 6pm is deciding about 8pm, and voting on what is open *this
    // minute* would rule out everywhere that opens later.
    const ballot = createBallot(
      spots,
      { isoDate: now.isoDate, startMins: 20 * 60, day: now.day },
      stops,
    );

    const url = `${window.location.origin}/${locale}/vote/${encodeBallot(ballot)}`;
    setLink(url);
    void navigator.clipboard?.writeText(url).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  const maxStops = Math.min(4, spots.length);

  return (
    <div>
      <p className="text-xs font-semibold">{dict.route.howManyStops}</p>
      <div className="mt-2 flex gap-2">
        {Array.from({ length: maxStops }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={stops === n}
            onClick={() => setStops(n)}
            className={`min-h-11 flex-1 rounded-2xl border text-sm font-bold transition-colors ${
              stops === n
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border text-muted hover:border-muted"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
        {dict.route.stopsHint}
      </p>

      <button
        type="button"
        onClick={start}
        className="mt-4 min-h-11 w-full rounded-full bg-accent px-5 text-sm font-bold text-accent-contrast"
      >
        {dict.route.putToVote}
      </button>

      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        {copied ? dict.route.voteLinkCopied : dict.route.putToVoteHint}
      </p>

      {/*
        Shown as well as copied. The clipboard fails silently on some browsers
        and in any non-secure context, and a share flow whose only output went
        somewhere invisible would be indistinguishable from a broken button.
      */}
      {link ? (
        <a
          href={link}
          className="mt-2 block break-all text-[11px] text-accent underline underline-offset-4"
        >
          {dict.vote.openLink} ↗
        </a>
      ) : null}
    </div>
  );
}
