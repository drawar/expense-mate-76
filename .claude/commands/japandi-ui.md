# Clairo Japandi UI/UX Design System

When implementing UI components for Clairo, apply this design system to ensure
consistent Japandi aesthetics with clean, minimalist styling.

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

Critical functional issues identified in the Clairo payment methods interface,
separate from color scheme and visual design considerations.

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

---

# Implementation Audit

## Overview

This section identifies specific issues in the current implementation that
deviate from the Japandi design specification. Each issue includes what's wrong
and the exact fix needed.

---

## Critical Color Issues (Fix Immediately)

### 1. Primary Accent Color is Wrong

**Current Implementation:**

- "Add Method" and "Add Rule" buttons appear to use `#A8D5BA` or similar (too
  light, too saturated)
- Bright mint/seafoam green that looks cheap and unprofessional

**Correct Implementation:**

- Exact hex: `#7C9885` (muted sage green)
- Button text color: `#1A1D1F` (dark text on sage background)
- Hover state: `#6A8574`
- Pressed state: `#5D7567` with `scale(0.98)`
- This applies to ALL primary CTA buttons throughout the app

**Why it matters:** The wrong green completely breaks the Japandi aesthetic. The
current bright green looks like a default Material Design color, not the
natural, muted palette specified.

---

### 2. Background Color is Too Dark

**Current Implementation:**

- Appears to be pure black `#000000` or very close (`#0A0A0A`)
- Lacks warmth, feels harsh

**Correct Implementation:**

- Primary background: `#1A1D1F` (warm charcoal, NOT pure black)
- This should be the main app background color
- The subtle warm undertone is critical for Japandi feel

**Why it matters:** Pure black feels cold and digital. The warm charcoal creates
a natural, cozy atmosphere while maintaining dark mode benefits.

---

### 3. Card Surface Background

**Current Implementation:**

- Appears too similar to main background
- No visible elevation/distinction

**Correct Implementation:**

```css
background: #242729; /* slightly lighter than primary background */
border: 1px solid #3a3d3f;
border-radius: 12px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
```

**Why it matters:** Cards need subtle elevation to create visual hierarchy and
separation from background.

---

### 4. Multiplier Badges Are Wrong Style

**Current Implementation:**

- "5x", "3x", "2x", "1x" badges appear white or very light solid color
- Look too stark and prominent

**Correct Implementation:**

| Multiplier | Background                  | Text      | Border                      |
| ---------- | --------------------------- | --------- | --------------------------- |
| 5x         | `rgba(124, 152, 133, 0.15)` | `#A8C4AF` | `rgba(124, 152, 133, 0.3)`  |
| 3x         | `rgba(124, 152, 133, 0.12)` | `#A8C4AF` | `rgba(124, 152, 133, 0.25)` |
| 2x         | `rgba(124, 152, 133, 0.10)` | `#A8C4AF` | `rgba(124, 152, 133, 0.2)`  |
| 1x         | `rgba(124, 152, 133, 0.08)` | `#A8C4AF` | `rgba(124, 152, 133, 0.15)` |

```css
font-size: 16px;
font-weight: 500;
padding: 4px 10px;
border-radius: 6px;
border-width: 1px;
```

**Why it matters:** Badges should be subtle and harmonious, using transparency
to create hierarchy. Current solid badges compete with content instead of
supporting it.

---

## Typography Issues

### 5. Font Weights Too Heavy

**Current Implementation:**

- Headers and button text appear to be weight 600 or 700
- Violates Japandi principle of restraint

**Correct Implementation:**

- Maximum font weight: **500** (medium)
- Headers: weight 500
- Body text: weight 400
- NEVER use weight 600, 700, or higher

**Specific applications:**

