import { describe, expect, it } from "vitest";

import { holidayOn, coversYear } from "@/lib/hours/holidays";
import { CLOSING_SOON_MINS, isOpenAt, nextChangeAt, type Instant } from "@/lib/hours/open";
import { phnomPenhNow } from "@/lib/hours/now";
import { hoursSchema, type Hours, type HoursInput } from "@/lib/hours/schema";

const parse = (input: HoursInput): Hours => {
  const r = hoursSchema.safeParse(input);
  if (!r.success) throw new Error(JSON.stringify(r.error.issues));
  return r.data;
};

/** `at("fri", "20:00")` — 0 = Monday, matching the schema. */
const DAY_INDEX = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 } as const;
const at = (day: keyof typeof DAY_INDEX, hhmm: string): Instant => {
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  return { day: DAY_INDEX[day], mins: h * 60 + m };
};

/**
 * Every assertion passes an explicit instant. No fake timers anywhere in this
 * file — that is the property the `isOpenAt`/`phnomPenhNow` split exists to
 * protect, and it is why none of these can flake at midnight in CI.
 */

describe("parsing", () => {
  it("rejects a time that is not HH:MM", () => {
    expect(hoursSchema.safeParse({
      kind: "weekly",
      rules: [{ days: ["mon"], open: "9:00", close: "17:00" }],
    }).success).toBe(false);
  });

  it("rejects open === close as ambiguous", () => {
    // 24 hours, or closed? The author has to say which.
    const r = hoursSchema.safeParse({
      kind: "weekly",
      rules: [{ days: ["mon"], open: "09:00", close: "09:00" }],
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain("same time");
  });

  it("rejects two rules that overlap on one day", () => {
    const r = hoursSchema.safeParse({
      kind: "weekly",
      rules: [
        { days: ["mon"], open: "09:00", close: "14:00" },
        { days: ["mon"], open: "13:00", close: "22:00" },
      ],
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain("overlap");
  });

  it("accepts a split shift that does not touch", () => {
    expect(hoursSchema.safeParse({
      kind: "weekly",
      rules: [
        { days: ["mon"], open: "11:00", close: "14:00" },
        { days: ["mon"], open: "18:00", close: "22:00" },
      ],
    }).success).toBe(true);
  });

  it("normalises a past-midnight close past 1440", () => {
    const hours = parse({
      kind: "weekly",
      rules: [{ days: ["fri"], open: "17:00", close: "02:00" }],
    });
    if (hours.kind !== "weekly") throw new Error("wrong kind");
    expect(hours.rules[0]?.closeMins).toBe(26 * 60);
  });
});

describe("isOpenAt", () => {
  const bar = parse({
    kind: "weekly",
    rules: [{ days: ["fri", "sat"], open: "17:00", close: "02:00" }],
  });

  it.each([
    ["fri", "16:59", "closed"],
    ["fri", "17:00", "open"],
    ["fri", "23:00", "open"],
    ["sat", "00:30", "open"],
    ["sat", "01:59", "closing-soon"],
    ["sat", "02:00", "closed"],
    ["sat", "10:00", "closed"],
    ["sun", "00:30", "open"],
    ["sun", "03:00", "closed"],
    ["mon", "20:00", "closed"],
  ] as const)("a Fri/Sat 17:00–02:00 bar is %s %s → %s", (day, time, expected) => {
    expect(isOpenAt(bar, at(day, time))).toBe(expected);
  });

  it("is open at Saturday 00:30 because Friday's rule has not closed", () => {
    // The past-midnight case, called out on its own because it is the one
    // piece of arithmetic here that is easy to get wrong and easy to miss.
    expect(isOpenAt(bar, at("sat", "00:30"))).toBe("open");
  });

  it("says closing-soon only inside the threshold", () => {
    const cafe = parse({
      kind: "weekly",
      rules: [{ days: ["mon"], open: "08:00", close: "17:00" }],
    });
    const boundary = 17 * 60 - CLOSING_SOON_MINS;
    expect(isOpenAt(cafe, { day: 0, mins: boundary - 1 })).toBe("open");
    expect(isOpenAt(cafe, { day: 0, mins: boundary })).toBe("closing-soon");
    expect(isOpenAt(cafe, { day: 0, mins: 17 * 60 })).toBe("closed");
  });

  it("treats an absent day as closed without anyone saying so", () => {
    const weekdays = parse({
      kind: "weekly",
      rules: [{ days: ["mon", "tue", "wed", "thu", "fri"], open: "08:00", close: "17:00" }],
    });
    expect(isOpenAt(weekdays, at("sat", "12:00"))).toBe("closed");
  });

  it("is always open when kind is always", () => {
    const always = parse({ kind: "always" });
    expect(isOpenAt(always, at("sun", "04:00"))).toBe("open");
  });

  it("reports unknown rather than guessing", () => {
    const unknown = parse({ kind: "unknown", why: "no published hours" });
    expect(isOpenAt(unknown, at("mon", "12:00"))).toBe("unknown");
  });

  it("returns a defined state across a full 7 × 24 sweep", () => {
    for (let day = 0; day < 7; day += 1) {
      for (let hour = 0; hour < 24; hour += 1) {
        expect(["open", "closing-soon", "closed", "unknown"]).toContain(
          isOpenAt(bar, { day, mins: hour * 60 }),
        );
      }
    }
  });
});

describe("nextChangeAt", () => {
  const cafe = parse({
    kind: "weekly",
    rules: [{ days: ["mon", "tue"], open: "08:00", close: "17:00" }],
  });

  it("counts down to closing while open", () => {
    expect(nextChangeAt(cafe, at("mon", "16:00"))).toEqual({ state: "closed", minsAway: 60 });
  });

  it("counts forward to the next opening while closed", () => {
    expect(nextChangeAt(cafe, at("mon", "18:00"))).toEqual({ state: "open", minsAway: 14 * 60 });
  });

  it("wraps around the week rather than returning a negative", () => {
    const { minsAway } = nextChangeAt(cafe, at("wed", "12:00")) ?? { minsAway: -1 };
    expect(minsAway).toBeGreaterThan(0);
    expect(minsAway).toBeLessThanOrEqual(7 * 1440);
  });

  it("returns null when there is nothing to change to", () => {
    expect(nextChangeAt(parse({ kind: "always" }), at("mon", "12:00"))).toBeNull();
  });
});

describe("phnomPenhNow", () => {
  it("reads Phnom Penh wall-clock time from a UTC instant", () => {
    // 2026-08-29T05:00:00Z is 12:00 on Saturday in Phnom Penh.
    const now = phnomPenhNow(new Date("2026-08-29T05:00:00Z"));
    expect(now.mins).toBe(12 * 60);
    expect(now.day).toBe(5);
    expect(now.isoDate).toBe("2026-08-29");
  });

  it("gives the same answer regardless of the viewer's timezone", () => {
    // The point of the fixed offset: someone deciding from Bangkok or on a
    // phone with a wrong clock still gets Phnom Penh hours (D34).
    const instant = new Date("2026-08-29T18:30:00Z");
    expect(phnomPenhNow(instant)).toEqual(phnomPenhNow(new Date(instant.getTime())));
  });

  it("rolls the date forward for a UTC evening", () => {
    // 18:00Z on the 29th is 01:00 on the 30th in Phnom Penh.
    const now = phnomPenhNow(new Date("2026-08-29T18:00:00Z"));
    expect(now.isoDate).toBe("2026-08-30");
    expect(now.mins).toBe(60);
    expect(now.day).toBe(6);
  });
});

describe("holidays", () => {
  it("finds a holiday by date", () => {
    expect(holidayOn("2026-04-14")?.name).toBe("Khmer New Year");
  });

  it("returns nothing for an ordinary day", () => {
    expect(holidayOn("2026-08-29")).toBeUndefined();
  });

  it("knows when it has no dates for a year, so the UI can stay quiet", () => {
    expect(coversYear("2026-01-01")).toBe(true);
    expect(coversYear("2031-01-01")).toBe(false);
  });
});
