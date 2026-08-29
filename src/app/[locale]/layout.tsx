import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { buildableLocales, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { DayDock } from "@/components/route/DayDock";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAllSpots } from "@/lib/spots";
import { neighbourhoods } from "@/lib/spots/neighbourhoods";

// Serif display over a geometric sans — the editorial register this kind of
// content wants. See docs/DESIGN-SYSTEM.md.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export function generateStaticParams() {
  return buildableLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? locale : "en");
  return {
    title: { default: dict.site.name, template: `%s · ${dict.site.name}` },
    description: dict.site.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Next 16: params is a Promise and must be awaited (D8).
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    /*
      The one legitimate use of suppressHydrationWarning, scoped to this single
      element.

      The inline script in <head> sets `data-theme` here before first paint, so
      a stored dark choice does not flash light (D26). The server has no
      localStorage and renders without it, so the attribute genuinely differs
      and React is right to notice.

      It does NOT extend to content. A text or ordering mismatch is a real bug
      and is fixed by not rendering time-dependent output until after mount —
      see src/components/hooks/useNow.ts.
    */
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
    >
      {/*
        Applied before first paint. Doing this in a component instead would
        flash the light palette on every load for anyone who chose dark.
      */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('mapraccoon:theme');" +
              "if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
          <nav
            className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:h-16"
            aria-label={dict.nav.discover}
          >
            <Link
              href={`/${locale}`}
              className="inline-flex min-h-11 items-center font-display text-lg font-bold tracking-tight"
            >
              {dict.site.name}
            </Link>

            {/*
              The four cities used to live here as site navigation, and the
              neighbourhoods that replaced them do not belong in global chrome
              (D27). A neighbourhood is a filter, not a destination — nine of
              them across a header is a row nobody reads, and every link would
              have gone to a page that is a worse version of /discover.
            */}

            <div className="flex shrink-0 items-center gap-3">
              <ThemeToggle label={dict.nav.theme} />
              <Link
                href={`/${locale}/discover`}
                className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-accent px-4 text-sm font-bold text-accent-contrast transition-opacity hover:opacity-90"
              >
                {dict.nav.openMap}
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        <footer className="border-t border-border bg-surface-sunk">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <p className="font-display text-lg font-bold tracking-tight">
                {dict.site.name}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                {dict.footer.blurb}
              </p>
            </div>

            <div>
              {/*
                Names the neighbourhoods without linking anywhere. Each one was
                a link to /city/[city], which step 3 deleted — nine dead links
                in the footer of every page. They are kept as text because
                telling someone which parts of the city this covers is useful;
                sending them to a filtered list from the footer is not.
              */}
              <h2 className="eyebrow">{dict.footer.cities}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {neighbourhoods.map((n) => n.name).join(" · ")}
              </p>
            </div>

            <div>
              <h2 className="eyebrow">{dict.footer.about}</h2>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                {dict.footer.editorial}
              </p>
            </div>
          </div>
        </footer>

        {/*
          The day's ambient summary, below `lg` on every page (D23). Renders
          nothing at all when no day exists — the feature is invisible until it
          is used, and it must not cost 56px of viewport to a visitor who has
          never added a stop.
        */}
        <DayDock spots={[...getAllSpots()]} dict={dict} />
      </body>
    </html>
  );
}