```css
/* Card title "American Express Cobalt" */
font-size: 24px;
font-weight: 500;
letter-spacing: -0.2px;

/* Button text "Add Method", "Add Rule" */
font-size: 16px;
font-weight: 500;
letter-spacing: 0.3px;

/* Amount "C$787.97" */
font-size: 20px;
font-weight: 500;

/* Labels "Total Spent", "Reward Points" */
font-size: 13px;
font-weight: 500;
letter-spacing: 0.3px;
text-transform: capitalize; /* not uppercase */

/* Body/description text */
font-size: 14px;
font-weight: 400;
letter-spacing: 0.1px;
line-height: 1.5;
```

---

### 6. Letter Spacing Not Applied

**Current Implementation:**

- Text appears cramped without proper spacing

**Correct Implementation:**

| Element     | Letter-spacing |
| ----------- | -------------- |
| Headers     | -0.2px         |
| Body text   | 0.1px          |
| Labels      | 0.3px          |
| Button text | 0.3px          |

---

## Component-Specific Issues

### 7. "Reset Rules" Button Style is Wrong

**Current Implementation:**

- Ghost/outline button with accent color border
- Too prominent, competes with "Add Rule"
- Visually suggests primary action

**Correct Implementation:**

```css
/* Style: Text-only button (no border, no background in default state) */
color: #6b6863; /* tertiary */
font-size: 14px;
font-weight: 400;
background: transparent;
border: none;

/* Hover/Press */
background: #2c2f31;
border-radius: 6px;
padding: 8px 12px;
```

**Alternative:** Replace with icon-only button (↻ reset icon) to save space

---

### 8. Active Status Badge Too Prominent

**Current Implementation:**

- "active" badge appears with bright accent color
- Too eye-catching for default state

**Correct Implementation:**

```css
background: rgba(124, 152, 133, 0.15);
color: #a8c4af;
border: 1px solid rgba(124, 152, 133, 0.25);
padding: 8px 20px;
border-radius: 20px;
font-size: 14px;
font-weight: 500;
letter-spacing: 0.5px;
text-transform: lowercase; /* "active" not "Active" */
```

**Alternative approach:** Only show badge when card is inactive (use warning
color for "inactive" state)

---

### 9. Stats Cards Lack Visual Distinction

**Current Implementation:**

- "Total Spent" and "Reward Points" sections blend with surrounding content
- No container distinction

**Correct Implementation:**

```css
background: #1f2224;
border: 1px solid #2c2f31;
border-radius: 10px;
padding: 16px;
margin-bottom: 12px; /* vertical spacing between cards */
```

Each stat should feel like a contained data card, not just text on the
background.

---

### 10. Rule Description Text Too Dim

**Current Implementation:**

- "Earn 5 points per $1 CAD at restaurant..." appears very faint
- Looks like disabled text

**Correct Implementation:**

```css
color: #a8a5a0; /* secondary, NOT tertiary */
font-size: 14px;
line-height: 1.5;
```

Should be clearly readable, not faded.

---

### 11. Edit and Delete Icons Too Close

**Current Implementation:**

- Pencil and trash icons appear adjacent with minimal spacing
- Easy to tap wrong one

**Correct Implementation:**

```css
/* Minimum spacing between icons */
gap: 16px;

/* Touch target per icon */
width: 44px;
height: 44px;

/* Icon size */
font-size: 24px;

/* Padding around each icon */
padding: 10px;
```

**Alternative solution:**

- Move edit icon to left side of rule title
- Keep delete icon on right
- Or implement swipe-to-delete gesture for mobile

---

### 12. Section Spacing Inconsistent

**Current Implementation:**

- Some sections feel cramped
- Others have too much space
- No visible rhythm

**Correct Implementation - Spacing Scale:**

| Purpose                | Value |
| ---------------------- | ----- |
| Section gaps (major)   | 24px  |
| Within-section spacing | 16px  |
| Related items grouping | 12px  |
| Tight groupings        | 8px   |
| Card/container padding | 20px  |
| Between reward rules   | 16px  |

**Specific applications:**

- Space between "Statement Cycle" card and "Edit Payment Method" button: 24px
- Space between "Upload Card Image" and "Statement Details": 16px
- Space between individual reward rules: 16px with divider line

---

### 13. Pagination Dots Wrong Style

**Current Implementation:**

