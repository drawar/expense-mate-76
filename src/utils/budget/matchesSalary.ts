/**
 * Predicate: does this income row's name look like a salary/paycheck?
 *
 * Case-insensitive substring match on "salary" or "paycheck". Substring rather
 * than word-boundary so "Liftoff Salary", "Google Paycheck", and "Salary
 * top-up" all match. Empty/nullish names return false.
 */
export function matchesSalary(name?: string | null): boolean {
  const n = (name ?? "").trim().toLowerCase();
  if (!n) return false;
  return n.includes("salary") || n.includes("paycheck");
}
