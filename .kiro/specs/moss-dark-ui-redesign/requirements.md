# Requirements Document

## Introduction

This specification defines the redesign of the Add Expense and Card Optimizer Simulator pages to implement a unified "Moss Dark UI" design system. The redesign focuses on reducing visual clutter through progressive disclosure, implementing a cohesive dark theme with moss-green accents, and ensuring responsive behavior across mobile, tablet, and desktop platforms. The goal is to create a cleaner, more focused user experience while maintaining all existing functionality.

## Glossary

- **System**: The expense tracking and card optimization application
- **User**: A person interacting with the Add Expense or Card Optimizer Simulator pages
- **Progressive Disclosure**: A design pattern where optional or advanced fields are hidden by default and revealed on user request
- **Moss Dark UI**: The unified design system featuring dark backgrounds with moss-green (#A3B18A) accent colors
- **Collapsible Section**: A UI component that can be expanded or collapsed to show or hide content
- **Form Field**: An input element where users enter data (text input, selector, toggle, etc.)
- **Card Component**: A rounded container with background, padding, and shadow that groups related content
- **Merchant Details**: Information about where a transaction occurred (name, address, category, online status)
- **Transaction Details**: Core transaction information (amount, currency, date, reimbursement, contactless status)
- **Payment Details**: Information about the payment method used for a transaction
- **Simulator Input**: Transaction parameters entered to compare card rewards
- **Card Comparison**: Visual display showing reward calculations for multiple cards
- **Breakpoint**: Screen width threshold that triggers responsive layout changes (mobile: <768px, tablet: 768-1024px, desktop: >1024px)

## Requirements

### Requirement 1: Progressive Disclosure for Form Fields

**User Story:** As a user, I want optional and advanced fields hidden by default, so that I can focus on essential information without visual clutter.

#### Acceptance Criteria

1. WHEN a user views the Add Expense form THEN the System SHALL display only essential fields in the default view
2. WHEN a user views the Merchant Details section THEN the System SHALL hide merchant address and notes fields by default
3. WHEN a user taps "Add more merchant details" THEN the System SHALL expand to reveal merchant address and notes fields with a 150ms animation
4. WHEN a user views the Transaction Details section THEN the System SHALL hide reimbursement amount, contactless toggle, and additional metadata by default
5. WHEN a user taps "Show advanced fields" THEN the System SHALL expand to reveal reimbursement amount and contactless toggle with a 150ms animation
6. WHEN a user views the Payment Details section THEN the System SHALL hide card metadata and issuer notes by default
7. WHEN a user taps to expand Payment Details THEN the System SHALL reveal card last digits and issuer notes with a 150ms animation

### Requirement 2: Moss Dark UI Color System

**User Story:** As a user, I want a cohesive dark theme with moss-green accents, so that the interface is visually comfortable and aesthetically consistent.

#### Acceptance Criteria

1. WHEN the System renders any page THEN the System SHALL apply background color #0B0B0D to the app background
2. WHEN the System renders card components THEN the System SHALL apply background color #16171A with border-radius 20-24px
3. WHEN the System renders input fields THEN the System SHALL apply background color #1F2024 with border-radius 14px
4. WHEN the System renders borders and dividers THEN the System SHALL apply color rgba(255,255,255,0.08)
5. WHEN the System renders primary text THEN the System SHALL apply color #F5F5F7
6. WHEN the System renders secondary text THEN the System SHALL apply color #8E8E93
7. WHEN the System renders accent elements THEN the System SHALL apply moss-green color #A3B18A to toggles, disclosure chevrons, and links
8. WHEN the System renders active toggles or selected states THEN the System SHALL apply moss-green color #A3B18A

### Requirement 3: Typography System

**User Story:** As a user, I want clear, readable typography with appropriate sizing, so that I can easily scan and understand content.

#### Acceptance Criteria

1. WHEN the System renders page titles THEN the System SHALL display text at 32px on mobile, 36px on tablet, and 40px on desktop with semi-bold weight
2. WHEN the System renders section headers THEN the System SHALL display text at 16px on mobile, 18px on tablet and desktop with semibold weight
3. WHEN the System renders body text THEN the System SHALL display text at 15px on mobile and 16px on tablet and desktop with medium weight
4. WHEN the System renders form labels THEN the System SHALL display text at 13px on mobile and 14px on tablet and desktop
5. WHEN the System renders helper text THEN the System SHALL display text at 11-12px with muted color #6B6B70
6. WHEN the System renders text THEN the System SHALL apply line-height between 1.2 and 1.3 to reduce clutter

### Requirement 4: Responsive Layout System

**User Story:** As a user, I want the interface to adapt to my device screen size, so that I have an optimal experience on mobile, tablet, and desktop.

#### Acceptance Criteria

1. WHEN a user views the interface on mobile (width <768px) THEN the System SHALL render full-width cards with 16px side padding
2. WHEN a user views the interface on tablet (width 768-1024px) THEN the System SHALL render centered content with max-width 480-600px
3. WHEN a user views the interface on desktop (width >1024px) THEN the System SHALL render centered content with max-width 640px
4. WHEN a user views the interface on mobile THEN the System SHALL display all content in a single scrollable column
5. WHEN a user views the interface on tablet THEN the System SHALL display centered cards with margin on both sides
6. WHEN a user views the interface on desktop THEN the System SHALL enable hover states and keyboard shortcuts

### Requirement 5: Card Component Styling

**User Story:** As a user, I want form sections presented in clean, rounded cards, so that content is visually organized and easy to parse.

#### Acceptance Criteria

1. WHEN the System renders a card component THEN the System SHALL apply background color #16171A
2. WHEN the System renders a card component THEN the System SHALL apply border-radius 20-24px
3. WHEN the System renders a card component THEN the System SHALL apply padding 16-20px
4. WHEN the System renders a card on mobile THEN the System SHALL apply shadow 0 4px 16px rgba(0,0,0,0.35)
5. WHEN the System renders a card on desktop THEN the System SHALL apply shadow 0 8px 24px rgba(0,0,0,0.45)
6. WHEN a user hovers over an interactive card on desktop THEN the System SHALL apply a subtle lift effect with increased shadow

### Requirement 6: Form Field Styling

**User Story:** As a user, I want form fields that are clearly defined and easy to interact with, so that data entry is efficient and error-free.

#### Acceptance Criteria

1. WHEN the System renders an input field THEN the System SHALL apply background color #1F2024
2. WHEN the System renders an input field THEN the System SHALL apply border-radius 14px
3. WHEN the System renders an input field THEN the System SHALL apply padding 12px
4. WHEN the System renders an input field THEN the System SHALL apply font-size 15px
5. WHEN the System renders an input field THEN the System SHALL apply text color #F5F5F7
6. WHEN the System renders an input placeholder THEN the System SHALL apply color #6B6B70
7. WHEN the System renders a selector row THEN the System SHALL apply tap target height 44-48px with right-aligned chevron

### Requirement 7: Toggle Component Styling

**User Story:** As a user, I want toggles that clearly indicate their state, so that I understand whether options are enabled or disabled.

#### Acceptance Criteria

1. WHEN the System renders a toggle in active state THEN the System SHALL apply moss-green color #A3B18A
2. WHEN the System renders a toggle in inactive state THEN the System SHALL apply a neutral gray color
3. WHEN a user interacts with a toggle THEN the System SHALL provide immediate visual feedback with state change
4. WHEN the System renders toggles on mobile or tablet THEN the System SHALL use native iOS-style switches
5. WHEN the System renders toggles on desktop THEN the System SHALL use custom switches matching Apple style

### Requirement 8: Progressive Disclosure Controls

**User Story:** As a user, I want clear controls to reveal hidden fields, so that I can access advanced options when needed.

#### Acceptance Criteria

1. WHEN the System renders a disclosure control THEN the System SHALL display text in moss-green color #A3B18A
2. WHEN the System renders a disclosure control THEN the System SHALL display text at font-size 14px
3. WHEN the System renders a disclosure control THEN the System SHALL apply padding-top 8px
4. WHEN a user taps a disclosure control THEN the System SHALL expand the hidden section with 150ms smooth animation
5. WHEN a disclosure section is expanded THEN the System SHALL change the control text to indicate collapse action (e.g., "Hide advanced fields")
6. WHEN the System renders a disclosure control THEN the System SHALL include a chevron icon that rotates when expanded

### Requirement 9: Card Optimizer Simulator Bar Chart

**User Story:** As a user, I want to see card reward comparisons in a clear bar chart, so that I can quickly identify the best card for a transaction.

#### Acceptance Criteria

1. WHEN the System renders a bar chart track THEN the System SHALL apply height 6px, background rgba(255,255,255,0.07), and border-radius 9999px
2. WHEN the System renders a bar fill THEN the System SHALL apply moss-green color #A3B18A with border-radius 9999px
3. WHEN the System animates a bar fill THEN the System SHALL transition width from 0 to final value over 300ms
4. WHEN the System identifies the best card option THEN the System SHALL apply box-shadow 0 0 12px rgba(163,177,138,0.33)
5. WHEN the System renders a "Best" badge THEN the System SHALL apply padding 4px 8px, border-radius 9999px, border 1px solid #A3B18A, background rgba(163,177,138,0.15), and color #A3B18A at font-size 11px
6. WHEN the System renders card comparison rows THEN the System SHALL sort results by reward value in descending order

### Requirement 10: Interaction and Motion

**User Story:** As a user, I want smooth, subtle animations, so that the interface feels polished and responsive.

#### Acceptance Criteria

1. WHEN the System expands a collapsible section THEN the System SHALL animate with smooth fade and height transition
2. WHEN the System animates bar chart fills THEN the System SHALL transition width from 0 to final value
3. WHEN a user presses a button THEN the System SHALL scale the button to 98% of original size
4. WHEN a user hovers over a card on desktop THEN the System SHALL apply subtle lift effect with shadow increase
5. WHEN the System applies motion THEN the System SHALL use transition-timing-function cubic-bezier(0.35, 0, 0.15, 1)

### Requirement 11: Spacing and Visual Hierarchy

**User Story:** As a user, I want consistent spacing and clear visual hierarchy, so that I can easily understand the relationship between elements.

#### Acceptance Criteria

1. WHEN the System renders elements THEN the System SHALL apply spacing tokens: 4px (xs), 8px (sm), 12px (md), 16px (lg), 24px (xl), 32px (2xl)
2. WHEN the System renders form sections THEN the System SHALL separate sections with 24px vertical spacing
3. WHEN the System renders fields within a section THEN the System SHALL separate fields with 12px vertical spacing
4. WHEN the System renders labels and inputs THEN the System SHALL separate them with 4px vertical spacing
5. WHEN the System renders section headers THEN the System SHALL apply 16px bottom margin

### Requirement 12: Add Expense Page Structure

**User Story:** As a user, I want the Add Expense page organized into clear sections, so that I can efficiently enter transaction data.

#### Acceptance Criteria

1. WHEN a user views the Add Expense page THEN the System SHALL display a page title "Add Expense" at 32-40px with subtitle "Record a new expense transaction"
2. WHEN a user views the Add Expense page THEN the System SHALL display three main sections: Merchant Details, Transaction Details, and Payment Details
3. WHEN the System renders the Merchant Details section THEN the System SHALL display merchant name, online toggle, and merchant category by default
4. WHEN the System renders the Transaction Details section THEN the System SHALL display amount, currency, and date by default
5. WHEN the System renders the Payment Details section THEN the System SHALL display payment method selector by default

### Requirement 13: Card Optimizer Simulator Page Structure

**User Story:** As a user, I want the Card Optimizer Simulator page organized to show transaction inputs and card comparisons, so that I can easily compare rewards.

#### Acceptance Criteria

1. WHEN a user views the Card Optimizer Simulator page THEN the System SHALL display a page title "Card Optimizer Simulator" with subtitle "Compare rewards across all your cards"
2. WHEN a user views the Card Optimizer Simulator page THEN the System SHALL display two main sections: Transaction Details and Card Comparison
3. WHEN the System renders the Transaction Details section THEN the System SHALL display merchant details and transaction inputs using the same progressive disclosure pattern as Add Expense
4. WHEN the System renders the Card Comparison section THEN the System SHALL display a miles currency selector and sorted bar chart of card results
5. WHEN the System calculates card rewards THEN the System SHALL highlight the best option with visual emphasis

### Requirement 14: Accessibility and Interaction

**User Story:** As a user, I want interactive elements that are easy to tap and use, so that I can efficiently complete tasks on any device.

#### Acceptance Criteria

1. WHEN the System renders interactive elements on mobile THEN the System SHALL ensure tap targets are at least 44px in height
2. WHEN the System renders interactive elements THEN the System SHALL provide clear focus states for keyboard navigation
3. WHEN a user interacts with a disclosure control THEN the System SHALL provide immediate visual feedback
4. WHEN the System renders form validation errors THEN the System SHALL display error messages in color #E66A6A with clear messaging
5. WHEN a user submits a form THEN the System SHALL provide loading state feedback with disabled submit button

### Requirement 15: Platform-Specific Adaptations

**User Story:** As a user, I want the interface to feel native to my platform, so that interactions are familiar and intuitive.

#### Acceptance Criteria

1. WHEN the System renders on iOS or iPadOS THEN the System SHALL use SF Pro Display and SF Pro Text font families
2. WHEN the System renders on web or desktop THEN the System SHALL use Inter font family with Helvetica and Arial fallbacks
3. WHEN the System renders toggles on mobile or tablet THEN the System SHALL use native iOS-style switches
4. WHEN the System renders on desktop THEN the System SHALL enable hover states for interactive elements
5. WHEN the System renders on desktop THEN the System SHALL support keyboard shortcuts (e.g., Cmd+Enter to submit)
