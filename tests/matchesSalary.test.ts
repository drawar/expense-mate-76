import { matchesSalary } from "../src/utils/budget/matchesSalary";

describe("matchesSalary", () => {
  const cases: Array<[string | null | undefined, boolean]> = [
    ["Salary", true],
    ["salary", true],
    [" Salary ", true],
    ["Liftoff Salary", true],
    ["PAYCHECK", true],
    ["Google Paycheck", true],
    ["Salary top-up", true],
    ["salaryrelated", true], // documented substring semantics
    ["", false],
    ["   ", false],
    [null, false],
    [undefined, false],
    ["Bonus", false],
    ["Refund", false],
    ["Interest", false],
    ["Freelance income", false],
  ];

  it.each(cases)("matchesSalary(%p) === %p", (input, expected) => {
    expect(matchesSalary(input)).toBe(expected);
  });
});
