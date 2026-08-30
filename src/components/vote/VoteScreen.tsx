"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { clock } from "@/components/route/time";
import type { Dictionary } from "@/i18n/get-dictionary";
import { isOpenAt } from "@/lib/hours/open";
import { getNeighbourhood } from "@/lib/spots/neighbourhoods";
import type { Spot } from "@/lib/spots/schema";
import { slotInstant, type Slot } from "@/lib/vote/ballot";
import type { Mark, Vote } from "@/lib/vote/resolve";
import { VoteResult } from "@/components/vote/VoteResult";

const fill = (t: string, v: Record<string, string | number>): string =>
  Object.entries(v).reduce((o, [k, val]) => o.replaceAll(`{${k}}`, String(val)), t);

const NAME_KEY = "mapraccoon:voter";

/** No cross-tab sync needed: a name only ever changes in the tab that typed it. */
const subscribeToName = (): (() => void) => () => {};

const readName = (): string => {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    // Private browsing. They type it again; nothing else breaks.
    return "";
  }
};

/** The server has no localStorage, and saying so is what avoids the mismatch. */
const readNameOnServer = (): string => "";

/**
 * One card at a time, three buttons, then send.
 *
 * The whole product rests on this being good (D29) — there is no editorial hook
 * to fall back on if the interaction is mediocre, and the competitor is a group
 * chat that is already open on everyone's phone (D31).
 *
 * So: one decision on screen at a time rather than a grid to scan, a name asked
 * once rather than an account, and the voters NAMED so nobody wonders whether it
 * worked or who is still missing (C34).
 */
