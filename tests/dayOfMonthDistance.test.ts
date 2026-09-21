/**
 * Table tests for dayOfMonthDistance — circular day-of-month distance
 * used by the recurring-merchant reminder proximity filter.
 */

import { describe, it, expect } from "@jest/globals";
import { dayOfMonthDistance } from "../src/utils/dates/formatters";

interface Case {
  name: string;
  a: number;
  b: number;
  monthLen: number;
  expected: number;
}

const CASES: Case[] = [
  { name: "same day = 0", a: 1, b: 1, monthLen: 30, expected: 0 },
  { name: "mid-month same day = 0", a: 15, b: 15, monthLen: 31, expected: 0 },
  { name: "adjacent days = 1", a: 15, b: 16, monthLen: 30, expected: 1 },
  { name: "off by 3 within month", a: 10, b: 13, monthLen: 30, expected: 3 },
  {
    name: "wrap from end to start (day 30 vs day 2 in 30-day month = 2)",
    a: 30,
    b: 2,
    monthLen: 30,
    expected: 2,
  },
  {
    name: "wrap in Feb: day 31 clamps to 28, vs day 1 = 1 (Feb 28 → Mar 1)",
    a: 31,
    b: 1,
    monthLen: 28,
    expected: 1,
  },
  {
    name: "wrap in 30-day month: day 31 clamps to 30, vs day 2 = 2",
    a: 31,
    b: 2,
    monthLen: 30,
    expected: 2,
  },
  {
    name: "beyond halfway prefers the wrap direction",
    a: 5,
    b: 25,
    monthLen: 30,
    expected: 10,
  },
  {
    name: "commutative: swap a and b, same distance",
    a: 25,
    b: 5,
    monthLen: 30,
    expected: 10,
  },
  {
    name: "clamps a=0 to 1",
    a: 0,
    b: 1,
    monthLen: 30,
    expected: 0,
  },
];

describe("dayOfMonthDistance", () => {
  it.each(CASES)("$name", ({ a, b, monthLen, expected }) => {
    expect(dayOfMonthDistance(a, b, monthLen)).toBe(expected);
  });
});
