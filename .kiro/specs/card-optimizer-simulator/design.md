# Design Document

## Overview

The Card Optimizer Simulator is a decision-support tool that helps users identify the optimal credit card for a given transaction by calculating and comparing potential rewards across all active payment methods. The feature reuses existing form components and reward calculation logic while introducing new components for multi-card comparison, currency conversion, and ranking visualization.

The simulator operates in a read-only simulation mode - it does not persist transactions or modify user data. It leverages the existing RewardService to ensure calculation consistency with the expense logging feature.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Simulator Page                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Transaction Input Form                        │  │
│  │  (Reused: MerchantDetailsSection,                    │  │
│  │           TransactionDetailsSection)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      Miles Currency Selector                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      Card Comparison Results                          │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Card Result Card (Ranked)                      │  │  │
│  │  │  - Card Info                                    │  │  │
│  │  │  - Native Rewards                               │  │  │
│  │  │  - Converted Miles                              │  │  │
│  │  │  - Breakdown Details                            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  RewardService   │  │ ConversionService│                │
│  │  (Existing)      │  │  (New)           │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer                                  │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  RuleRepository  │  │ ConversionRates  │                │
│  │  (Existing)      │  │  Table (New)     │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
CardOptimizerSimulator (Page)
├── SimulatorForm
│   ├── MerchantDetailsSection (Reused)
│   └── TransactionDetailsSection (Reused)
└── CardComparisonChart
    ├── ChartHeader
    │   ├── OliveIconCluster
    │   └── MilesCurrencySelector (Dropdown)
    ├── HorizontalBarChart
    │   └── CardBarRow (repeated for each active card, sorted)
    │       ├── CardLabel (left)
    │       ├── ProgressBar (center, moss-green gradient)
    │       ├── MilesValue (right)
    │       └── HoverTooltip (breakdown details)
    ├── EmptyState (when no active cards)
    └── ChartFooter (disclaimer text)
