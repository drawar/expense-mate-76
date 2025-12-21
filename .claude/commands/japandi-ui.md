# ExpenseMate Japandi UI/UX Design System

When implementing UI components for ExpenseMate, apply this design system to
ensure consistent Japandi aesthetics with clean, minimalist styling.

## Core Design Principles

1. **Japandi Aesthetic**: Natural materiality, warm neutrals, restrained color
   use
2. **Minimalism**: Clean interfaces with purposeful spacing, no visual clutter
3. **Functional Color**: Color communicates hierarchy and status, not decoration
4. **Mobile-First**: Must feel native on mobile devices while working as web app
5. **Subtle Interactions**: Gentle transitions and feedback, never aggressive

---

## Color Palette

### Dark Mode

#### Backgrounds

| Purpose            | Color     | Description                   |
| ------------------ | --------- | ----------------------------- |
| Primary Background | `#1A1D1F` | Warm charcoal, not pure black |
| Card Surface       | `#242729` | Elevated slightly             |
| Input Fields       | `#2C2F31` | Interactive surfaces          |
| Modal Background   | `#1F2224` | Overlay context               |

#### Accent

| Purpose        | Color                       |
| -------------- | --------------------------- | --------------------------- |
| Primary Accent | `#7C9885`                   | Sage green - muted, natural |
| Accent Hover   | `#6A8574`                   | Deeper on interaction       |
| Accent Subtle  | `rgba(124, 152, 133, 0.12)` | Badge backgrounds           |

#### Text Hierarchy

| Purpose        | Color     |
| -------------- | --------- | --------------------------- |
| Primary Text   | `#E8E6E3` | Warm white                  |
| Secondary Text | `#A8A5A0` | Warm gray, high readability |
| Tertiary Text  | `#6B6863` | Subtle details              |
| Disabled Text  | `#4A4845` | Minimal visibility          |

#### Functional Colors

| Purpose        | Color     |
| -------------- | --------- | ---------------------- |
| Active/Success | `#7C9885` | Matches primary accent |
| Warning        | `#C4A57B` | Warm clay              |
| Error          | `#A86F64` | Muted terracotta       |
| Dividers       | `#3A3D3F` | Barely visible         |

### Light Mode

#### Backgrounds

| Purpose            | Color     | Description                |
| ------------------ | --------- | -------------------------- |
| Primary Background | `#F5F3F0` | Warm off-white, like linen |
| Card Surface       | `#FFFFFF` | Pure white cards           |
| Input Fields       | `#FAFAF8` | Barely off-white           |
| Modal Background   | `#F8F6F3` | Warmer overlay             |

#### Accent

| Purpose        | Color                       |
| -------------- | --------------------------- | ------------------------ |
| Primary Accent | `#5D7567`                   | Deeper sage for contrast |
| Accent Hover   | `#4E6356`                   | Richer on interaction    |
| Accent Subtle  | `rgba(124, 152, 133, 0.15)` | Badge backgrounds        |

#### Text Hierarchy

| Purpose        | Color     |
| -------------- | --------- | ------------------ |
| Primary Text   | `#2B2926` | Warm black         |
| Secondary Text | `#5C5854` | Readable warm gray |
| Tertiary Text  | `#8E8A85` | Lighter details    |
| Disabled Text  | `#B8B5B0` | Faded but visible  |

#### Functional Colors

| Purpose        | Color     |
| -------------- | --------- | ----------------- |
| Active/Success | `#5D7567` | Deeper sage       |
| Warning        | `#A67C52` | Deeper clay       |
| Error          | `#8B5B52` | Deeper terracotta |
| Dividers       | `#E5E2DD` | Barely visible    |

---

## Typography

### Font Family

```css
font-family:
  "Inter",
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;
```

### Font Weights

- **Regular (400)**: Body text
- **Medium (500)**: Labels, buttons, emphasis
- **Never use 600 or 700** (too heavy for Japandi)

### Text Sizing

