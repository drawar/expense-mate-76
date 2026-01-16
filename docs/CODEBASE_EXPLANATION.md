# Codebase Explanation

This document explains key concepts, systems, and design decisions in the
expense-mate codebase.

---

## Card Type ID System

### Overview

The `card_type_id` is a unique identifier used to associate reward rules, points
balances, and transactions with specific credit cards. It's generated from the
payment method's `issuer` and `name` fields.

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

**Examples:** | Issuer | Name | Generated card_type_id |
|--------|------|------------------------| | Citibank | Rewards Visa Signature |
`citibank-rewards-visa-signature` | | Citi | Rewards Visa Signature |
`citi-rewards-visa-signature` | | American Express | Platinum Card |
`american-express-platinum-card` | | Chase | Sapphire Reserve |
`chase-sapphire-reserve` |

### Where card_type_id is Used

#### 1. Stored in Database (Static)

| Table             | Column         | When Stored                                                     |
| ----------------- | -------------- | --------------------------------------------------------------- |
| `points_balances` | `card_type_id` | When creating a card-specific balance via StartingBalanceDialog |
| `reward_rules`    | `card_type_id` | When creating reward rules for a card                           |
| `card_catalog`    | `card_type_id` | Seed data for universal card definitions                        |

#### 2. Generated at Runtime (Dynamic)

| Location                                                        | Purpose                                                        |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| `PointsBalanceService.getEarnedFromTransactionsCurrentPeriod()` | Filter payment methods by card type to calculate earned points |
| `RewardService.calculateRewards()`                              | Match reward rules to payment method                           |
| `StartingBalanceDialog`                                         | Build list of card types for selection                         |

### The Mismatch Problem

The `card_type_id` is **stored once** when you create a balance or rule, but
**regenerated dynamically** when calculating. If the payment method's `issuer`
or `name` changes, the stored value becomes stale.

**Example scenario:**

| Step | Action                                              | Result                                    |
| ---- | --------------------------------------------------- | ----------------------------------------- |
| 1    | Create balance with issuer="Citibank"               | Stored: `citibank-rewards-visa-signature` |
| 2    | User edits payment method, changes issuer to "Citi" | Payment method updated                    |
| 3    | System calculates earned points                     | Generated: `citi-rewards-visa-signature`  |
| 4    | Compare stored vs generated                         | `citibank-...` ≠ `citi-...`               |
| 5    | Result                                              | **No match → 0 earned points displayed**  |

**Fix:** When changing a payment method's issuer or name, you must also update:

- `points_balances.card_type_id`
- `reward_rules.card_type_id`
- `card_catalog.card_type_id` (if applicable)

### Key Files

| File                                              | Purpose                                       |
| ------------------------------------------------- | --------------------------------------------- |
| `src/core/rewards/CardTypeIdService.ts`           | Centralized ID generation service             |
| `src/core/points/PointsBalanceService.ts`         | Balance calculations, earned points filtering |
| `src/components/points/StartingBalanceDialog.tsx` | UI for creating card-specific balances        |
| `src/core/rewards/RewardService.ts`               | Reward calculation using card_type_id         |

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

| Type          | Description                                    | `card_type_id`      |
| ------------- | ---------------------------------------------- | ------------------- |
| Pooled        | All cards earning a currency share one balance | `NULL`              |
| Card-Specific | Each card has its own separate balance         | Set to generated ID |

**Use case for card-specific:** Programs like Citi ThankYou Points where
different cards (Prestige, Rewards+) have separate point pools that can't be
combined.

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

| Field                | Description                                     |
| -------------------- | ----------------------------------------------- |
| `card_type_id`       | Unique identifier (matches generated ID format) |
| `issuer`             | Card issuer name (e.g., "American Express")     |
| `name`               | Card name (e.g., "Platinum Card")               |
| `default_image_url`  | Card face image URL                             |
| `reward_currency_id` | Associated reward currency                      |
| `region`             | Geographic region (SG, CA, US, etc.)            |

### card_type_id in card_catalog

The `card_type_id` in `card_catalog` is **manually set seed data** - it's NOT
dynamically generated. However, it should follow the same format that
`CardTypeIdService.generateCardTypeId()` would produce from the `issuer` and
`name` fields.

**Example card_catalog entry:**

```sql
INSERT INTO card_catalog (card_type_id, issuer, name, ...)
VALUES ('citi-rewards-visa-signature', 'Citi', 'Rewards Visa Signature', ...);
```

The `card_type_id` value `'citi-rewards-visa-signature'` matches what
`generateCardTypeId('Citi', 'Rewards Visa Signature')` would produce.

### The Lookup Chain

When displaying a card-specific balance, the system looks up card info:

```
points_balances.card_type_id  →  card_catalog.card_type_id  →  card name & image
```

**Flow:**

1. `points_balances` has `card_type_id = 'citi-rewards-visa-signature'`
2. System queries
   `card_catalog WHERE card_type_id = 'citi-rewards-visa-signature'`
3. If found: displays `cardTypeName` and `cardImageUrl` from catalog
4. If NOT found: card name and image won't display

### Mismatch Scenarios

| Scenario | points_balances.card_type_id      | card_catalog.card_type_id     | Result                            |
| -------- | --------------------------------- | ----------------------------- | --------------------------------- |
| Match    | `citi-rewards-visa-signature`     | `citi-rewards-visa-signature` | Card name & image display         |
| Mismatch | `citibank-rewards-visa-signature` | `citi-rewards-visa-signature` | No card name/image (lookup fails) |
| Missing  | `citi-rewards-visa-signature`     | (entry doesn't exist)         | No card name/image                |

### Fetching Card Info for Balances

When displaying card-specific balances, the system fetches card name and image
from `card_catalog`:

```typescript
// PointsBalanceService.getAllBalances()
const { data: catalogData } = await supabase
  .from("card_catalog")
  .select("card_type_id, issuer, name, default_image_url")
  .in("card_type_id", cardTypeIds);

// Set on balance object
balance.cardTypeName = `${cardInfo.issuer} ${cardInfo.name}`;
balance.cardImageUrl = cardInfo.imageUrl;
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
