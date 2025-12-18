# Design Document

## Overview

This design document outlines the implementation of accessibility and visual enhancements to the Moss Dark UI design system. Building upon the initial redesign, these enhancements focus on WCAG AA-compliant text contrast, a refined moss-green accent palette, improved visual hierarchy, and the introduction of an always-visible Reward Points Panel.

The implementation updates existing design tokens, refines component styling, and introduces a new RewardPointsPanel component. All changes maintain backward compatibility with the existing Moss Dark UI system while significantly improving accessibility and user experience.

## Architecture

### Updated Component Hierarchy

```
Pages
├── AddExpense
│   ├── PageHeader
│   ├── MerchantDetailsCard (with progressive disclosure)
│   ├── TransactionDetailsCard (with progressive disclosure)
│   ├── PaymentDetailsCard (with progressive disclosure)
│   └── RewardPointsPanel (NEW - always visible)
│
└── CardOptimizerSimulator
    ├── PageHeader
    ├── TransactionInputCard
    ├── MilesCurrencySelector
    └── CardComparisonChart
        └── CardBarRow[] (sorted by reward value)
```

### Design System Updates

```
src/styles/
├── design-tokens.css          # Updated with new color palette and spacing
└── moss-dark-theme.css        # Updated with enhanced styling

src/components/
├── ui/
│   ├── collapsible-section.tsx    # Updated with new accent colors
│   ├── moss-card.tsx              # Updated with new border and shadow
│   ├── moss-input.tsx             # Updated with new colors and borders
│   └── reward-points-panel.tsx    # NEW: Always-visible reward display
│
└── expense/form/sections/
    ├── MerchantDetailsSection.tsx     # Updated with new colors
    ├── TransactionDetailsSection.tsx  # Updated with new colors
    └── PaymentDetailsSection.tsx      # Updated with new colors
```

### State Management

- Reward points calculation continues to use existing RewardService
- RewardPointsPanel subscribes to reward calculation updates
- No changes to form state management
- Panel visibility is always true (not toggleable)

## Components and Interfaces

### 1. Updated Design Tokens

```typescript
// Updated design-tokens.css
:root {
  /* Colors - Updated for WCAG AA compliance */
  --color-bg: #0B0B0D;
  --color-card-bg: #161719;  /* Updated from #16171A */
  --color-surface: #1F2023;  /* Updated from #1F2024 */
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-subtle: rgba(255, 255, 255, 0.12);  /* NEW */
  --color-track: rgba(255, 255, 255, 0.07);
  
  /* Text Colors - WCAG AA Compliant */
  --color-text-primary: #F2F2F7;     /* Updated from #F5F5F7 */
  --color-text-secondary: #D1D1D6;   /* Updated from #8E8E93 */
  --color-text-tertiary: #A1A1A6;    /* NEW */
  --color-text-helper: #8E8E93;      /* Renamed from text-muted */
  --color-text-disabled: #3A3A3C;    /* NEW */
  
  /* Icon Colors */
  --color-icon-primary: #E5E5EA;     /* NEW */
  --color-icon-secondary: #A7A7AD;   /* NEW */
  
  /* Accent Colors - Updated Moss Green */
  --color-accent: #9CBF6E;           /* Updated from #A3B18A */
  --color-accent-soft: #B5C892;      /* NEW */
  --color-accent-glow: #9CBF6E55;    /* Updated from rgba(163, 177, 138, 0.33) */
  --color-accent-subtle: rgba(156, 191, 110, 0.15);  /* Updated */
  
  --color-danger: #E66A6A;
  
  /* Spacing - Standardized */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  
  /* Typography */
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica', 'Arial', sans-serif;
  --font-size-title-1: 32px;
  --font-size-title-2: 20px;
  --font-size-section-header: 16px;
  --font-size-body: 15px;
  --font-size-label: 13px;
  --font-size-helper: 11px;
  --font-weight-semibold: 600;
  
  /* Border Radius */
  --radius-card: 20px;
  --radius-input: 14px;
  --radius-pill: 18px;  /* Updated from 9999px for reward panel */
  --radius-pill-full: 9999px;
  
  /* Shadows - Enhanced */
  --shadow-card-mobile: 0 4px 16px rgba(0, 0, 0, 0.35);
  --shadow-card-desktop: 0 8px 24px rgba(0, 0, 0, 0.45);
  --shadow-card-lift: 0 12px 32px rgba(0, 0, 0, 0.5);  /* NEW */
  
  /* Motion */
  --transition-smooth: cubic-bezier(0.35, 0, 0.15, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
}

/* Tablet breakpoint */
@media (min-width: 768px) {
  :root {
    --font-size-title-1: 36px;
    --font-size-section-header: 18px;
    --font-size-body: 16px;
    --font-size-label: 14px;
    --font-size-helper: 12px;
  }
}

/* Desktop breakpoint */
@media (min-width: 1024px) {
  :root {
    --font-size-title-1: 40px;
  }
}

/* iOS/iPadOS font family override */
@supports (-webkit-touch-callout: none) {
  :root {
    --font-family-base: -apple-system, 'SF Pro Display', 'SF Pro Text', sans-serif;
  }
}
```

