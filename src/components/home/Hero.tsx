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
    One door, because there is one thing to do.
    
    There used to be three: discover, the pairing rail, the community rail.
    The last two were anchors into sections that D28 and D29 removed, so they
    had been scrolling to nothing — dead links in the hero of the landing page.
  */
  const doors = [
    { key: "hidden", href: `/${locale}/discover`, ...dict.hero.doors.hidden },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-16">
        <div>
          <p className="eyebrow">{dict.hero.eyebrow}</p>

          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
            {dict.hero.headingA}
            <br />
            {dict.hero.headingB}
            <span className="mt-2 block text-forest-mid">{dict.hero.headingC}</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            {dict.hero.lead}
          </p>

          <nav className="mt-8" aria-label={dict.hero.doorsLabel}>
            <p className="eyebrow mb-3">{dict.hero.doorsLabel}</p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {doors.map((door) => (
                <li key={door.key}>
                  <Link
                    href={door.href}
                    className="group flex h-full min-h-14 items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 transition-all hover:-translate-y-0.5 hover:border-forest-mid sm:min-h-24 sm:flex-col sm:items-stretch"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full bg-accent sm:hidden"
                      aria-hidden="true"
                    />
                    <span className="hidden items-center justify-between text-muted sm:flex">
                      <span
                        className="size-2.5 rounded-full bg-accent"
                        aria-hidden="true"
                      />
                      <span
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 sm:mt-auto sm:pt-2">
                      <span className="block text-sm font-bold leading-tight">
                        {door.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted sm:mt-1">
                        {door.body}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 sm:hidden"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div
            role="group"
            aria-label={dict.hero.proof.label}
            className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface-sunk"
          >
            <div className="grid grid-cols-2">
              <Stat value={String(spots.length)} label={dict.hero.proof.spots} />
              <Stat
                value={`${sourcedCount}/${spots.length}`}
                label={dict.hero.proof.sourced}
                bordered
              />
            </div>
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
      <span className="font-display text-lg font-bold leading-none text-forest-mid">
        {value}
      </span>
      <span className="mt-1 text-[10px] font-semibold leading-tight sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}
