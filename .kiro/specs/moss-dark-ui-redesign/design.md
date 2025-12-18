# Design Document

## Overview

This design document outlines the implementation of the Moss Dark UI redesign for the Add Expense and Card Optimizer Simulator pages. The redesign transforms the current interface into a cleaner, more focused experience through progressive disclosure patterns, a unified dark theme with moss-green accents, and responsive layouts optimized for mobile, tablet, and desktop devices.

The design leverages React components with Tailwind CSS for styling, implements collapsible sections using Radix UI primitives, and maintains all existing functionality while dramatically reducing visual clutter. The implementation will create reusable design tokens, update existing components, and introduce new collapsible section components.

## Architecture

### Component Hierarchy

```
Pages
├── AddExpense
│   ├── PageHeader
│   ├── MerchantDetailsCard (with progressive disclosure)
│   ├── TransactionDetailsCard (with progressive disclosure)
│   └── PaymentDetailsCard (with progressive disclosure)
│
└── CardOptimizerSimulator
    ├── PageHeader
    ├── TransactionInputCard (reuses form sections)
    ├── MilesCurrencySelector
    └── CardComparisonChart
        └── CardBarRow[] (sorted by reward value)
```

### Design System Structure

```
src/styles/
├── design-tokens.css          # CSS custom properties for colors, spacing, typography
└── moss-dark-theme.css        # Theme-specific overrides

src/components/
├── ui/
│   ├── collapsible-section.tsx    # New: Progressive disclosure component
│   ├── moss-card.tsx              # New: Styled card with Moss Dark theme
│   └── moss-input.tsx             # New: Styled input with Moss Dark theme
│
└── expense/form/sections/
    ├── MerchantDetailsSection.tsx     # Updated with collapsible fields
    ├── TransactionDetailsSection.tsx  # Updated with collapsible fields
    └── PaymentDetailsSection.tsx      # Updated with collapsible fields
```

### State Management

- Form state continues to use React Hook Form
- Collapsible section state managed locally with useState
- No changes to existing data flow or submission logic
- Progressive disclosure state persists within session (optional enhancement)

## Components and Interfaces

### 1. Design Tokens (CSS Custom Properties)

```typescript
// design-tokens.css
:root {
  /* Colors */
  --color-bg: #0B0B0D;
  --color-card-bg: #16171A;
  --color-surface: #1F2024;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-track: rgba(255, 255, 255, 0.07);
  
  --color-text: #F5F5F7;
  --color-text-secondary: #8E8E93;
  --color-text-muted: #6B6B70;
  
  --color-accent: #A3B18A;
  --color-accent-glow: rgba(163, 177, 138, 0.33);
  --color-accent-subtle: rgba(163, 177, 138, 0.15);
  
  --color-danger: #E66A6A;
  
  /* Spacing */
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
  
  /* Border Radius */
  --radius-card: 20px;
  --radius-input: 14px;
  --radius-pill: 9999px;
  
  /* Shadows */
  --shadow-card-mobile: 0 4px 16px rgba(0, 0, 0, 0.35);
  --shadow-card-desktop: 0 8px 24px rgba(0, 0, 0, 0.45);
  
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

### 2. CollapsibleSection Component

```typescript
// src/components/ui/collapsible-section.tsx

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
          color: 'var(--color-accent)',
          paddingTop: 'var(--space-sm)',
        }}
      >
        <span>{isOpen ? trigger.replace('Show', 'Hide').replace('Add', 'Hide') : trigger}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-150',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      
      <div
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

### 3. MossCard Component

```typescript
// src/components/ui/moss-card.tsx

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
        padding: 'var(--space-lg)',
      }}
    >
      {children}
    </div>
  );
};

// CSS for moss-card
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
//     box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
//   }
// }
```

### 4. MossInput Component

```typescript
// src/components/ui/moss-input.tsx

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
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          width: '100%',
        }}
        {...props}
      />
    );
  }
);

MossInput.displayName = 'MossInput';

// CSS for moss-input
// .moss-input::placeholder {
//   color: var(--color-text-muted);
// }
//
// .moss-input:focus {
//   outline: none;
//   border-color: var(--color-accent);
//   box-shadow: 0 0 0 2px var(--color-accent-subtle);
// }
```

### 5. Updated MerchantDetailsSection