### 2. RewardPointsPanel Component (NEW)

```typescript
// src/components/ui/reward-points-panel.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface RewardPointsPanelProps {
  totalPoints: number;
  bonusPoints?: number;
  currency: string;
  className?: string;
}

export const RewardPointsPanel: React.FC<RewardPointsPanelProps> = ({
  totalPoints,
  bonusPoints = 0,
  currency,
  className,
}) => {
  return (
    <div
      className={cn('reward-points-panel', className)}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-pill)',
        padding: '12px 16px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
      }}
      role="status"
      aria-live="polite"
      aria-label="Reward points calculation"
    >
      {/* Icon */}
      <span
        style={{
          fontSize: '20px',
          color: 'var(--color-icon-primary)',
        }}
        aria-hidden="true"
      >
        💳
      </span>
      
      {/* Label */}
      <span
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-body)',
          fontWeight: 500,
        }}
      >
        Reward Points
      </span>
      
      {/* Total Points Badge */}
      <div
        className="points-badge"
        style={{
          backgroundColor: 'var(--color-accent-subtle)',
          border: '1px solid var(--color-accent)',
          borderRadius: 'var(--radius-pill-full)',
          padding: '6px 12px',
          color: 'var(--color-accent)',
          fontSize: 'var(--font-size-body)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {totalPoints.toFixed(0)} {currency}
      </div>
      
      {/* Bonus Points Badge (if applicable) */}
      {bonusPoints > 0 && (
        <div
          className="bonus-badge"
          style={{
            backgroundColor: 'var(--color-accent-subtle)',
            border: '1px solid var(--color-accent-soft)',
            borderRadius: 'var(--radius-pill-full)',
            padding: '6px 12px',
            color: 'var(--color-accent-soft)',
            fontSize: 'var(--font-size-label)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          +{bonusPoints.toFixed(0)} bonus
        </div>
      )}
    </div>
  );
};

// CSS for responsive behavior
// @media (max-width: 768px) {
//   .reward-points-panel {
//     flex-wrap: wrap;
//   }
//   
//   .points-badge, .bonus-badge {
//     font-size: 14px;
//     padding: 4px 10px;
//   }
// }
```

### 3. Updated MossCard Component

```typescript
// Updated src/components/ui/moss-card.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface MossCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const MossCard: React.FC<MossCardProps> = ({
  children,
  className,
  hover = false,
}) => {
  return (
    <div
      className={cn(
        'moss-card',
        hover && 'moss-card-hover',
        className
      )}
      style={{
        backgroundColor: 'var(--color-card-bg)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-xl)',  // Increased from space-lg
        border: '1px solid var(--color-border-subtle)',  // NEW
      }}
    >
      {children}
    </div>
  );
};

// Updated CSS for moss-card
// .moss-card {
//   box-shadow: var(--shadow-card-mobile);
// }
//
// @media (min-width: 1024px) {
//   .moss-card {
//     box-shadow: var(--shadow-card-desktop);
//   }
//   
//   .moss-card-hover {
//     transition: transform 150ms var(--transition-smooth), 
//                 box-shadow 150ms var(--transition-smooth);
//   }
//   
//   .moss-card-hover:hover {
//     transform: translateY(-2px);
//     box-shadow: var(--shadow-card-lift);
//   }
// }
```

