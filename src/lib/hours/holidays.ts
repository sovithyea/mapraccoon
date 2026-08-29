/**
 * Cambodian public holidays, as one list rather than a per-venue field.
 *
 * A `closedOnPublicHolidays` boolean would be eighty guesses that go stale
 * invisibly, and several of these dates are lunar and move every year — so an
 * author would be guessing about a date they also could not predict.
 *
 * Instead the product says one honest thing on the day: *"It's Pchum Ben. A lot
 * of these will be closed — check before you go."* One piece of copy, no
 * per-venue cost, and it does not pretend to know which venues.
 *
 * **These dates are unverified like the rest of the content (R1)**, and the
 * lunar ones shift annually. Anything past the current year is absent rather
 * than guessed.
 */

export type Holiday = { date: string; name: string; lunar?: boolean };

/** 2026 only. A year with no entries returns nothing rather than stale dates. */
export const holidays: readonly Holiday[] = [
  { date: "2026-01-01", name: "International New Year" },
  { date: "2026-01-07", name: "Victory over Genocide Day" },
  { date: "2026-03-08", name: "International Women's Day" },
  { date: "2026-04-14", name: "Khmer New Year" },
  { date: "2026-04-15", name: "Khmer New Year" },
  { date: "2026-04-16", name: "Khmer New Year" },
  { date: "2026-05-01", name: "Labour Day" },
  { date: "2026-05-14", name: "King's Birthday" },
  { date: "2026-09-20", name: "Pchum Ben", lunar: true },
  { date: "2026-09-21", name: "Pchum Ben", lunar: true },
  { date: "2026-09-22", name: "Pchum Ben", lunar: true },
  { date: "2026-11-09", name: "Independence Day" },
  { date: "2026-11-24", name: "Water Festival", lunar: true },
  { date: "2026-11-25", name: "Water Festival", lunar: true },
  { date: "2026-11-26", name: "Water Festival", lunar: true },
];

/** The holiday on an ISO date, if the list covers that year at all. */
export function holidayOn(isoDate: string): Holiday | undefined {
  return holidays.find((h) => h.date === isoDate);
}

/** Whether the list has any dates for a year — so the UI can stay quiet if not. */
export function coversYear(isoDate: string): boolean {
  const year = isoDate.slice(0, 4);
  return holidays.some((h) => h.date.startsWith(year));
}