| Element       | Size | Weight | Letter-spacing | Line-height |
| ------------- | ---- | ------ | -------------- | ----------- |
| Headers       | 24px | 500    | -0.2px         | 1.3         |
| Body          | 14px | 400    | 0.1px          | 1.5         |
| Labels        | 13px | 500    | 0.3px          | 1.4         |
| Large amounts | 20px | 500    | 0              | 1.2         |

---

## Component Specifications

### Primary CTA Buttons

#### Dark Mode

```css
background: #7c9885;
color: #1a1d1f;
border-radius: 10px;
padding: 16px 24px;
font-weight: 500;
letter-spacing: 0.3px;
transition: all 0.3s ease;

/* Hover */
background: #6a8574;

/* Pressed */
background: #5d7567;
transform: scale(0.98);
```

#### Light Mode

```css
background: #5d7567;
color: #ffffff;
/* Hover adds shadow */
box-shadow: 0 4px 12px rgba(93, 117, 103, 0.25);
```

### Card Surface Container

#### Dark Mode

```css
background: #242729;
border: 1px solid #3a3d3f;
border-radius: 12px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
```

#### Light Mode

```css
background: #ffffff;
border: 1px solid #e5e2dd;
border-radius: 12px;
box-shadow: 0 2px 12px rgba(43, 41, 38, 0.06);
```

### Reward Multiplier Badges

#### Dark Mode

| Multiplier | Background                  | Text      | Border                      |
| ---------- | --------------------------- | --------- | --------------------------- |
| 3x         | `rgba(124, 152, 133, 0.15)` | `#A8C4AF` | `rgba(124, 152, 133, 0.3)`  |
| 2x         | `rgba(124, 152, 133, 0.12)` | `#A8C4AF` | `rgba(124, 152, 133, 0.25)` |
| 1.25x      | `rgba(124, 152, 133, 0.10)` | `#A8C4AF` | `rgba(124, 152, 133, 0.2)`  |

```css
font-size: 16px;
font-weight: 500;
padding: 4px 10px;
border-radius: 6px;
border-width: 1px;
```

#### Light Mode

| Multiplier | Background                 | Text      | Border                     |
| ---------- | -------------------------- | --------- | -------------------------- |
| 3x         | `rgba(93, 117, 103, 0.12)` | `#4E6356` | `rgba(93, 117, 103, 0.25)` |
| 2x         | `rgba(93, 117, 103, 0.10)` | `#5D7567` | `rgba(93, 117, 103, 0.2)`  |
| 1.25x      | `rgba(93, 117, 103, 0.08)` | `#6A8574` | `rgba(93, 117, 103, 0.15)` |

### Input Fields & Dropdowns

#### Dark Mode

```css
background: #2c2f31;
border: 1px solid #3a3d3f;
color: #e8e6e3;
border-radius: 8px;
padding: 14px 16px;

/* Focus */
border-color: #7c9885;
box-shadow: 0 0 0 3px rgba(124, 152, 133, 0.1);
```

#### Light Mode

```css
background: #fafaf8;
border: 1.5px solid #d4d0ca;
color: #2b2926;
border-radius: 8px;
padding: 14px 16px;

/* Focus */
border-color: #5d7567;
background: #ffffff;
box-shadow: 0 0 0 3px rgba(93, 117, 103, 0.12);

/* Placeholder */
color: #b8b5b0;
```

### Active Status Badge

#### Dark Mode

```css
background: rgba(124, 152, 133, 0.15);
color: #a8c4af;
border: 1px solid rgba(124, 152, 133, 0.25);
padding: 8px 20px;
border-radius: 20px;
font-size: 14px;
font-weight: 500;
letter-spacing: 0.5px;
text-transform: lowercase;
```

#### Light Mode

```css
background: rgba(93, 117, 103, 0.12);
color: #4e6356;
border: 1px solid rgba(93, 117, 103, 0.2);
```

### Toggle Switch

#### Dark Mode

```css
/* Track inactive */
background: #3a3d3f;
border: 1px solid #4a4d4f;

/* Track active */
background: #7c9885;
border: none;

/* Thumb */
background: #e8e6e3;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
```

#### Light Mode

