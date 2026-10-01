/**
 * Get a YYYY-MM-DD key from a date using the browser's LOCAL timezone
 * (not a naive slice of the raw UTC ISO string). Promoted from
 * TransactionTable.tsx's original fix for the same class of bug.
 *
 * Use this — not `date.slice(0, 10)` / `date.split("T")[0]` — anywhere a
 * transaction needs to be bucketed into a calendar day. A real-time entry
 * made in the evening (local time) rolls into the next UTC calendar day;
 * slicing the raw string reads that UTC day instead of the true local one.
 */
export function localDateKey(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