export function VoteScreen({
  roomId,
  slot,
  candidates,
  stops,
  by,
  dict,
  locale,
}: {
  roomId: string;
  slot: Slot;
  candidates: Spot[];
  stops: number;
  by?: string;
  locale: string;
  dict: Dictionary;
}) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [state, setState] = useState<"marking" | "sending" | "sent" | "failed">("marking");
  const [votes, setVotes] = useState<Vote[] | null>(null);
  const [showResult, setShowResult] = useState(false);

  /**
   * Remembered so the second and third vote of an evening skip the name step.
   *
   * `useSyncExternalStore`, because this is the one pattern that gets it right.
   * A lazy `useState` initialiser reading localStorage looks correct and is
   * not: the server renders "" and the client renders the saved name, React
   * sees a mismatch, and the tree it recovers had a *disabled* button over an
   * input that visibly contained a name. The third argument here is the server
   * snapshot, which is exactly what it is for.
   *
   * `typed` stays null until someone edits, so the remembered name shows
   * through without being frozen into state before hydration finishes.
   */
  const remembered = useSyncExternalStore(subscribeToName, readName, readNameOnServer);
  const [typed, setTyped] = useState<string | null>(null);
  const voter = typed ?? remembered;
  const setVoter = setTyped;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/${roomId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { votes: Vote[] };
      setVotes(data.votes);
    } catch {
      // Offline or the store is down. The last known tally stays on screen
      // rather than being replaced by a zero, which would read as "nobody
      // voted" — the same failure the route's 502 exists to avoid.
    }
  }, [roomId]);

  /**
   * Live updates, with polling underneath.
   *
   * The socket is the nice half; the poll is the half that means a dropped
   * connection degrades to slow rather than to a screen that silently stops
   * updating. A vote that lands and is never shown is the worst outcome here
   * (D35), so the fallback is not optional.
   */
  useEffect(() => {
    let cancelled = false;
    let channel: { unsubscribe: () => void } | null = null;

    const poll = setInterval(() => void refresh(), 8000);

    void (async () => {
      // The first read lives inside the async block with the subscription, so
      // there is one place that talks to the store and nothing sets state
      // synchronously during commit.
      await refresh();

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) return;

      const { createClient } = await import("@supabase/supabase-js");
      if (cancelled) return;

      const db = createClient(url, key, { auth: { persistSession: false } });
      const ch = db.channel(`room:${roomId}`);
      ch.on("broadcast", { event: "vote" }, () => void refresh());
      ch.subscribe();
      channel = ch;
    })();

    return () => {
      cancelled = true;
      clearInterval(poll);
      channel?.unsubscribe();
    };
  }, [roomId, refresh]);

  const current = candidates[index];
  const at = slotInstant(slot);

  const mark = (m: Mark) => {
    if (!current) return;
    setMarks((prev) => ({ ...prev, [current.id]: m }));
    setIndex((i) => i + 1);
  };

  const send = async () => {
    setState("sending");
    try {
      localStorage.setItem(NAME_KEY, voter);
    } catch {
      // Not important enough to fail the vote over.
    }
    try {
      const res = await fetch(`/api/room/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voter, marks }),
      });
      setState(res.ok ? "sent" : "failed");
      if (res.ok) void refresh();
    } catch {
      setState("failed");
    }
  };

  /**
   * Who has voted — named, not counted (C34).
   *
   * It was "{n} voted so far", and the number silently meant two different
   * things: before you sent, it was the others; afterwards, the others and you.
   * Nothing on screen marked the switch. Worse, a count does not answer the
   * question the line exists for, which is *who are we still waiting on* — and
   * the names were already on the client, unused.
   */
  const joinNames = (names: readonly string[]): string => {
    try {
      return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(
        names,
      );
    } catch {
      // Not every locale this app may add has list-format data.
      return names.join(", ");
    }
  };

  const myName = voter.trim();
  const voterNames = votes ? [...new Set(votes.map((v) => v.voter))] : [];
  const iHaveVoted = myName.length > 0 && voterNames.includes(myName);

  // "You" first, so the answer to "is mine in?" is never something to search a
  // list for.
  const displayNames = [
    ...(iHaveVoted ? [dict.vote.you] : []),
    ...voterNames.filter((name) => name !== myName),
  ];

  const votedLine = ((): string => {
    if (displayNames.length === 0) return dict.vote.nobodyYet;
    if (displayNames.length === 1 && iHaveVoted) return dict.vote.youFirst;
    const template = displayNames.length === 1 ? dict.vote.hasVoted : dict.vote.haveVoted;
    return fill(template, { names: joinNames(displayNames) });
  })();

  /**
   * What the group is actually deciding (C35).
   *
   * `stops` was passed into this component and forwarded straight to the
   * result, so the marking screens never mentioned it — yet it is the one
   * number that tells a voter how generous to be. Approving a single place is
   * right for one destination and wrong for a three-stop night.
   */
  const pickingLine = stops > 1 ? fill(dict.vote.pickingMany, { stops }) : dict.vote.pickingOne;

  if (showResult && votes) {
    return (
      <VoteResult
        slot={slot}
        candidates={candidates}
        votes={votes}
        stops={stops}
        dict={dict}
        locale={locale}
        onBack={() => setShowResult(false)}
      />
    );
  }

  // Step 1 — who are you. Asked once, not an account.
  if (!started) {
    return (
      <section className="mx-auto w-full max-w-lg px-5 py-12">
        <p className="eyebrow">{dict.vote.eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
          {dict.vote.title}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {fill(dict.vote.subtitle, {
            count: candidates.length,
            when: `${dict.route.tabTimeline === "" ? "" : ""}${clock(slot.startMins)}`,
          })}
          {by ? ` · ${fill(dict.vote.byLine, { name: by })}` : ""}
        </p>
        <p className="mt-1.5 text-sm font-semibold">{pickingLine}</p>

        {/*
          Who is already in, before anyone is asked for anything. A ballot with
          three votes on it used to look identical to an empty one, so the first
          thing this screen told a late voter was nothing at all.
        */}
        {votes ? (
          <p className="mt-4 text-sm text-muted" role="status">
            {votedLine}
          </p>
        ) : null}

        <label className="mt-6 block">
          <span className="text-sm font-semibold">{dict.vote.whoAreYou}</span>
          <input
            value={voter}
            onChange={(e) => setVoter(e.target.value.slice(0, 40))}
            placeholder={dict.vote.namePlaceholder}
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-surface px-4 text-base"
          />
          <span className="mt-2 block text-xs text-muted">
            {fill(dict.vote.nameHint, { count: candidates.length })}
          </span>
        </label>

        {/*
          Says what the button is about to do. Now that a second send REPLACES
          the first (D40) rather than counting twice, that is a promise worth
          making before it is kept.
        */}
        {iHaveVoted ? (
          <p className="mt-4 text-sm text-muted">{dict.vote.alreadyVoted}</p>
        ) : null}

        <button
          type="button"
          disabled={voter.trim().length === 0}
          onClick={() => setStarted(true)}
          className="mt-4 min-h-12 w-full rounded-full bg-accent px-5 text-sm font-bold text-accent-contrast disabled:opacity-40"
        >
          {iHaveVoted ? dict.vote.changeAnswers : dict.vote.start}
        </button>

        {/*
          The way out of the loop (C33). Reaching the result used to require
          marking every card again, which then counted you a second time — the
          person most likely to check was the person most likely to be counted
          twice. Looking must not be a vote.
        */}
        <button
          type="button"
          onClick={() => setShowResult(true)}
          disabled={!votes || votes.length === 0}
          className="mt-3 min-h-12 w-full rounded-full border border-border px-5 text-sm font-semibold disabled:opacity-40"
        >
          {dict.vote.seeHeading}
        </button>
      </section>
    );
  }

  // Step 3 — everything marked.
  if (!current) {
    return (
      <section className="mx-auto w-full max-w-lg px-5 py-12">
        <p className="eyebrow">{dict.vote.eyebrow}</p>
        <h1 className="mt-3 font-display text-2xl font-bold">
          {state === "sent" ? dict.vote.submitted : dict.vote.title}
        </h1>

        <p className="mt-3 text-sm text-muted" role="status">
          {votedLine}
          {state !== "sent" ? ` ${dict.vote.yoursNotIn}` : ""}
        </p>

        {state !== "sent" ? (
          <button
            type="button"
            onClick={() => void send()}
            disabled={state === "sending"}
            className="mt-6 min-h-12 w-full rounded-full bg-accent px-5 text-sm font-bold text-accent-contrast disabled:opacity-40"
          >
            {state === "sending" ? dict.vote.submitting : dict.vote.submit}
          </button>
        ) : null}

        {state === "failed" ? (
          <p className="mt-3 text-sm text-muted">{dict.vote.failed}</p>
        ) : null}

        <button
          type="button"
          onClick={() => setShowResult(true)}
          disabled={!votes || votes.length === 0}
          className="mt-3 min-h-12 w-full rounded-full border border-border px-5 text-sm font-semibold disabled:opacity-40"
        >
          {dict.vote.seeResult}
        </button>
      </section>
    );
  }

  // Step 2 — one card, three buttons.
  const openState = isOpenAt(current.hours, at);

  return (
    <section className="mx-auto w-full max-w-lg px-5 py-8">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">{dict.vote.eyebrow}</p>
        <p className="text-xs tabular-nums text-muted">
          {fill(dict.vote.progress, { done: index + 1, total: candidates.length })}
        </p>
      </div>

      {/* Carried onto the card screen too: it is the number that tells you how
          generous to be, and it is needed while marking, not afterwards. */}
      <p className="mt-2 text-xs text-muted">{pickingLine}</p>

      <article className="mt-5 rounded-3xl border border-border bg-surface p-6">
        <p className="text-xs text-muted">
          {getNeighbourhood(current.neighbourhood).name} · {"$".repeat(current.priceLevel)}
          {" · "}
          {openState === "unknown"
            ? dict.vote.hoursUnknown
            : openState === "closed"
              ? dict.vote.closedAtSlot
              : dict.vote.openAtSlot}
        </p>

        <h2 className="mt-2 font-display text-2xl font-bold leading-tight">
          {current.name.en}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{current.blurb.en}</p>
      </article>

      {/* Three targets, thumb-sized, in the order a hand reaches them. */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => mark("no")}
          className="min-h-14 rounded-2xl border border-border text-sm font-semibold hover:border-muted"
        >
          {dict.vote.no}
        </button>
        <button
          type="button"
          onClick={() => mark("maybe")}
          className="min-h-14 rounded-2xl border border-border text-sm font-semibold hover:border-muted"
        >
          {dict.vote.maybe}
        </button>
        <button
          type="button"
          onClick={() => mark("yes")}
          className="min-h-14 rounded-2xl bg-accent text-sm font-bold text-accent-contrast"
        >
          {dict.vote.yes}
        </button>
      </div>

      {index > 0 ? (
        <button
          type="button"
          onClick={() => setIndex((i) => i - 1)}
          className="mt-3 min-h-11 w-full text-xs text-muted underline underline-offset-4"
        >
          {dict.vote.undo}
        </button>
      ) : null}
    </section>
  );
}