```css
/* Track inactive */
background: #d4d0ca;
border: 1px solid #c4c0ba;

/* Track active */
background: #5d7567;
border: none;

/* Thumb */
background: #ffffff;
box-shadow: 0 2px 6px rgba(43, 41, 38, 0.2);
border: 1px solid #e5e2dd;
```

### Modal Overlays

#### Dark Mode

```css
/* Overlay */
background: rgba(26, 29, 31, 0.85);
backdrop-filter: blur(8px);

/* Container */
background: #1f2224;
border: 1px solid #3a3d3f;
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
```

#### Light Mode

```css
/* Overlay */
background: rgba(43, 41, 38, 0.25);
backdrop-filter: blur(12px);

/* Container */
background: #ffffff;
border: 1px solid #e5e2dd;
border-radius: 16px;
box-shadow: 0 16px 48px rgba(43, 41, 38, 0.12);
```

### Card Stats Section

#### Dark Mode

```css
background: #1f2224;
border: 1px solid #2c2f31;
border-radius: 10px;
padding: 16px;

/* Amount */
color: #e8e6e3;
font-size: 20px;
font-weight: 500;

/* Label */
color: #6b6863;
font-size: 13px;
font-weight: 400;
margin-bottom: 4px;
```

#### Light Mode

```css
background: #fafaf8;
border: 1px solid #e5e2dd;

/* Amount */
color: #2b2926;

/* Label */
color: #8e8a85;
```

---

## Shadow System

### Dark Mode

| Elevation          | Shadow                           |
| ------------------ | -------------------------------- |
| Subtle (cards)     | `0 2px 8px rgba(0, 0, 0, 0.12)`  |
| Medium (modals)    | `0 4px 16px rgba(0, 0, 0, 0.18)` |
| Strong (dropdowns) | `0 8px 24px rgba(0, 0, 0, 0.25)` |

### Light Mode

| Elevation          | Shadow                              |
| ------------------ | ----------------------------------- |
| Subtle (cards)     | `0 2px 12px rgba(43, 41, 38, 0.06)` |
| Medium (modals)    | `0 4px 20px rgba(43, 41, 38, 0.10)` |
| Strong (dropdowns) | `0 8px 32px rgba(43, 41, 38, 0.14)` |

---

## Animation Specifications

### Transition Timing

| Animation      | Duration | Easing                       |
| -------------- | -------- | ---------------------------- |
| Button hover   | 0.3s     | ease                         |
| Modal entrance | 300ms    | spring, ease-out             |
| Theme toggle   | 0.4s     | cubic-bezier(0.4, 0, 0.2, 1) |
| Button press   | instant  | scale(0.98)                  |

---

## Mobile Considerations

### Touch Targets

- Minimum size: 44x44px (Apple HIG)
- Icons: 24px with 12px padding around
- Dropdown tap area: entire right 60px

### Modal Behavior

- MaxHeight: 85vh
- Margin: 16px around on mobile
- Bottom sheet slide-up animation
- Drag handle: 40px wide, 4px height, rounded, centered
- Support swipe-down-to-dismiss

### Platform Detection

- Apply hover states only on web (`Platform.OS === 'web'`)
- Add `cursor: pointer` only for web
- Use `react-native-gesture-handler` for swipe gestures

---

## Accessibility

### Screen Reader

- All buttons need `accessibilityLabel`
- Interactive elements need `accessibilityRole="button"`
- Status toggles need `accessibilityHint`

### Color Contrast

- Minimum: 4.5:1 for normal text, 3:1 for large text
- Focus ring: 3px in accent color

### Keyboard Navigation

- All elements keyboard accessible
- Visible focus states
- Logical tab order

---

## Do NOT Implement

