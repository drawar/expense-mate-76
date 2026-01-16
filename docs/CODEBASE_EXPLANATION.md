# Codebase Explanation

This document explains key concepts, systems, and design decisions in the
expense-mate codebase.

---

## Card Matching System

### Overview

The system uses **UUID foreign keys** to link reward rules and points balances
to cards. This replaces the legacy TEXT-based `card_type_id` which caused
mismatch problems when issuer/name changed.

### New Architecture (UUID-based)

| Table             | Old Column     | New Column          | Links To             |
| ----------------- | -------------- | ------------------- | -------------------- |
| `reward_rules`    | `card_type_id` | `card_catalog_id`   | `card_catalog.id`    |
| `points_balances` | `card_type_id` | `payment_method_id` | `payment_methods.id` |

### Rule Matching Flow

**New (Preferred):**

```
Transaction → PaymentMethod.card_catalog_id (UUID)
           → Match reward_rules.card_catalog_id (UUID)
           → Return matching rules
```

**Fallback (Backward Compatibility):**

```
Transaction → PaymentMethod
           → CardTypeIdService.generateCardTypeId(issuer, name)
           → "citi-rewards-visa-signature" (TEXT)
           → Match reward_rules.card_type_id (TEXT)
```

### Balance Lookup Flow

**New (Preferred):**

```
points_balances.payment_method_id → payment_methods.card_catalog_id → card_catalog → card info
```

**Fallback:**

```
points_balances.card_type_id → card_catalog.card_type_id → card info
```

### Why UUIDs Solve the Mismatch Problem

| Scenario                   | TEXT (card_type_id)        | UUID (card_catalog_id)      |
| -------------------------- | -------------------------- | --------------------------- |
| User renames issuer        | Stored ID becomes stale    | UUID unchanged, still works |
| Lookup by generated string | May not match stored value | N/A - UUID is immutable     |
| Foreign key integrity      | None (just a string)       | Database enforces validity  |

**Example:** User changes "Citibank" → "Citi"

- TEXT: Generated `citi-...` ≠ stored `citibank-...` → **No match**
- UUID: `card_catalog_id` unchanged → **Still matches**

---

## Legacy Card Type ID System (Deprecated)

> **Note:** This system is being phased out in favor of UUID foreign keys. Kept
> for backward compatibility during migration.

### Generation Logic

Located in `src/core/rewards/CardTypeIdService.ts`:

```typescript
generateCardTypeId(issuer: string, name: string): string {
  const normalizedIssuer = issuer.toLowerCase().trim().replace(/\s+/g, "-");
  const normalizedName = name.toLowerCase().trim().replace(/\s+/g, "-");
  return `${normalizedIssuer}-${normalizedName}`;
}
```

**Transformation rules:**

1. Convert to lowercase
2. Trim whitespace
3. Replace spaces with hyphens
4. Concatenate as `{issuer}-{name}`

### Key Files

| File                                              | Purpose                                          |
| ------------------------------------------------- | ------------------------------------------------ |
| `src/core/rewards/CardTypeIdService.ts`           | @deprecated - ID generation service              |
| `src/core/points/PointsBalanceService.ts`         | Balance calculations                             |
| `src/components/points/StartingBalanceDialog.tsx` | UI for creating card-specific balances           |
| `src/core/rewards/RewardService.ts`               | Reward calculation (prefers card_catalog_id now) |

---

## Points Balance System

### Hybrid Balance Mode

The points balance system uses a hybrid approach:

- **User sets:** Starting balance per currency (and optionally per card type)
- **System calculates:** Earned points from transactions
- **User records:** Manual adjustments, redemptions, transfers

### Balance Calculation Formula

```
Current Balance = Starting Balance
                + Earned from Transactions (current statement period)
                + Adjustments
                - Redemptions
                - Transfers Out
                + Transfers In
```

### Card-Specific vs Pooled Balances