```

## Components and Interfaces

### New Components

#### 1. CardOptimizerSimulator (Page Component)

**Purpose**: Main page component that orchestrates the simulator functionality

**Props**: None (route-based page)

**State**:
- `transactionInput: SimulationInput | null` - Current transaction details
- `calculationResults: CardCalculationResult[]` - Results for all cards
- `selectedMilesCurrency: MilesCurrency` - Currently selected miles program
- `isCalculating: boolean` - Loading state during calculations
- `initializationStatus: 'idle' | 'loading' | 'success' | 'error'`

**Key Methods**:
- `handleTransactionChange(input: SimulationInput)` - Triggers recalculation when form changes
- `handleMilesCurrencyChange(currency: MilesCurrency)` - Updates conversion and re-ranks results
- `calculateAllCards()` - Orchestrates reward calculation for all active cards

#### 2. SimulatorForm

**Purpose**: Form component for transaction input (wraps reused sections)

**Props**:
- `onInputChange: (input: SimulationInput) => void`
- `initialValues?: Partial<SimulationInput>`

**State**:
- `selectedMCC: MerchantCategoryCode | null`
- `formValues: SimulationInput`

**Key Methods**:
- `handleFieldChange(field: string, value: any)` - Updates form state and triggers parent callback
- `validateInput(): boolean` - Validates required fields

#### 3. MilesCurrencySelector

**Purpose**: Compact single-line dropdown for choosing the target miles currency

**Props**:
- `value: MilesCurrency`
- `onChange: (currency: MilesCurrency) => void`
- `availableCurrencies: MilesCurrency[]`

**Rendering**: 
- Single-line compact dropdown with label "Miles currency:"
- Default selection: Aeroplan
- Options: KrisFlyer, Asia Miles, Avios, Flying Blue, Aeroplan, Velocity
- Selected item highlighted in moss-green (#a3b18a)
- Triggers re-conversion and re-ranking on selection change

#### 4. CardComparisonChart

**Purpose**: Full-width panel displaying horizontal bar chart of card comparisons

**Props**:
- `results: CardCalculationResult[]`
- `selectedMilesCurrency: MilesCurrency`
- `onMilesCurrencyChange: (currency: MilesCurrency) => void`
- `isLoading: boolean`

**Rendering**:
- Full-width dark/white panel (adapts to system theme)
- Chart header with olive icon cluster
- Embedded MilesCurrencySelector dropdown
- Horizontal bar chart with sorted rows
- Footer with disclaimer text

**Styling**:
- Background: Dark slate (#121417) or light mode equivalent
- Panel: Slightly lighter (#1a1e23)
- Text: Pure white (#f1f3f5) or dark mode equivalent
- Accents: Moss-green (#a3b18a)

#### 5. CardBarRow

**Purpose**: Single horizontal bar representing one card's earning potential

**Props**:
- `card: PaymentMethod`
- `calculation: CalculationResult`
- `convertedMiles: number | null`
- `conversionRate: number | null`
- `rank: number`
- `isTopRanked: boolean`
- `maxMiles: number` (for bar width scaling)

**Rendering**:

**Standard Row Format**:
```
[Card Name + Issuer]  [████████████████████████] [295 miles]
```

**Layout**:
- Left: Card name and issuer (e.g., "Citi Premier®")
- Center: Horizontal progress bar
  - Filled with moss-green gradient (#a3b18a)
  - Width proportional to converted miles value
  - Smooth gradient effect
- Right: Converted miles value (e.g., "295")

**Top-Ranked Card Special Treatment**:
- Moss-green glow ring around entire row
- "#1 Best Option" badge on right side
- Slightly thicker bar (2-3px more height)

**No Conversion Available Case**:
- Row appears faded/grayed out
- Text: "— No conversion available"
- Bar area grayed out or empty
- Positioned below all cards with valid conversions

**Hover Tooltip**:
Displays detailed breakdown on hover:
```
Citi Premier®
Native: 372 ThankYou Points
Conversion: 2.0 → 1.0
186 KrisFlyer Miles
Tier: Grocery bonus applied (4x)
Remaining monthly cap: $900
```

**Tooltip Contents**:
- Base points
- Bonus points
- Total points in native currency
- Reward currency name
- Conversion rate used
- Tier or cap information
- Contactless/online bonuses if applicable

#### 6. ConversionRateManager (Settings Component)

**Purpose**: Admin interface for managing conversion rates

**Props**: None (standalone settings page or modal)

**State**:
- `conversionRates: ConversionRateMatrix`
- `editingCell: { rewardCurrency: string, milesCurrency: string } | null`
- `isSaving: boolean`

**Key Methods**:
- `loadConversionRates()` - Fetches current rates from database
- `updateRate(rewardCurrency: string, milesCurrency: string, rate: number)` - Updates a single rate
- `saveRates()` - Persists changes to database

### Reused Components

- `MerchantDetailsSection` - Merchant name, address, category, online status
- `TransactionDetailsSection` - Date, amount, currency, contactless status
- `MerchantAddressSelect` - Autocomplete for merchant addresses
- `MerchantCategorySelect` - MCC code selector

## Data Models

### New Types

```typescript
// Simulation input (similar to Transaction but without payment method)
export interface SimulationInput {
  merchantName: string;
  merchantAddress?: string;
  mcc?: string;
  isOnline: boolean;
  amount: number;
  currency: Currency;
  convertedAmount?: number;
  convertedCurrency?: Currency;
  isContactless: boolean;
  date: Date;
}

// Miles currency options
export type MilesCurrency = 
  | 'KrisFlyer'
  | 'AsiaMiles'
  | 'Avios'
  | 'FlyingBlue'
  | 'Aeroplan'
  | 'Velocity';

// Card calculation result with conversion
export interface CardCalculationResult {
  paymentMethod: PaymentMethod;
  calculation: CalculationResult;
  convertedMiles: number | null;
  conversionRate: number | null;
  rank: number;
}

// Conversion rate matrix
export interface ConversionRateMatrix {
  [rewardCurrency: string]: {
    [milesCurrency in MilesCurrency]?: number;
  };
}

// Database model for conversion rates
export interface DbConversionRate {
  id: string;
  reward_currency: string;
  miles_currency: string;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

// Visual theme colors
export interface ChartTheme {
  background: string;        // Dark slate (#121417) or light equivalent
  panel: string;             // Slightly lighter (#1a1e23)
  text: string;              // Pure white (#f1f3f5) or dark equivalent
  accent: string;            // Moss-green (#a3b18a)
  accentGradient: string;    // Moss-green gradient for bars
  fadedText: string;         // For "no conversion" rows
  glowColor: string;         // Moss-green glow for top card
}
```

### Database Schema

#### New Table: `conversion_rates`

```sql
CREATE TABLE conversion_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reward_currency TEXT NOT NULL,
  miles_currency TEXT NOT NULL,
  conversion_rate DECIMAL(10, 4) NOT NULL CHECK (conversion_rate > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reward_currency, miles_currency)
);

