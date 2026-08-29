import Link from "next/link";

import { Constellation } from "@/components/home/Constellation";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Spot } from "@/lib/spots/schema";

export function Hero({
  spots,
  locale,
  dict,
  sourcedCount,
}: {
  spots: Spot[];
  locale: string;
  dict: Dictionary;
  sourcedCount: number;
}) {
  /*
    One button, not a card grid.

    "Choose where to start" made sense when there were four cities to choose
    between. D27 left one, so the grid rendered a single card that looked like
    a menu with one item — the shape still asked a question the product had
    stopped having an answer to. There is one thing to do here, so it is a
    button that says so.
  */
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-16">
        <div>
          {/*
            No eyebrow above the headline. It said "Phnom Penh, tonight" over a
            headline that already says what this is, so it was a label on a
            sentence that did not need one — and it pushed the one thing worth
            reading down the screen.
          */}
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
            {dict.hero.headingA}
            <br />
            {dict.hero.headingB}
            <span className="mt-2 block text-brand">{dict.hero.headingC}</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            {dict.hero.lead}
          </p>

          <div className="mt-8">
            <Link
              href={`/${locale}/discover`}
              className="group inline-flex min-h-13 items-center gap-2.5 rounded-full bg-accent px-7 text-base font-semibold text-accent-contrast transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {dict.hero.cta}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <p className="mt-2.5 text-xs text-muted">{dict.hero.ctaNote}</p>
          </div>

          <div
            role="group"
            aria-label={dict.hero.proof.label}
            className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface-sunk"
          >
            <div className="grid grid-cols-2">
              <Stat value={String(spots.length)} label={dict.hero.proof.spots} />
              <Stat
                value={`${sourcedCount}/${spots.length}`}
                label={dict.hero.proof.sourced}
                bordered
              />
            </div>
            {/*
              Rule 4: the caveat is load-bearing and does not get softened. It
              said "off-radar score is editorial, not an algorithm" until D28
              deleted the score — a disclaimer about a thing that no longer
              existed, standing where the real one should have been.
            */}
            <p className="border-t border-border px-3 py-2.5 text-center text-[11px] leading-snug text-muted">
              {dict.hero.proof.editorial}
            </p>
          </div>
        </div>

        <Constellation
          spots={spots}
          locale={locale}
          label={dict.hero.constellationLabel}
          hint={dict.hero.constellationHint}
        />
      </div>
    </section>
  );
}

/**
 * Three steps, because someone opening a shared link has never seen this and
 * the product only makes sense as a loop — pick, vote, plan. Any one screen on
 * its own reads as a list of bars.
 */
export function HowItWorks({ dict }: { dict: Dictionary }) {
  return (
    <section className="border-b border-border">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 lg:py-14">
        <h2 className="eyebrow">{dict.hero.howLabel}</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {dict.hero.steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-accent-contrast"
              >
                {i + 1}
              </span>
              <h3 className="mt-3.5 font-display text-lg font-bold leading-tight">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  bordered,
}: {
  value: string;
  label: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center justify-center px-3 py-3 text-center ${
        bordered ? "border-l border-border" : ""
      }`}
    >
      <span className="font-display text-lg font-bold leading-none text-brand">
        {value}
      </span>
      <span className="mt-1 text-[10px] font-semibold leading-tight sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}