| Type          | Description                                    | `payment_method_id` | `card_type_id` (legacy) |
| ------------- | ---------------------------------------------- | ------------------- | ----------------------- |
| Pooled        | All cards earning a currency share one balance | `NULL`              | `NULL`                  |
| Card-Specific | Each card has its own separate balance         | Set to UUID         | Set to TEXT ID          |

**Use case for card-specific:** Programs like Citi ThankYou Points where
different cards (Prestige, Rewards+) have separate point pools that can't be
combined.

**New schema:** Uses `payment_method_id` (UUID FK) instead of `card_type_id`
(TEXT). The UUID links to `payment_methods.id`, which has `card_catalog_id` for
card info lookup.

### Key Files

| File                                      | Purpose                                 |
| ----------------------------------------- | --------------------------------------- |
| `src/core/points/PointsBalanceService.ts` | All balance operations and calculations |
| `src/core/points/types.ts`                | TypeScript interfaces for points system |
| `src/hooks/points/usePointsBalances.ts`   | React hooks for balance data            |

---

## Card Catalog System

### Purpose

The `card_catalog` table contains universal credit card definitions shared
across all users. Users link their payment methods to catalog entries to inherit
card properties (images, reward currency, etc.).

### Key Fields

| Field                | Description                                        |
| -------------------- | -------------------------------------------------- |
| `id`                 | **Primary key (UUID)** - Used for FK relationships |
| `card_type_id`       | Legacy TEXT identifier (being phased out)          |
| `issuer`             | Card issuer name (e.g., "American Express")        |
| `name`               | Card name (e.g., "Platinum Card")                  |
| `default_image_url`  | Card face image URL                                |
| `reward_currency_id` | Associated reward currency                         |
| `region`             | Geographic region (SG, CA, US, etc.)               |

### Linking Hierarchy

```
payment_methods.card_catalog_id → card_catalog.id → card info (name, image, currency)
                                                  ↓
reward_rules.card_catalog_id ─────────────────────┘
```

**Key relationships:**

- `payment_methods.card_catalog_id` → `card_catalog.id` (card info)
- `reward_rules.card_catalog_id` → `card_catalog.id` (rule matching)
- `points_balances.payment_method_id` → `payment_methods.id` (balance → card)

### Fetching Card Info for Balances (New)

With the new schema, card info is fetched via the payment method:

```typescript
// New: via payment_method_id → payment_methods → card_catalog
const balance = await getBalance(rewardCurrencyId, paymentMethodId);
const paymentMethod = await getPaymentMethod(balance.paymentMethodId);
const cardInfo = await cardCatalog.getById(paymentMethod.cardCatalogId);

balance.cardTypeName = `${cardInfo.issuer} ${cardInfo.name}`;
balance.cardImageUrl = cardInfo.defaultImageUrl;
```

### Legacy Lookup (Deprecated)

The old TEXT-based lookup is kept for backward compatibility:

```typescript
// Legacy: via card_type_id TEXT match
const { data: catalogData } = await supabase
  .from("card_catalog")
  .select("card_type_id, issuer, name, default_image_url")
  .in("card_type_id", cardTypeIds);
```

### Key Files

| File                                                       | Purpose                   |
| ---------------------------------------------------------- | ------------------------- |
| `src/core/catalog/CardCatalogService.ts`                   | Card catalog operations   |
| `src/core/catalog/types.ts`                                | TypeScript interfaces     |
| `supabase/migrations/20251224000002_seed_card_catalog.sql` | Initial card catalog data |

---

## Points Calculation Currency Rule

> **CRITICAL:** Always use `convertedAmount` (not `amount`) when calculating
> points if transaction currency differs from payment currency.

When a transaction currency != payment currency:

- `amount` = original transaction amount (e.g., $100 USD)
- `convertedAmount` = amount in card/statement currency (e.g., $135 SGD)
- **Points are calculated on `convertedAmount` (the statement amount)**

The `getCalculationAmount()` method in `RewardService.ts` handles this:

```typescript
return input.convertedAmount ?? input.amount;
```

---

_Last updated: January 2026_