-- Index for fast lookups
CREATE INDEX idx_conversion_rates_lookup 
ON conversion_rates(reward_currency, miles_currency);

-- RLS policies
ALTER TABLE conversion_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversion rates are viewable by authenticated users"
ON conversion_rates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Conversion rates are editable by authenticated users"
ON conversion_rates FOR ALL
TO authenticated
USING (true);
```

## Services

### ConversionService (New)

**Purpose**: Manages currency conversion logic and rate retrieval

**Methods**:

```typescript
class ConversionService {
  /**
   * Convert reward points to miles currency
   */
  async convertToMiles(
    points: number,
    rewardCurrency: string,
    milesCurrency: MilesCurrency
  ): Promise<{ miles: number | null; rate: number | null }>;

  /**
   * Get conversion rate for a specific pair
   */
  async getConversionRate(
    rewardCurrency: string,
    milesCurrency: MilesCurrency
  ): Promise<number | null>;

  /**
   * Get all conversion rates for a reward currency
   */
  async getConversionRatesForRewardCurrency(
    rewardCurrency: string
  ): Promise<Partial<Record<MilesCurrency, number>>>;

  /**
   * Get all conversion rates (for management UI)
   */
  async getAllConversionRates(): Promise<ConversionRateMatrix>;

  /**
   * Update a conversion rate
   */
  async updateConversionRate(
    rewardCurrency: string,
    milesCurrency: MilesCurrency,
    rate: number
  ): Promise<void>;

  /**
   * Batch update conversion rates
   */
  async batchUpdateConversionRates(
    updates: Array<{
      rewardCurrency: string;
      milesCurrency: MilesCurrency;
      rate: number;
    }>
  ): Promise<void>;
}
```

**Implementation Notes**:
- Uses Supabase client for database operations
- Implements caching for frequently accessed rates
- Handles missing rates gracefully (returns null)
- Validates rate values (must be positive)

### SimulatorService (New)

**Purpose**: Orchestrates multi-card reward calculations

**Methods**:

```typescript
class SimulatorService {
  constructor(
    private rewardService: RewardService,
    private conversionService: ConversionService
  ) {}

  /**
   * Calculate rewards for all active payment methods
   */
  async simulateAllCards(
    input: SimulationInput,
    paymentMethods: PaymentMethod[],
    milesCurrency: MilesCurrency
  ): Promise<CardCalculationResult[]>;

  /**
   * Calculate rewards for a single card
   */
  async simulateSingleCard(
    input: SimulationInput,
    paymentMethod: PaymentMethod,
    milesCurrency: MilesCurrency
  ): Promise<CardCalculationResult>;

  /**
   * Rank results by converted miles value
   */
  rankResults(results: CardCalculationResult[]): CardCalculationResult[];

