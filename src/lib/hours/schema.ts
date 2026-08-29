import { z } from "zod";

import { localizedTextSchema } from "@/lib/spots/schema";

/**
 * Opening hours (D34, and step 2 of specs/3-friends/plan.md).
 *
 * Authored as `"HH:MM"` strings because a hand-edited content file has to be
 * reviewable in a diff — `1020` is not. Normalised to minutes at parse, so
 * every consumer downstream sees integers only and no one re-parses a string.
 *
 * Two conventions carry most of the weight, and both exist to remove a field
 * that authors would otherwise get wrong:
 *
 *   An absent day is closed. Most venues close one day a week and saying so
 *   should cost zero keystrokes, so there is no `closed: true`.
 *
 *   `close <= open` means the venue runs past midnight. A rooftop bar is
 *   `{ days: ["fri","sat"], open: "17:00", close: "02:00" }`. There is no
 *   `crossesMidnight` flag, because the flag is the thing people forget to set.
 */

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayToken = (typeof DAYS)[number];

/** 0 = Monday, matching `DAYS`. */
export const dayIndex = (day: DayToken): number => DAYS.indexOf(day);

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be "HH:MM", 00:00 to 23:59');

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  return h * 60 + m;
};

const ruleInputSchema = z.object({
  days: z.array(z.enum(DAYS)).min(1),
  open: timeSchema,
  close: timeSchema,
});

/** A rule after normalisation. `closeMins` may exceed 1440 — see above. */
export type Rule = {
  days: readonly DayToken[];
  openMins: number;
  closeMins: number;
};

const ruleSchema = ruleInputSchema.transform(
  (r): Rule => {
    const openMins = toMinutes(r.open);
    const rawClose = toMinutes(r.close);
    return {
      days: r.days,
      openMins,
      // Equal is treated as past-midnight-by-a-full-day and rejected below;
      // the arithmetic here is only reached for a genuine overnight span.
      closeMins: rawClose <= openMins ? rawClose + 1440 : rawClose,
    };
  },
);

export const hoursSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("always") }),
    /**
     * Not an omission — a stated absence. Without this an author who cannot
     * find a venue's hours will invent them, and "open now" becomes a liar at
     * exactly the moment it matters. It requires a link so the UI always has
     * somewhere to send the reader.
     */
    z.object({
      kind: z.literal("unknown"),
      why: z.string().min(1).optional(),
    }),
    z.object({
      kind: z.literal("weekly"),
      rules: z.array(ruleSchema).min(1),
      note: localizedTextSchema.optional(),
    }),
  ])
  .superRefine((hours, ctx) => {
    if (hours.kind !== "weekly") return;

    hours.rules.forEach((rule, i) => {
      // `open === close` is genuinely ambiguous: 24 hours, or closed? Rejecting
      // it forces the author to say which, via `kind: "always"` or by omitting
      // the day.
      if (rule.closeMins - rule.openMins === 1440) {
        ctx.addIssue({
          code: "custom",
          path: ["rules", i],
          message:
            'open and close are the same time — use { kind: "always" } for 24 hours, or omit the day to close it',
        });
      }
      if (rule.closeMins - rule.openMins > 1440) {
        ctx.addIssue({
          code: "custom",
          path: ["rules", i],
          message: "a rule cannot span more than 24 hours",
        });
      }
    });

    // Overlaps are checked after normalisation, so an overnight rule is
    // compared on the same axis as the day it spills into.
    for (const day of DAYS) {
      const spans = hours.rules
        .filter((r) => r.days.includes(day))
        .map((r) => [r.openMins, r.closeMins] as const)
        .sort((a, b) => a[0] - b[0]);

      for (let i = 1; i < spans.length; i += 1) {
        const previous = spans[i - 1];
        const current = spans[i];
        if (previous && current && current[0] < previous[1]) {
          ctx.addIssue({
            code: "custom",
            path: ["rules"],
            message: `two rules overlap on ${day} — split shifts must not touch`,
          });
        }
      }
    }
  });

export type Hours = z.output<typeof hoursSchema>;
/** What content authors write. Times are strings here, minutes after parsing. */
export type HoursInput = z.input<typeof hoursSchema>;