```typescript
// Updated src/components/expense/form/sections/MerchantDetailsSection.tsx

interface MerchantDetailsSectionProps {
  onSelectMCC: (mcc: MerchantCategoryCode) => void;
  selectedMCC?: MerchantCategoryCode | null;
  minimal?: boolean; // New prop for progressive disclosure
}

export const MerchantDetailsSection: React.FC<MerchantDetailsSectionProps> = ({ 
  onSelectMCC, 
  selectedMCC,
  minimal = true, // Default to minimal view
}) => {
  // ... existing logic ...

  return (
    <MossCard>
      <h2 className="section-header">Merchant Details</h2>
      
      {/* Essential fields - always visible */}
      <div className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="merchantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Merchant Name</FormLabel>
              <FormControl>
                <MossInput placeholder="Enter merchant name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <OnlineMerchantToggle />
        
        <MerchantCategorySelect 
          selectedMCC={selectedMCC}
          onSelectMCC={onSelectMCC}
        />
      </div>
      
      {/* Optional fields - collapsible */}
      {minimal && (
        <CollapsibleSection trigger="Add more merchant details ›">
          <div className="space-y-4">
            {!isOnline && (
              <FormField
                control={form.control}
                name="merchantAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merchant Address</FormLabel>
                    <FormControl>
                      <MossInput placeholder="Enter merchant address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="merchantNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional merchant information" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CollapsibleSection>
      )}
    </MossCard>
  );
};
```

### 6. CardBarRow Component (Updated)

```typescript
// Updated src/components/simulator/CardBarRow.tsx

interface CardBarRowProps {
  cardName: string;
  rewardValue: number;
  maxRewardValue: number;
  currency: string;
  isBest: boolean;
}

export const CardBarRow: React.FC<CardBarRowProps> = ({
  cardName,
  rewardValue,
  maxRewardValue,
  currency,
  isBest,
}) => {
  const percentage = (rewardValue / maxRewardValue) * 100;

  return (
    <div
      className={cn(
        'card-bar-row',
        isBest && 'card-bar-row-best'
      )}
      style={{
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-input)',
        backgroundColor: 'var(--color-surface)',
        marginBottom: 'var(--space-sm)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: 'var(--color-text)' }}>
            {cardName}
          </span>
          {isBest && (
            <span
              className="best-badge"
              style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--color-accent)',
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
                fontSize: 'var(--font-size-helper)',
                fontWeight: 600,
              }}
            >
              BEST
            </span>
          )}
        </div>
        <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
          {rewardValue.toFixed(2)} {currency}
        </span>
      </div>
      
      {/* Bar track */}
      <div
        className="bar-track"
        style={{
          height: '6px',
          backgroundColor: 'var(--color-track)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
        }}
      >
        {/* Bar fill */}
        <div
          className={cn('bar-fill', isBest && 'bar-fill-best')}
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: 'var(--color-accent)',
            borderRadius: 'var(--radius-pill)',
            transition: 'width var(--duration-normal) var(--transition-smooth)',
          }}
        />
      </div>
    </div>
  );
};

// CSS for best card glow effect
// .card-bar-row-best {
//   box-shadow: 0 0 12px var(--color-accent-glow);
// }
```

## Data Models

### Design Token Configuration

```typescript
// src/styles/types.ts

export interface DesignTokens {
  colors: {
    bg: string;
    cardBg: string;
    surface: string;
    border: string;
    track: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
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
  };
  borderRadius: {
    card: string;
    input: string;
    pill: string;
  };
  shadows: {
    cardMobile: string;
    cardDesktop: string;
  };
  motion: {
    transitionSmooth: string;
    durationFast: string;
    durationNormal: string;
  };
}
```

### Collapsible Section State