  /**
   * Get monthly spending for a payment method
   */
  async getMonthlySpending(
    paymentMethodId: string,
    date: Date
  ): Promise<number>;
}
```

**Implementation Notes**:
- Calls RewardService.calculateRewards for each card
- Handles errors per-card (doesn't fail entire calculation)
- Retrieves monthly spending from transaction history
- Applies conversion rates via ConversionService
- Ranks results with null conversions at the end

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Calculation consistency

*For any* valid simulation input and payment method, the reward calculation result should be identical to the result from the expense logging feature given the same inputs.
**Validates: Requirements 2.2**

### Property 2: Conversion determinism

*For any* reward points value, reward currency, and miles currency with a defined conversion rate, converting the points should always yield the same miles value.
**Validates: Requirements 3.2**

### Property 3: Ranking monotonicity

*For any* two cards A and B, if card A has more converted miles than card B, then card A should be ranked higher than card B in the results list.
**Validates: Requirements 4.1**

### Property 4: Conversion rate positivity

*For any* conversion rate stored in the system, the rate value should be greater than zero.
**Validates: Requirements 6.2**

### Property 5: Missing conversion handling

*For any* card with a reward currency that has no conversion rate to the selected miles currency, the card should appear in results with a null converted miles value and be ranked after all cards with valid conversions.
**Validates: Requirements 3.3, 4.3**

### Property 6: Monthly spending consideration

*For any* card with tiered rewards or monthly caps, the calculation should reflect the current monthly spending state when determining applicable tiers and remaining capacity.
**Validates: Requirements 7.2, 7.3**

### Property 7: Form validation consistency

*For any* input field in the simulator form, the validation rules should match those of the expense logging form for the same field.
**Validates: Requirements 9.3**

### Property 8: Active card filtering

*For any* set of payment methods, only those with active=true should be included in the simulation calculations.
**Validates: Requirements 2.1**

### Property 9: Currency conversion application

*For any* foreign currency transaction with a converted amount, the reward calculation should use the converted amount rather than the original transaction amount.
**Validates: Requirements 8.3**

### Property 10: Re-ranking on currency change

*For any* set of calculation results, changing the selected miles currency should trigger re-conversion and re-ranking of all results.
**Validates: Requirements 3.5, 4.5**

### Property 11: Bar width proportionality

*For any* two cards A and B in the chart, if card A has twice the converted miles of card B, then card A's bar width should be twice that of card B's bar width.
**Validates: Requirements 4.1**

### Property 12: Top-ranked visual distinction

*For any* set of calculation results with at least one valid conversion, the card with the highest converted miles value should have a glow effect and "#1 Best Option" badge applied.
**Validates: Requirements 4.4, 11.3**

## Error Handling

### Error Categories

1. **Initialization Errors**
   - Reward system initialization failure
   - No active payment methods
   - Database connection issues
   - **Handling**: Display error message with retry button, prevent form interaction

2. **Calculation Errors**
   - Individual card calculation failure
   - Rule repository errors
   - Monthly spending retrieval failure
   - **Handling**: Show error for specific card, continue with other cards

3. **Conversion Errors**
   - Missing conversion rate
   - Invalid conversion rate value
   - Database query failure
   - **Handling**: Display original currency value with "no conversion available" message

4. **Validation Errors**
   - Missing required fields
   - Invalid amount values
   - Invalid currency selection
   - **Handling**: Inline form validation messages, prevent calculation

5. **Data Persistence Errors** (Conversion Rate Management)
   - Failed to save conversion rate
   - Concurrent modification conflicts
   - **Handling**: Display error toast, allow retry

### Error Recovery Strategies

- **Graceful Degradation**: Show partial results when some calculations fail
- **Retry Logic**: Provide retry buttons for initialization and save operations
- **Fallback Values**: Use zero monthly spending if retrieval fails
- **User Feedback**: Clear error messages explaining what went wrong and how to proceed

## Testing Strategy

### Unit Tests

1. **ConversionService Tests**
   - Test conversion calculation with valid rates
   - Test handling of missing rates (returns null)
   - Test rate validation (rejects negative/zero values)
   - Test batch update operations

2. **SimulatorService Tests**
   - Test single card simulation
   - Test multi-card simulation with mixed success/failure
   - Test ranking logic with various converted values
   - Test ranking with null conversions
   - Test monthly spending retrieval

3. **Component Tests**
   - Test MilesCurrencySelector rendering and selection
   - Test CardResultCard display with various calculation states
   - Test CardComparisonResults sorting and rendering
   - Test form validation in SimulatorForm

### Property-Based Tests

Property-based tests will use **fast-check** library for TypeScript, configured to run a minimum of 100 iterations per test. Each test must include a comment tag in the format: `**Feature: card-optimizer-simulator, Property {number}: {property_text}**`

1. **Property 1: Calculation consistency**
   - Generate random simulation inputs
   - Calculate via simulator and expense form paths
   - Assert results are identical

2. **Property 2: Conversion determinism**
   - Generate random points, currencies, and rates
   - Convert multiple times
   - Assert all conversions yield same result

3. **Property 3: Ranking monotonicity**
   - Generate random card results with various converted miles
   - Rank results
   - Assert higher miles always rank higher

4. **Property 4: Conversion rate positivity**
   - Generate random conversion rate updates
   - Attempt to save
   - Assert only positive rates are accepted

5. **Property 5: Missing conversion handling**
   - Generate card results with some missing conversions
   - Rank results
   - Assert null conversions appear last

6. **Property 6: Monthly spending consideration**
   - Generate random monthly spending values
   - Calculate rewards with tiered/capped rules
   - Assert correct tier/cap is applied

7. **Property 7: Form validation consistency**
   - Generate random form inputs
   - Validate in both simulator and expense forms
   - Assert validation results match

8. **Property 8: Active card filtering**
   - Generate payment methods with mixed active states
   - Run simulation
   - Assert only active cards appear in results

9. **Property 9: Currency conversion application**
   - Generate foreign currency transactions with converted amounts
   - Calculate rewards
   - Assert converted amount is used in calculation

10. **Property 10: Re-ranking on currency change**
    - Generate calculation results
    - Change miles currency
    - Assert results are re-ranked correctly

### Integration Tests

1. **End-to-End Simulation Flow**
   - Load simulator page
   - Fill in transaction details
   - Verify calculations appear for all active cards
   - Change miles currency
   - Verify re-ranking occurs

2. **Conversion Rate Management Flow**
   - Open conversion rate manager
   - Update a rate
   - Save changes
   - Verify rate is persisted
   - Verify simulator uses new rate

3. **Error Handling Flow**
   - Simulate calculation failure for one card
   - Verify other cards still calculate
   - Verify error message appears for failed card

## Visual Design Specifications

### Color Palette

**Dark Mode (Default)**:
- Background: `#121417` (dark slate)
- Panel: `#1a1e23` (slightly lighter)
- Text: `#f1f3f5` (pure white)
- Accent: `#a3b18a` (moss-green)
- Accent Gradient: `linear-gradient(90deg, #a3b18a 0%, #b8c5a0 100%)`
- Faded Text: `#6b7280` (gray)
- Glow: `0 0 20px rgba(163, 177, 138, 0.5)` (moss-green glow)