- Additional icons beyond necessity
- Bright, saturated colors outside palette
- Harsh shadows or multiple layers
- Font weights above 500
- Pure black (#000000) or pure white (#FFFFFF) in dark mode backgrounds
- Uppercase text for headers or buttons
- Aggressive animations or bounce effects

---

# Functional Issues & Improvements

## Overview

Critical functional issues identified in the ExpenseMate payment methods
interface, separate from color scheme and visual design considerations.

---

## Critical Functional Issues

### 1. Reward Rules Edit/Delete Actions Are Ambiguous

**Problem:** Each reward rule has pencil and trash icons that are close together
with no confirmation dialog.

**Fix:**

- Add confirmation modal: "Delete '3x Points on Air Canada'?" with Cancel/Delete
  buttons
- Edit action should open a modal for rule configuration
- Consider swipe-to-delete pattern on mobile
- Add undo toast after deletion: "Rule deleted" with "Undo" button for 5 seconds

---

### 2. "Quick Setup" vs "Add Rule" Distinction Unclear

**Problem:** Users see both buttons but unclear which to use first.

**Fix:**

- If no rules exist, show only "Quick Setup" initially
- After Quick Setup, show "+ Add Rule" for custom rules
- Or: Make "Quick Setup" a dropdown within "+ Add Rule"
- Add onboarding tooltip: "Try Quick Setup to add common reward categories
  automatically"

---

### 3. No Bulk Actions for Multiple Rules

**Problem:** Must edit/delete rules one at a time.

**Fix:**

- Add "Manage Rules" button for multi-select mode
- Allow selecting multiple rules for bulk delete
- Add "Disable All Rules" option
- Consider "Copy Rules to Another Card" feature

---

### 4. Card Navigation Arrows Don't Show Current Position

**Problem:** No indication of total cards or current position.

**Fix:**

- Add "1 of 3" counter
- Add pagination dots
- Disable arrows at first/last card
- Consider card names below arrows for quick identification

---

### 5. Upload Card Image Flow is Broken

**Problem:** No preview after upload, no way to remove/replace image.

**Fix:**

- Show thumbnail preview after upload
- Change "Upload Card Image" to "Change Card Image" if one exists
- Add "Remove Image" option
- Disable upload button until file selected
- Show file name and size before upload

---

### 6. Statement Details Section is Too Vague

**Problem:** "Statement starts on day 2" is unclear about calendar vs billing
cycle.

**Fix:**

- Show current period: "Current statement: Dec 2 - Jan 1, 2026"
- Show days remaining: "23 days until statement closes"
- Add "View Statement History" link
- Clarify calendar vs billing cycle with toggle explanation

---

### 7. No Way to Reorder Reward Rules

**Problem:** Rules appear in fixed order, important rules may be buried.

**Fix:**

- Add drag handle (⋮⋮) to left of each rule
- Implement drag-and-drop reordering
- On mobile, long-press to enter reorder mode
- Save order preference per card

---

### 8. Reward Points Tracking is Static

**Problem:** Shows total points but no breakdown or history.

**Fix:**

- Split into "Earned" and "Available" points
- Add "View Points History" link
- Show points earned this statement period
- Add "Redeem Points" button when points > 0

---

### 9. No Validation in Edit Payment Method Form

**Problem:** No required field indicators, no validation for digits/dates.

**Fix:**

- Mark required fields with asterisk
- Validate Last 4 Digits: exactly 4 numeric characters
- Validate Statement Day: 1-28 (safe for all months) with warning for 29-31
- Show inline error messages
- Disable "Update" until form is valid

---

### 10. No Search or Filter for Multiple Cards

**Problem:** Must swipe through all cards to find specific one.

**Fix:**

- Add search bar: "Search cards..."
- Add filter dropdown: "All / Active / Inactive"
- Add "Recently Used" section
- Consider list view toggle as alternative to carousel
- Add "Pin to Top" option

---

### 11. Reward Rules Lack Category Validation

**Problem:** Can create duplicate or overlapping rules.

**Fix:**

- Warn when creating duplicate category
- Show rule priority/order of application
- Add category examples: "Dining & Food Delivery (restaurants, DoorDash, Uber
  Eats)"
- Show catch-all rule always appears last

---

### 12. No Card Deactivation Warning

**Problem:** Toggle can deactivate card with one tap, no warning.

**Fix:**

- Show confirmation: "Deactivate Aeroplan Reserve? You can reactivate it
  anytime."