- Active dot appears white/very light
- Dots appear small (maybe 6px)

**Correct Implementation:**

```css
/* Dot size */
width: 8px;
height: 8px;
border-radius: 4px;

/* Active dot */
background: #7c9885; /* accent color */

/* Inactive dot */
background: #4b5563;

/* Spacing */
gap: 8px;

/* Position */
margin-top: 16px; /* below card image */
justify-content: center;
```

---

### 14. Card Count "6 of 11" Too Subtle

**Current Implementation:**

- Text appears very dim in top-right
- Easy to miss

**Correct Implementation:**

```css
color: #a8a5a0; /* secondary, not tertiary */
font-size: 13px; /* increase from current ~11-12px */
font-weight: 400;
```

**Optional enhancement - background pill:**

```css
background: rgba(26, 29, 31, 0.6);
padding: 4px 8px;
border-radius: 12px;
```

---

### 15. Interactive Element Affordances Missing

**Current Implementation:**

- Can't tell which elements are tappable
- No visual feedback on press

**Correct Implementation:**

All tappable rows ("Edit Payment Method", "Upload Card Image", "Statement
Details") should have:

```css
/* Press state */
background: #2c2f31;

/* Minimum height for touch target */
min-height: 44px;

/* Transition */
transition: background-color 0.15s ease;
```

- On mobile: Add haptic feedback (light impact) on tap
- On web: Add `cursor: pointer` (with `Platform.OS` check)

---

### 16. Statement Details Expansion Unclear

**Current Implementation:**

- Shows expanded content but unclear if it's always expanded or collapsible
- "Calendar month (starts day 1)" label redundant with date range shown

**Correct Implementation:**

- If collapsible: Add chevron icon (▼ when expanded, ▶ when collapsed)
- If always expanded: Remove chevron, make it clear this is static info
- Remove redundant label since date range shows the same info
- Or change label to explain: "Your billing cycle" instead of repeating the type

---

### 17. Cap Label Lacks Context

**Current Implementation:**

- "Cap: $2,500" appears but timeframe unclear
- Users won't know if this is monthly, annual, or lifetime

**Correct Implementation:**

```css
/* Change to: "Annual cap: $2,500" or "Monthly cap: $2,500" */
color: #6b6863; /* tertiary text */
font-size: 12px;
```

**Optional:** Add info icon (ℹ️) with tooltip: "Maximum amount eligible for this
earn rate per year"

---

## Dividers and Separators

### 18. Section Dividers Need Implementation

**Current Implementation:**

- Sections run together without clear separation

**Correct Implementation:**

```css
/* Between reward rules */
border-top: 1px solid rgba(58, 61, 63, 0.4);
margin: 16px 0;

/* Above "Reward Rules" section */
border-top: 1px solid rgba(58, 61, 63, 0.4);
margin-top: 24px;
margin-bottom: 20px;
```

---

## Missing Features

### 19. No Loading States Visible

**Implementation Needed:**

```css
/* Large ActivityIndicator - accent color */
color: #7c9885;

/* Card details loading - skeleton shimmer */
height: 200px;
background: linear-gradient(90deg, #242729 25%, #2c2f31 50%, #242729 75%);
animation: shimmer 1.5s infinite;

/* Button loading state */
/* Replace button text with small white ActivityIndicator */

/* Loading text */
color: #a8a5a0; /* secondary */
```

---

### 20. No Upload Image Feedback

**Current Implementation:**

- "Upload Card Image" section exists but no indication of upload status

**Implementation Needed:**

- If no image uploaded: Show "Add an image of your card" in tertiary color
- If image uploaded:
  - Change text to "Change Card Image"
  - Show small thumbnail preview (50x32px) next to the text
  - Add "Remove Image" option
- During upload: Show progress spinner with "Uploading..."
- On success: Show checkmark for 2 seconds
- On error: Show error message in error color `#A86F64`

---

### 21. No Error States

**Implementation Needed:**

```css
/* Error color */
color: #a86f64; /* muted terracotta, not bright red */

/* Error background */
background: rgba(168, 111, 100, 0.15);
```

- If card fails to load: Show error message with retry button
- If update fails: Toast notification at bottom: "Failed to update card" with
  retry

---

### 22. Reward Rules Section Header Needs Polish

**Current Implementation:**

- "Reward Rules" with "4" appears but styling unclear

**Correct Implementation:**

```css
/* Header "Reward Rules" */
font-size: 16px;
font-weight: 500;
color: #e8e6e3;
letter-spacing: 0.2px;

/* Count badge "4" */
background: rgba(124, 152, 133, 0.15);
color: #a8c4af;
font-size: 13px;
font-weight: 500;
padding: 2px 8px;
border-radius: 10px;
margin-left: 8px;
```

---

## Button Styling Summary

For consistency, here's the complete button style guide:

### Primary CTA Button ("Add Method", "Add Rule")

```css
background: #7c9885;
color: #1a1d1f;
font-size: 16px;
font-weight: 500;
letter-spacing: 0.3px;
padding: 16px 24px;
border-radius: 10px;
border: none;
transition: all 0.3s ease;

/* Hover */
background: #6a8574;

/* Pressed */
background: #5d7567;
transform: scale(0.98);
```

### Secondary/Destructive Button ("Reset Rules")

```css
background: transparent;
color: #6b6863;
font-size: 14px;
font-weight: 400;
padding: 8px 12px;
border: none;

/* Hover/Pressed */
background: #2c2f31;
border-radius: 6px;
```

### Icon-Only Buttons (Edit, Delete)

```css
/* Size (touch target) */
width: 44px;
height: 44px;

/* Icon */
font-size: 24px;
color: #a8a5a0;

/* Padding */
padding: 10px;

/* Pressed */
background: #2c2f31;
border-radius: 6px;
```

---

## Accessibility Additions Needed

### 23. Screen Reader Labels

```jsx
// Primary buttons
accessibilityLabel = "Add new payment method";
accessibilityRole = "button";

// Card navigation
accessibilityLabel = "View next card";
accessibilityHint = "Navigate to American Express Gold";

// Multiplier badges
accessibilityLabel = "Earn 5 points per dollar on food and groceries";

// Status toggle
accessibilityLabel = "Card status";
accessibilityHint = "Currently active. Double-tap to deactivate.";

// Rule actions
accessibilityLabel = "Edit food and groceries reward rule";
accessibilityLabel = "Delete food and groceries reward rule";
```

### 24. Keyboard Navigation

- All interactive elements must be keyboard accessible
- Focus indicators: 3px ring in `#7C9885`
- Tab order: logical flow through card details → actions → reward rules
- Arrow keys should navigate card carousel
- Enter/Space should activate buttons
- Escape should close modals

---

## Animation Specifications

### 25. Transition Timing

```javascript
// Button hover/press
transition: 'background-color 0.3s ease, transform 0.15s ease'

// Modal entrance
duration: 300ms
easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // spring

// Card carousel swipe
duration: 250ms
easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)'

// Background color changes
duration: 400ms
easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
```

Use `react-native-reanimated` 2.x for smooth 60fps animations.

---

## Testing Checklist

Before considering this complete, verify:

- [ ] Primary accent is exactly `#7C9885` (use color picker to verify)
- [ ] Background is exactly `#1A1D1F` (not pure black)
- [ ] All font weights are 500 or below (check computed styles)
- [ ] Letter spacing applied to all text elements
- [ ] Touch targets are minimum 44x44px (test with touch indicator)
- [ ] All buttons have proper press states
- [ ] Multiplier badges use correct transparency values
- [ ] Stats cards have distinct background containers
- [ ] Spacing follows the specified scale (4, 8, 12, 16, 20, 24px)
- [ ] Pagination dots are 8px and use correct colors
- [ ] Loading states appear correctly (test with slow network)
- [ ] Error states work properly (test by forcing failures)
- [ ] Screen reader announces all elements correctly
- [ ] Keyboard navigation works throughout
