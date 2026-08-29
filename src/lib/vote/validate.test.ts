import { describe, expect, it } from "vitest";

import { isValidRoomId, parseMarks } from "@/lib/vote/validate";

/**
 * The validation boundary. This route is unauthenticated and is the only
 * mutation surface in the project, so what it refuses matters more than what it
 * accepts.
 */
describe("isValidRoomId", () => {
  it("accepts a 128-bit url-safe id", () => {
    expect(isValidRoomId("a".repeat(22))).toBe(true);
    expect(isValidRoomId("Ab3-_xY9zQ12345678")).toBe(true);
  });

  it("refuses anything short enough to guess", () => {
    // The id IS the authorisation, so a short one is not a cosmetic problem.
    expect(isValidRoomId("short")).toBe(false);
    expect(isValidRoomId("a".repeat(15))).toBe(false);
  });

  it("refuses path and query characters", () => {
    for (const bad of ["../../etc", "a/b".padEnd(20, "x"), "a?b".padEnd(20, "x"), "a b".padEnd(20, "x")]) {
      expect(isValidRoomId(bad), bad).toBe(false);
    }
  });

  it("refuses an absurdly long id", () => {
    expect(isValidRoomId("a".repeat(129))).toBe(false);
  });
});

describe("parseMarks", () => {
  it("accepts the three marks and nothing else", () => {
    expect(parseMarks({ a: "yes", b: "maybe", c: "no" })).toEqual({
      a: "yes",
      b: "maybe",
      c: "no",
    });
    expect(parseMarks({ a: "definitely" })).toBeNull();
    expect(parseMarks({ a: 1 })).toBeNull();
    expect(parseMarks({ a: null })).toBeNull();
  });

  it("accepts an empty object — 'I looked and marked nothing' is a real state", () => {
    expect(parseMarks({})).toEqual({});
  });

  it("refuses arrays and primitives", () => {
    expect(parseMarks([])).toBeNull();
    expect(parseMarks("yes")).toBeNull();
    expect(parseMarks(null)).toBeNull();
  });

  it("refuses an implausible number of candidates", () => {
    const many = Object.fromEntries(
      Array.from({ length: 65 }, (_, i) => [`spot-${i}`, "yes"]),
    );
    expect(parseMarks(many)).toBeNull();
  });

  it("refuses an over-long spot id", () => {
    expect(parseMarks({ ["x".repeat(65)]: "yes" })).toBeNull();
  });
});