```typescript
// src/components/ui/collapsible-section.tsx

interface CollapsibleState {
  isOpen: boolean;
  hasBeenOpened: boolean; // Track if user has ever opened this section
}

// Optional: Persist state in sessionStorage
const STORAGE_KEY_PREFIX = 'collapsible-section-';

function useCollapsibleState(id: string, defaultOpen: boolean = false) {
  const storageKey = `${STORAGE_KEY_PREFIX}${id}`;
  
  const [state, setState] = useState<CollapsibleState>(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
    return { isOpen: defaultOpen, hasBeenOpened: defaultOpen };
  });

  const setIsOpen = (isOpen: boolean) => {
    const newState = {
      isOpen,
      hasBeenOpened: state.hasBeenOpened || isOpen,
    };
    setState(newState);
    sessionStorage.setItem(storageKey, JSON.stringify(newState));
  };

  return [state, setIsOpen] as const;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Progressive disclosure preserves form data

*For any* form with collapsible sections, when a user expands a section, enters data, then collapses and re-expands the section, the entered data should remain unchanged.

**Validates: Requirements 1.3, 1.5, 1.7**

### Property 2: Color token consistency

*For any* component using design tokens, all color values should reference CSS custom properties from the design token system, never hardcoded hex values.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

### Property 3: Typography scaling across breakpoints

*For any* text element, the font size should match the specified size for the current breakpoint (mobile, tablet, or desktop) as defined in the design tokens.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 4: Responsive layout constraints

*For any* screen width, the content container width should not exceed the maximum width defined for that breakpoint (mobile: 100% with padding, tablet: 480-600px, desktop: 640px).

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Card shadow consistency

*For any* card component, the shadow should match the mobile shadow on screens <1024px and desktop shadow on screens ≥1024px.

**Validates: Requirements 5.4, 5.5**

### Property 6: Input field styling consistency

*For any* input field, the background color, border-radius, padding, and font-size should match the values defined in the design token system.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 7: Toggle state visual feedback

*For any* toggle component, when the toggle state changes from inactive to active, the color should change from neutral gray to moss-green (#A3B18A).

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 8: Disclosure animation timing

*For any* collapsible section, when expanded or collapsed, the animation duration should be 150ms with the smooth cubic-bezier timing function.

**Validates: Requirements 8.4, 10.1**

### Property 9: Bar chart sorting order

*For any* set of card comparison results, the bars should be displayed in descending order by reward value, with the highest value first.

**Validates: Requirements 9.6**

### Property 10: Best card visual emphasis

*For any* card comparison where one card has the highest reward value, that card's row should have a glow shadow and "BEST" badge.

**Validates: Requirements 9.4, 9.5**

### Property 11: Spacing token consistency

*For any* component using spacing, all margin and padding values should use spacing tokens (xs, sm, md, lg, xl, 2xl) rather than arbitrary pixel values.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

### Property 12: Platform-specific font family

*For any* device, the font family should be SF Pro on iOS/iPadOS and Inter on web/desktop.

**Validates: Requirements 15.1, 15.2**

### Property 13: Minimum tap target size

*For any* interactive element on mobile, the tap target height should be at least 44px.

**Validates: Requirements 14.1**

### Property 14: Form submission preserves all data

*For any* form with collapsible sections containing data, when the form is submitted, all data from both visible and collapsed sections should be included in the submission.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

## Error Handling

### Design Token Loading Errors

- If CSS custom properties fail to load, provide fallback values inline
- Log warning to console but don't block rendering
- Gracefully degrade to default Tailwind theme

### Collapsible Section Errors

- If animation fails, immediately show/hide content without transition
- If sessionStorage is unavailable, use in-memory state only
- Ensure collapsed sections don't break form validation

### Responsive Layout Errors

- If window.matchMedia is unavailable, default to mobile layout
- Ensure content is always accessible regardless of viewport size
- Test with browser zoom levels 50%-200%

### Form Data Persistence

- Validate that collapsed sections don't lose data on re-render
- Ensure form submission includes all fields regardless of visibility
- Test with React Strict Mode to catch state issues

## Testing Strategy

### Unit Testing

Unit tests will verify individual component behavior and styling:

- **Design Token Tests**: Verify CSS custom properties are correctly defined and accessible
- **CollapsibleSection Tests**: Test open/close state, animation triggers, data persistence
- **MossCard Tests**: Verify styling props, hover effects, shadow application
- **MossInput Tests**: Test focus states, placeholder styling, value changes
- **CardBarRow Tests**: Verify percentage calculations, best card detection, sorting

### Property-Based Testing

Property-based tests will verify universal correctness properties using fast-check library (minimum 100 iterations per test):

- **Property 1 Test**: Generate random form data, expand/collapse sections, verify data preservation
- **Property 2 Test**: Parse all component styles, verify no hardcoded colors outside design tokens
- **Property 3 Test**: Generate random viewport widths, verify font sizes match breakpoint rules
- **Property 4 Test**: Generate random viewport widths, verify container max-width constraints
- **Property 5 Test**: Generate random viewport widths, verify correct shadow application
- **Property 6 Test**: Generate random input components, verify consistent styling
- **Property 7 Test**: Generate random toggle states, verify color changes
- **Property 8 Test**: Measure animation duration, verify 150ms timing
- **Property 9 Test**: Generate random card results, verify descending sort order
- **Property 10 Test**: Generate random card results, verify best card has glow and badge
- **Property 11 Test**: Parse all component styles, verify spacing uses tokens
- **Property 12 Test**: Mock different user agents, verify correct font family
- **Property 13 Test**: Generate random interactive elements, verify minimum tap target size
- **Property 14 Test**: Generate random form data in collapsed sections, verify submission includes all data

### Visual Regression Testing

- Capture screenshots at mobile (375px), tablet (768px), and desktop (1440px) widths
- Compare before/after screenshots for each page
- Verify color accuracy, spacing, and typography rendering
- Test in light and dark mode (if applicable)

### Integration Testing

- Test complete user flows: filling form, expanding sections, submitting
- Verify simulator calculations work with new UI
- Test keyboard navigation through collapsible sections
- Verify form validation works with progressive disclosure

### Accessibility Testing

- Verify ARIA labels on collapsible sections
- Test keyboard navigation (Tab, Enter, Space)
- Verify focus indicators are visible
- Test with screen readers (VoiceOver, NVDA)
- Verify color contrast ratios meet WCAG AA standards

### Responsive Testing

- Test on actual devices: iPhone, iPad, desktop browsers
- Verify touch interactions on mobile
- Test with different browser zoom levels
- Verify layout doesn't break at edge case widths (320px, 2560px)

### Performance Testing

- Measure animation frame rates (should maintain 60fps)
- Verify no layout thrashing during expand/collapse
- Test with large numbers of form fields
- Measure initial render time impact
