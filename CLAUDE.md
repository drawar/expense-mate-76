# Claude Code Instructions for Clairo

## CRITICAL RULES - READ BEFORE ANY POINTS CALCULATION WORK

### Points Calculation Currency Rule

**ALWAYS use `convertedAmount` (not `amount`) when calculating points if
transaction currency differs from payment currency.**

When a transaction currency != payment currency:

- `amount` = original transaction amount (e.g., $100 USD)
- `convertedAmount` = amount in card/statement currency (e.g., $135 SGD)
- **Points are calculated on `convertedAmount` (the statement amount)**

Example:

- Transaction: $100 USD at foreign merchant
- Card currency: SGD
- Statement shows: $135 SGD (after FX conversion)
- Points earned: Based on $135 SGD, NOT $100 USD

The `getCalculationAmount()` method in `RewardService.ts` handles this:

```typescript
return input.convertedAmount ?? input.amount;
```

**Never change this to use `amount` when `convertedAmount` is available.**

### When Fixing Points Calculation Bugs

1. Check if the issue is related to currency conversion
2. Verify `convertedAmount` is being passed to `calculateRewards()`
3. Verify `convertedAmount` is used (not `amount`) in the calculation
4. Run `tests/RewardService.convertedAmount.test.ts` to verify

### Key Files for Points Calculation

- `src/core/rewards/RewardService.ts` - Main calculation logic
- `src/core/rewards/types.ts` - CalculationInput interface with documentation
- `src/hooks/useExpenseForm.ts` - UI hook that calls simulateRewards
- `src/core/storage/StorageService.ts` - Saves transactions with payment amounts
- `src/core/currency/SimulatorService.ts` - Multi-card simulation
