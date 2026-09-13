# User Guide — Recording Non-Obvious Expenses

Conventions for tracking money flows that don't map cleanly to "I bought a thing
for myself." Follow these to keep the dashboard's category totals, budget bars,
and points math honest.

## Loan Repayment (You're the Borrower)

You're paying back an outstanding loan in monthly installments (SGD or any
currency).

**Log each payment as a normal transaction:**

| Field          | Value                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Merchant       | A merchant named after the lender (e.g., "Nhung Loan Payback" or the institutional name)                  |
| MCC            | `6012` (Financial Institutions — Merchandise, Services) or `6011` (Cash Disbursement)                     |
| Category       | **Financial Services** (parent: Financial & Other)                                                        |
| Payment method | The bank/cash account the payment leaves from — not a credit card, unless you're actually paying via card |
| Currency       | Transaction currency = payment currency = SGD (no FX)                                                     |

The dashboard displays in your `display_currency` (CAD).
`CurrencyService.convert()` handles SGD → CAD for aggregation automatically.

### Design nuance

Debt principal isn't strictly "spending" — it's a balance-sheet transfer. Some
people separate:

- **Interest portion** → real cost of borrowing, treat as spend
- **Principal portion** → savings-in-reverse, could be excluded

**Recommendation:** log the full monthly amount as one transaction. Simple; the
interest-vs-principal distortion in your Financial & Other bucket is smaller
than the friction of splitting every month.

## Parents' Credit-Card Spending (Card Given for Their Use)

You've given credit cards to your parents to spend abroad. The card is legally
yours; the spending is not.

**Core rule:** these outflows should _not_ pollute your personal spending
categories (Groceries, Dining Out, etc.). They're gifts.

**Setup:**

1. **Create a dedicated payment method** in Settings — e.g.,
   `Amex Cobalt — Parents (VN)`. Same underlying card and network, but a
   separate logical account for reporting.
2. **Log every parents' transaction under this PM.**
3. **`user_category` = "Gifts & Donations"** (parent: Financial & Other) —
   regardless of what they actually bought.
4. **Merchant** = the real merchant if you know it (useful for pattern
   analysis), or a generic "Parents — Vietnam" placeholder if you're entering
   totals from your statement.

### FX handling

Parents likely spend in VND while your statement shows CAD or SGD. Same pattern
as any cross-currency transaction:

| Field                               | Value                                                         |
| ----------------------------------- | ------------------------------------------------------------- |
| `amount + currency`                 | What the merchant charged (VND)                               |
| `payment_amount + payment_currency` | What your statement shows in your card's currency             |
| Points                              | Calculated on `payment_amount` per the `convertedAmount` rule |

### What you get

- ✅ Personal spending categories stay clean (not polluted by parents'
  consumption)
- ✅ Points and card fees still tracked accurately (they were on your card)
- ✅ Total "given to parents" easy to see — filter dashboard by that PM
- ✅ Gifts & Donations category reflects reality: this really is a gift/subsidy

### Budget implication

Your **Gifts & Donations** allocation (Financial & Other) will inflate:

- Regular monthly commitment → bump your Financial & Other % in Settings →
  Budget Allocations
- Occasional/lumpy → accept the periodic spike; the "% used" indicator will
  surface it

### Anti-patterns

- ❌ Do NOT log parents' spending under Groceries/Dining/etc. — destroys the
  meaning of those categories.
- ❌ Do NOT create matching "income" rows to "cancel out" parents' spend —
  inflates both spend and income artificially.
- ❌ Do NOT split individual transactions — too much bookkeeping for marginal
  value.

---

## Related Conventions

### Reimbursements — Fronting a Shared Cost

Someone repays you later for a shared meal, hotel, or event you paid for.

- **Preferred:** set `reimbursement_amount` on the original transaction.
  Category totals and budget bars automatically show only _your_ share.
- **Cross-currency:** convert their payment to the transaction's currency at the
  received-day rate; enter that amount in `reimbursement_amount`.
- **Rule of thumb:** _"was this reversing a cost I fronted, or was it real
  income?"_ Reversing → net it. Real income → log as an income row.

### Employer Expense Reimbursement (Lump-Sum for Multiple Transactions)

Your employer aggregates several claims into one deposit weeks later.

- **Preferred:** split the lump sum across the individual transactions it covers
  via `reimbursement_amount` on each. Delete the income row.
- **Tagging aid:** put `claim:2026-Q3-Liftoff` in the notes of transactions when
  you submit; reconcile when the deposit lands.

### Loans You Made to Someone Else, Repaid in Installments

You fronted the money (e.g., bought an air ticket for a friend); they pay you
back over time.

- **Preferred:** accumulate `reimbursement_amount` on the original transaction
  as each installment arrives. Do NOT create a new income row per installment.
- Once fully repaid: transaction's net = $0. Category cleanly nets out.

### Real Income (Log as Income Row, not Reimbursement)

Reserve income rows for genuine inflows:

- Salary / paycheck
- Side gig / freelance
- Selling something (sofa, camera, etc.)
- Merchant refunds from strangers
- Bonus, tax refund
- Gift you received
- Loan repayment where **you** were the lender for a general cash loan (not a
  specific purchase you fronted)

### Salary / Paycheck Naming

Any income row whose **name contains "salary" or "paycheck"** (case-insensitive)
triggers the **pay-period budget** feature:

- Snapshots the pay period `[startDate, startDate + frequency]` into
  `budget_periods`
- Computes per-category dollar budgets from your saved Budget Allocations %s
- Displays on the dashboard's Budget & Spending card

**Choose the right frequency:**

- `biweekly` — every 14 days (26/yr, drifts across months). Use for true 14-day
  cycles.
- `semi_monthly` — twice a month, aligned to 15th + last-day-of-month (24/yr,
  doesn't drift). Use for standard "mid-month + end-of-month" salary schedules.
- `monthly` — every calendar month.
- `one_off` — bonuses, refunds, single events. Never virtualizes, never triggers
  a budget period.

### Cross-Currency Purchases

Standard pattern for any transaction where the merchant charges in currency A
but your card statement shows currency B:

| Field                               | Value                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `amount + currency`                 | Merchant charge (e.g., CAD $60)                                               |
| `payment_amount + payment_currency` | Statement amount post-FX (e.g., SGD $55.35)                                   |
| Points                              | Always calculated on `payment_amount`, per CLAUDE.md's `convertedAmount` rule |

### Merchant Naming

- **Chain merchants:** bare brand name only (`Din Tai Fung`, `Nemesis Coffee`).
  Address / display_location differentiates branches — never encode the branch
  in the name.
- **Aggregators / semantic distinctions:** parentheticals are fine when they
  represent genuinely different payees or contexts (`Chexy (Broadview)` =
  different landlord than `Chexy (Enerpro Systems)`;
  `Wander Kitchen & Bar (YYC)` = airport-specific outlet). Rule: paren must
  carry info that `address` can't.
- **Duplicates by name are OK** — the autocomplete and every UI surface
  differentiates them by `display_location`.

### Budget Allocations

- Set percentages in Settings → Budget Allocations. Savings comes off the top
  (pay-yourself-first); the six spending parents share the rest.
- **Sum of (savings + spending) must ≤ 100.** The Save button disables when the
  total is invalid.
- Changes apply to your **next** salary income; the currently-active period also
  re-snapshots immediately (mid-cycle edits take effect right away).
- Historical periods stay frozen at whatever %s they were computed with —
  analytics of past periods are honest.
