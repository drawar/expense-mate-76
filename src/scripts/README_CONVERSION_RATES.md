# Conversion Rates Seeding Script

## Overview

The `seedConversionRates.ts` script populates the database with initial conversion rates between reward currencies and airline miles programs. This enables the Card Optimizer Simulator to compare rewards across different credit cards by converting them to a common miles currency.

## Conversion Rates Included

The script seeds conversion rates for the following reward currencies:

### Premium Transferable Points Programs (1:1 transfers)
- **Citi ThankYou Points** (US & Singapore)
- **American Express Membership Rewards** (US, Canada, Singapore)
- **Chase Ultimate Rewards** (US)
- **Capital One Miles** (US, Canada)
- **Bilt Rewards Points** (US)
- **Wells Fargo Autograph Points** (US)
- **Bank of America Premium Rewards Points** (US)
- **TD Rewards Points** (Canada)
- **RBC Avion Points** (Canada)
- **HSBC Rewards Points** (Global)
- **UOB PRVI Miles** (Singapore)

### Hotel Points Programs (Variable transfers)
- **Marriott Bonvoy Points** (3:1 ratio - 3 points = 1 mile)
- **Hilton Honors Points** (10:1 ratio - 10 points = 1 mile)

### Bank Points Programs (Variable transfers)
- **DBS Points** (Singapore) (2.5:1 ratio)
- **OCBC$** (Singapore) (2.5:1 ratio)

## Supported Miles Programs

All reward currencies can be converted to these airline miles programs:
- **KrisFlyer** (Singapore Airlines)
- **AsiaMiles** (Cathay Pacific)
- **Avios** (British Airways)
- **FlyingBlue** (Air France-KLM)
- **Aeroplan** (Air Canada)
- **Velocity** (Virgin Australia)

## Usage

### Prerequisites
1. Ensure you have a Supabase project set up
2. Run the conversion rates migration: `20251128000000_create_conversion_rates.sql`
3. Be authenticated in your application (the script uses the Supabase client)

### Running the Script

```bash
npx tsx src/scripts/seedConversionRates.ts
```

### Expected Output

```
Starting conversion rate seeding...
Seeding 90 conversion rates...
✓ Conversion rates seeded successfully!
  - 15 reward currencies
  - 90 total conversion rates

Verification:
  - Loaded 15 reward currencies from database

Seeding complete!
```

## How Conversion Rates Work

### 1:1 Transfer Ratio
Most premium credit card programs offer 1:1 transfers to airline partners:
- 1,000 Citi ThankYou Points → 1,000 KrisFlyer Miles
- 1,000 Amex Membership Rewards → 1,000 Aeroplan Miles

### Variable Transfer Ratios
Some programs have different ratios:
- **Marriott Bonvoy**: 3:1 (3,000 Bonvoy Points → 1,000 airline miles)
- **Hilton Honors**: 10:1 (10,000 Honors Points → 1,000 airline miles)
- **DBS/OCBC**: 2.5:1 (2,500 points → 1,000 airline miles)

## Updating Conversion Rates

After seeding, you can update conversion rates through:
1. **Settings UI**: Use the ConversionRateManager component in the application
2. **Direct Database**: Update the `conversion_rates` table
3. **Re-run Script**: The script uses `upsert` so it's safe to run multiple times

## Adding New Reward Currencies

To add a new reward currency:

1. Edit `src/scripts/seedConversionRates.ts`
2. Add a new entry to the `INITIAL_CONVERSION_RATES` array:

```typescript
{
  rewardCurrency: "Your New Rewards Program",
  rates: {
    KrisFlyer: 1.0,      // Set appropriate conversion rate
    AsiaMiles: 1.0,
    Avios: 1.0,
    FlyingBlue: 1.0,
    Aeroplan: 1.0,
    Velocity: 1.0,
  },
}
```

3. Re-run the seeding script

## Notes

- Conversion rates are based on standard transfer ratios as of 2024
- Some programs offer promotional bonuses (e.g., 1:1.25) but we use standard rates
- The script is idempotent - safe to run multiple times
- Existing rates will be updated, not duplicated
- All rates must be positive numbers (enforced by database constraint)

## Troubleshooting

### "Not authenticated" Error
Make sure you're logged into the application before running the script. The script uses the Supabase client which requires authentication.

### "Failed to update conversion rate" Error
Check that:
1. The conversion_rates table exists (run migration)
2. RLS policies are properly configured
3. You have the necessary permissions

### Verification Failed
If the verification shows fewer currencies than expected:
- Check the console for specific error messages
- Verify database connectivity
- Check RLS policies allow reading conversion_rates
