import type { ReactNode } from "react";
import "./globals.css";

/**
 * The root layout only supplies <html>/<body>. Locale, fonts and metadata live
 * in `app/[locale]/layout.tsx`, which is the layout that actually knows the
 * language it is rendering.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
