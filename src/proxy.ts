import { NextResponse, type NextRequest } from "next/server";

import { buildableLocales, defaultLocale, isLocale } from "@/i18n/config";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts` with a `proxy` export —
 * verified against node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
 *
 * Sends bare paths to a locale. Only locales with a complete dictionary are
 * routable, so /km falls through to English until km.json is filled (D7).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  if (isLocale(first) && buildableLocales.includes(first)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