**Light Mode**:
- Background: `#ffffff`
- Panel: `#f9fafb`
- Text: `#111827`
- Accent: `#6b8e23` (olive green)
- Accent Gradient: `linear-gradient(90deg, #6b8e23 0%, #7fa32e 100%)`
- Faded Text: `#9ca3af`
- Glow: `0 0 20px rgba(107, 142, 35, 0.3)`

### Typography

- Card Names: 14px, medium weight
- Miles Values: 16px, bold
- Tooltip Text: 12px, regular
- Header: 18px, semibold
- Footer: 11px, regular, muted

### Spacing

- Chart padding: 24px
- Row height: 48px
- Row gap: 12px
- Bar height: 24px (standard), 28px (top-ranked)
- Bar border radius: 4px
- Glow ring offset: 4px

### Bar Chart Specifications

**Bar Width Calculation**:
```typescript
const barWidth = (convertedMiles / maxMiles) * 100; // percentage
```

**Bar Styling**:
- Standard bar: `height: 24px`, moss-green gradient
- Top-ranked bar: `height: 28px`, moss-green gradient, glow effect
- No conversion bar: `height: 24px`, gray background, no gradient

**Glow Effect** (Top-Ranked Card):
```css
box-shadow: 0 0 20px rgba(163, 177, 138, 0.5);
border: 2px solid #a3b18a;
border-radius: 8px;
```

### Icons

- Olive icon cluster: Small decorative icons in header (leaf, sparkle, etc.)
- "#1 Best Option" badge: Circular badge with "#1" text
- Dropdown arrow: Chevron down icon

### Animations

- Bar fill: Smooth 0.5s ease-out animation on load
- Hover tooltip: Fade in 0.2s
- Currency change: Bars re-animate with 0.3s transition
- Glow pulse: Subtle 2s infinite pulse on top card

## Implementation Notes

### Performance Considerations

1. **Parallel Calculations**: Calculate rewards for all cards in parallel using `Promise.all()`
2. **Conversion Rate Caching**: Cache conversion rates in memory to avoid repeated database queries
3. **Debounced Form Updates**: Debounce form input changes to avoid excessive recalculations
4. **Lazy Loading**: Load conversion rate manager only when accessed
5. **Bar Animation**: Use CSS transforms for smooth bar animations
6. **Tooltip Rendering**: Render tooltips on-demand to reduce DOM nodes

### Reusability

1. **Form Components**: Reuse existing form sections without modification
2. **Reward Logic**: Use existing RewardService without changes
3. **Validation**: Import and reuse validation schemas from expense form
4. **Styling**: Use existing UI component library (shadcn/ui) for consistency
5. **Theme System**: Leverage existing dark/light mode system

### Accessibility

1. **Keyboard Navigation**: Full keyboard support for dropdown and chart
2. **Screen Readers**: Proper ARIA labels for bars and values
3. **Color Contrast**: Ensure WCAG AA compliance for all text
4. **Focus Indicators**: Visible focus states for interactive elements
5. **Tooltip Alternatives**: Ensure tooltip info is accessible via keyboard

### Future Enhancements

1. **Comparison History**: Save and recall previous simulations
2. **Bulk Simulation**: Upload CSV of transactions for batch optimization
3. **Recommendation Engine**: Suggest best card based on spending patterns
4. **Custom Conversion Rates**: Allow users to set personal valuation rates
5. **Export Results**: Download comparison results as PDF or image
6. **Animated Transitions**: Smooth transitions when cards re-rank
7. **Mobile Optimization**: Responsive bar chart for mobile devices