### 4. Updated MossInput Component

```typescript
// Updated src/components/ui/moss-input.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface MossInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const MossInput = React.forwardRef<HTMLInputElement, MossInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn('moss-input', className)}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-input)',
          padding: '12px',
          fontSize: 'var(--font-size-body)',
          color: 'var(--color-text-primary)',  // Updated
          border: '1px solid var(--color-border-subtle)',  // Updated
          width: '100%',
          minHeight: '44px',  // NEW - ensures tap target size
        }}
        {...props}
      />
    );
  }
);

MossInput.displayName = 'MossInput';

// Updated CSS for moss-input
// .moss-input::placeholder {
//   color: var(--color-text-helper);
// }
//
// .moss-input:focus {
//   outline: none;
//   border-color: var(--color-accent);
//   box-shadow: 0 0 0 2px var(--color-accent-subtle);
// }
//
// .moss-input:disabled {
//   color: var(--color-text-disabled);
//   cursor: not-allowed;
// }
```

### 5. Updated CollapsibleSection Component

```typescript
// Updated src/components/ui/collapsible-section.tsx

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  trigger: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  trigger,
  children,
  defaultOpen = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('collapsible-section', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium transition-colors duration-150"
        style={{
          color: 'var(--color-accent)',  // Uses updated accent color
          paddingTop: 'var(--space-sm)',
          minHeight: '44px',  // NEW - ensures tap target size
        }}
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${trigger}`}
      >
        <span>{isOpen ? trigger.replace('Show', 'Hide').replace('Add', 'Hide') : trigger}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-150',
            isOpen && 'rotate-180'
          )}
          style={{
            color: 'var(--color-icon-secondary)',
            strokeWidth: 2.5,  // NEW - increased for visibility
          }}
        />
      </button>
      
      <div
        id={`collapsible-content-${trigger}`}
        className={cn(
          'overflow-hidden transition-all duration-150',
          isOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        )}
        style={{
          transitionTimingFunction: 'var(--transition-smooth)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
```

### 6. Updated AddExpense Page Integration

```typescript
// Updated src/pages/AddExpense.tsx (partial)

import { RewardPointsPanel } from '@/components/ui/reward-points-panel';

export const AddExpense: React.FC = () => {
  const [rewardPoints, setRewardPoints] = useState<{
    total: number;
    bonus: number;
    currency: string;
  }>({ total: 0, bonus: 0, currency: 'Points' });

  // ... existing form logic ...

  // Calculate rewards when form data changes
  useEffect(() => {
    if (selectedCard && amount && selectedMCC) {
      const calculation = rewardService.calculateRewards({
        cardId: selectedCard.id,
        amount,
        mcc: selectedMCC,
        // ... other transaction details
      });
      
      setRewardPoints({
        total: calculation.totalPoints,
        bonus: calculation.bonusPoints,
        currency: calculation.currency,
      });
    }
  }, [selectedCard, amount, selectedMCC]);

  return (
    <div className="add-expense-page">
      <PageHeader 
        title="Add Expense"
        subtitle="Record a new expense transaction"
      />
      
      <div className="form-sections" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <MerchantDetailsSection />
        <TransactionDetailsSection />
        <PaymentDetailsSection />
        
        {/* NEW: Always-visible Reward Points Panel */}
        <RewardPointsPanel
          totalPoints={rewardPoints.total}
          bonusPoints={rewardPoints.bonus}
          currency={rewardPoints.currency}
        />
      </div>
      
      <SubmitButton />
    </div>
  );
};
```

## Data Models

### Reward Points Display Data

```typescript
// src/types/rewards.ts

export interface RewardPointsDisplay {
  totalPoints: number;
  bonusPoints: number;
  basePoints: number;
  currency: string;
  breakdown?: {
    baseRate: number;
    bonusRate: number;
    conditions: string[];
  };
}
```

### Updated Design Token Types

```typescript
// Updated src/styles/types.ts

export interface DesignTokens {
  colors: {
    bg: string;
    cardBg: string;
    surface: string;
    border: string;
    borderSubtle: string;  // NEW
    track: string;
    textPrimary: string;   // Updated
    textSecondary: string; // Updated
    textTertiary: string;  // NEW
    textHelper: string;    // Renamed
    textDisabled: string;  // NEW
    iconPrimary: string;   // NEW
    iconSecondary: string; // NEW
    accent: string;
    accentSoft: string;    // NEW
    accentGlow: string;
    accentSubtle: string;
    danger: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  typography: {
    fontFamily: string;
    sizes: {
      title1: string;
      title2: string;
      sectionHeader: string;
      body: string;
      label: string;
      helper: string;
    };
    weights: {
      semibold: number;  // NEW
    };
  };
  borderRadius: {
    card: string;
    input: string;
    pill: string;
    pillFull: string;  // NEW
  };
  shadows: {
    cardMobile: string;
    cardDesktop: string;
    cardLift: string;  // NEW
  };
  motion: {
    transitionSmooth: string;
    durationFast: string;
    durationNormal: string;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Text contrast meets WCAG AA standards

*For any* text element, the contrast ratio between the text color and its background should be at least 4.5:1 for normal text.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Accent color consistency

*For any* interactive element (toggle, link, badge, hover state, focus state), the accent color should be #9CBF6E or its variants (#B5C892 for soft, #9CBF6E55 for glow).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

### Property 3: Section header styling consistency

*For any* section header, the font should be SF Pro/Inter with semibold weight, and header icons should use color #E5E5EA.

**Validates: Requirements 3.2, 3.3**

### Property 4: Card container styling consistency

*For any* card container, the background should be #161719, borders should be rgba(255,255,255,0.12), and shadows should be applied.

**Validates: Requirements 4.1, 4.3, 4.4**

### Property 5: Form field styling consistency

*For any* form field, the background should be #1F2023, border-radius should be 14px, placeholder color should be #8E8E93, label color should be #D1D1D6, and border should be rgba(255,255,255,0.12).

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 6: Minimum tap target size on mobile

*For any* interactive element on mobile viewports (<768px), the tap target height should be at least 44px.

**Validates: Requirements 5.6, 14.1 (from original spec)**

### Property 7: Icon color consistency

*For any* icon, the color should be #E5E5EA for primary icons or #A7A7AD for secondary icons, with stroke-width of at least 2.5px.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 8: Spacing token usage

*For any* element with margin or padding, the spacing value should match one of the defined tokens: 4px, 8px, 12px, 16px, 24px, or 32px.

**Validates: Requirements 8.1**

### Property 9: Reward Points Panel always visible

*For any* render of the Add Expense page, the Reward Points Panel should be present in the DOM, visible (not hidden), and not collapsible.

**Validates: Requirements 9.1, 9.12**

### Property 10: Reward Points Panel positioning

*For any* render of the Add Expense page, the Reward Points Panel should be positioned directly after the Payment Details section in the DOM.

**Validates: Requirements 9.2**

### Property 11: Reward Points Panel styling

*For any* Reward Points Panel, the container should have background #1F2023, border rgba(255,255,255,0.12), border-radius 18-22px, padding 12-16px, and full width.

**Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7**

### Property 12: Reward Points Panel badge styling

*For any* reward points badge in the panel, the color should be #9CBF6E, and bonus badges should display "+X bonus" format.

**Validates: Requirements 9.8, 9.9**

### Property 13: Reward Points Panel updates immediately

*For any* change in reward calculation inputs (card, amount, MCC), the Reward Points Panel should update within one render cycle.

**Validates: Requirements 9.10**

### Property 14: Responsive layout constraints

*For any* viewport width, the content should respect the maximum width constraints: mobile (100% with padding), tablet (480-600px), desktop (640px).

**Validates: Requirements 10.1, 10.5, 10.7**

## Error Handling

### Design Token Migration

- If old color tokens are still referenced, provide fallback to new tokens
- Log warnings for deprecated token usage
- Ensure graceful degradation if new tokens fail to load

### Reward Points Calculation Errors

- If reward calculation fails, display "Calculating..." in panel
- If no card is selected, display "Select a card to see rewards"
- If calculation returns invalid data, display "Unable to calculate rewards"
- Never hide the panel due to errors

### Contrast Validation Errors

- Log warnings if text contrast falls below 4.5:1
- Provide fallback colors that meet WCAG AA standards
- Test with browser accessibility tools during development

### Responsive Layout Errors

- Ensure panel wraps gracefully on narrow viewports
- Test with browser zoom levels 50%-200%
- Verify touch targets remain accessible at all sizes

## Testing Strategy

### Unit Testing

Unit tests will verify individual component behavior and styling:

- **Design Token Tests**: Verify new CSS custom properties are correctly defined
- **RewardPointsPanel Tests**: Test rendering, badge display, formatting
- **Updated Component Tests**: Verify MossCard, MossInput, CollapsibleSection use new tokens
- **Color Contrast Tests**: Verify all text colors meet WCAG AA standards

### Property-Based Testing

Property-based tests will verify universal correctness properties using fast-check library (minimum 100 iterations per test):

- **Property 1 Test**: Generate random text elements, verify contrast ratios meet 4.5:1
- **Property 2 Test**: Generate random interactive elements, verify accent color usage
- **Property 3 Test**: Generate random section headers, verify font and icon styling
- **Property 4 Test**: Generate random card containers, verify styling consistency
- **Property 5 Test**: Generate random form fields, verify styling consistency
- **Property 6 Test**: Generate random interactive elements on mobile, verify 44px minimum height
- **Property 7 Test**: Generate random icons, verify color and stroke-width
- **Property 8 Test**: Parse all component styles, verify spacing uses tokens
- **Property 9 Test**: Render Add Expense page, verify panel is always visible
- **Property 10 Test**: Render Add Expense page, verify panel positioning
- **Property 11 Test**: Generate random panel instances, verify styling
- **Property 12 Test**: Generate random reward values, verify badge styling and format
- **Property 13 Test**: Change reward inputs, verify panel updates immediately
- **Property 14 Test**: Generate random viewport widths, verify layout constraints

### Visual Regression Testing

- Capture screenshots at mobile (375px), tablet (768px), and desktop (1440px) widths
- Compare before/after for Add Expense page with Reward Points Panel
- Verify color accuracy of new palette
- Test contrast ratios with accessibility tools

### Integration Testing

- Test complete Add Expense flow with reward calculation
- Verify panel updates as user changes card, amount, or merchant
- Test with various reward calculation scenarios (base only, with bonus, zero rewards)
- Verify panel remains visible during form validation errors

### Accessibility Testing

- Verify WCAG AA contrast ratios with automated tools
- Test with screen readers (VoiceOver, NVDA)
- Verify ARIA labels on Reward Points Panel
- Test keyboard navigation
- Verify focus indicators are visible with new colors
- Test with color blindness simulators

### Responsive Testing

- Test Reward Points Panel on actual devices: iPhone, iPad, desktop browsers
- Verify panel wraps gracefully on narrow screens
- Test with different browser zoom levels
- Verify tap targets meet 44px minimum on mobile

### Performance Testing

- Measure reward calculation and panel update latency
- Verify no layout thrashing during panel updates
- Test with rapid input changes
- Measure initial render time impact of new panel

