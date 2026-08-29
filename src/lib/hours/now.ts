import type { Instant } from "@/lib/hours/open";

/**
 * **The only module in this repo that reads the clock.**
 *
 * Everything above it takes an explicit `Instant`, which is what lets the hours
 * suite be table-driven with no fake timers and no midnight-boundary flakes.
 * The moment another file calls `new Date()` for opening hours, every test
 * above it becomes time-dependent. Do not.
 *
 * Cambodia is UTC+7 and has never observed daylight saving, so a fixed offset
 * is exact — and cheaper than `Intl.DateTimeFormat` with a `timeZone`, which
 * allocates per call and returns strings that then have to be re-parsed (D34).
 *
 * The consequence that actually matters is not performance. This must be
 * Phnom Penh time **regardless of the viewer's device**: a friend deciding from
 * Bangkok, or on a phone with a wrong timezone, still needs Phnom Penh opening
 * hours. `date.getHours()` would give them their own.
 */

const PHNOM_PENH_UTC_OFFSET_MINS = 7 * 60;
const MS_PER_MIN = 60_000;

export type Now = Instant & { isoDate: string };

export function phnomPenhNow(date: Date = new Date()): Now {
  const shifted = new Date(date.getTime() + PHNOM_PENH_UTC_OFFSET_MINS * MS_PER_MIN);

  // `getUTC*` on a shifted date reads local Phnom Penh wall-clock values.
  // JS weeks start on Sunday; ours start on Monday, hence the rotation.
  const day = (shifted.getUTCDay() + 6) % 7;
  const mins = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();

  return { day, mins, isoDate: shifted.toISOString().slice(0, 10) };
}