- Indicate impact: "Transaction history will be preserved"
- Add "Archive Card" as separate, more permanent option

---

### 13. Transaction Integration Missing

**Problem:** Shows totals but no way to add transactions from this screen.

**Fix:**

- Add "+ Add Transaction" button in stats section
- Add "View All Transactions" link
- Show last transaction date: "Last used: Dec 15, 2025"
- Add integration status indicator

---

### 14. No Export or Sharing Options

**Problem:** Cannot export card details or share reward structure.

**Fix:**

- Add overflow menu (⋮) with "Export Card Details"
- Support export: PDF, CSV, or share link
- Add "Share Reward Rules" for shareable template
- Consider "Duplicate Card" option

---

### 15. Currency Display Inconsistency

**Problem:** Mixing currency code (CAD) and symbol (C$) inconsistently.

**Fix:**

- Standardize on either symbol or code throughout
- Show both in settings but use one consistently
- Consider user preference for display format

---

### 16. Statement Type Toggle Has No Context

**Problem:** "Use statement month" toggle not explained.

**Fix:**

- Add helper text: "Statement month: Dec 2 - Jan 1 vs Calendar month: Dec 1 -
  Dec 31"
- Show preview of current/next statement period
- Explain impact: "Affects when transactions are grouped in reports"
- Add info icon with detailed explanation

---

### 17. No Error Recovery

**Problem:** No indication of what went wrong on failures, no retry.

**Fix:**

- Show specific error messages
- Add "Retry" button on failures
- Preserve form data on modal close
- Add offline mode indicator
- Queue actions for retry when connection restores

---

### 18. Accessibility Navigation Issues

**Problem:** Carousel isn't keyboard accessible, no skip links, no loading
announcements.

**Fix:**

- Add keyboard shortcuts: Arrow keys for cards, Tab for fields
- Implement proper focus management in modals
- Add ARIA live regions for dynamic updates
- Add skip links: "Skip to card details", "Skip to reward rules"
- Announce loading states

---

## Priority Matrix

### High Priority (Implement First)

1. **Form Validation** (#9) - Prevents data errors
2. **Delete Confirmation** (#1) - Prevents accidental data loss
3. **Card Navigation Feedback** (#4) - Core navigation issue
4. **Upload Flow** (#5) - Broken user flow
5. **Error Recovery** (#17) - Critical for reliability

### Medium Priority (Implement Second)

1. **Statement Details Clarity** (#6)
2. **Quick Setup vs Add Rule** (#2)
3. **Reward Points Enhancement** (#8)
4. **Card Deactivation Warning** (#12)
5. **Transaction Integration** (#13)

### Lower Priority (Nice to Have)

1. **Bulk Actions** (#3)
2. **Rule Reordering** (#7)
3. **Search/Filter** (#10)
4. **Category Validation** (#11)
5. **Export Options** (#14)
6. **Currency Consistency** (#15)
7. **Statement Toggle Context** (#16)

### Accessibility (Ongoing)

1. **Keyboard Navigation** (#18) - Required for compliance
2. All features should include accessibility from start

---

## Implementation Principles

- **Progressive Disclosure**: Don't overwhelm with all options at once
- **Reversible Actions**: Allow undo for destructive operations
- **Clear Feedback**: Always show what's happening
- **Error Prevention**: Validate early, guide toward success
- **Mobile-First**: Touch targets, gestures, screen constraints

## Technical Considerations

- Form validation on blur and submit
- Optimistic updates where appropriate
- Proper loading states for async operations
- Offline-first architecture consideration
- Store user preferences in persistent storage

## Testing Focus

- All error states and recovery flows
- Keyboard navigation throughout
- Screen readers (VoiceOver, TalkBack)
- Form edge cases (special chars, max lengths)
- Slow network connections
- Haptic feedback on mobile

## Success Metrics

- **Error Rate**: Reduction in failed submissions
- **Task Completion Time**: Faster card setup
- **User Confusion**: Fewer support requests
- **Accessibility Score**: Improved Lighthouse audit
- **Data Loss**: Zero accidental deletions
