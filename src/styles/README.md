# Moss Dark UI Design System

This directory contains the design tokens and theme styles for the Moss Dark UI redesign.

## Files

- **design-tokens.css** - Core design system tokens (colors, spacing, typography, motion)
- **moss-dark-theme.css** - Theme-specific component styles and utilities
- **global-enhancements.css** - Legacy global enhancements (to be deprecated)

## Usage

### Using Design Tokens in CSS

Design tokens are available as CSS custom properties:

```css
.my-component {
  background-color: var(--color-card-bg);
  border-radius: var(--radius-card);
  padding: var(--space-lg);
  color: var(--color-text);
}
```

### Using Design Tokens with Tailwind

Design tokens are integrated into Tailwind and can be used with utility classes:

```tsx
<div className="bg-moss-card rounded-moss-card p-moss-lg text-moss-text">
  Content
</div>
```

### Available Token Categories

#### Colors
- `--color-bg` / `bg-moss-bg` - App background (#0B0B0D)
- `--color-card-bg` / `bg-moss-card` - Card background (#16171A)
- `--color-surface` / `bg-moss-surface` - Input/surface background (#1F2024)
- `--color-accent` / `text-moss-accent` - Moss green accent (#A3B18A)
- `--color-text` / `text-moss-text` - Primary text (#F5F5F7)
- `--color-text-secondary` / `text-moss-text-secondary` - Secondary text (#8E8E93)
- `--color-text-muted` / `text-moss-text-muted` - Muted text (#6B6B70)

#### Spacing
- `--space-xs` / `p-moss-xs` - 4px
- `--space-sm` / `p-moss-sm` - 8px
- `--space-md` / `p-moss-md` - 12px
- `--space-lg` / `p-moss-lg` - 16px
- `--space-xl` / `p-moss-xl` - 24px
- `--space-2xl` / `p-moss-2xl` - 32px

#### Border Radius
- `--radius-card` / `rounded-moss-card` - 20px
- `--radius-input` / `rounded-moss-input` - 14px
- `--radius-pill` / `rounded-moss-pill` - 9999px
- `--radius-sm` / `rounded-moss-sm` - 8px

#### Shadows
- `--shadow-card-mobile` / `shadow-moss-card-mobile`
- `--shadow-card-desktop` / `shadow-moss-card-desktop`
- `--shadow-card-hover` / `shadow-moss-card-hover`
- `--shadow-glow-accent` / `shadow-moss-glow-accent`

#### Typography
- `--font-size-title-1` - 32px (mobile), 36px (tablet), 40px (desktop)
- `--font-size-section-header` - 16px (mobile), 18px (tablet/desktop)
- `--font-size-body` - 15px (mobile), 16px (tablet/desktop)
- `--font-size-label` - 13px (mobile), 14px (tablet/desktop)
- `--font-size-helper` - 11px (mobile), 12px (tablet/desktop)

#### Motion
- `--transition-smooth` - cubic-bezier(0.35, 0, 0.15, 1)
- `--duration-fast` - 150ms
- `--duration-normal` - 300ms

### Pre-built Component Classes

The theme includes pre-built component classes:

```tsx
// Card component
<div className="moss-card">Content</div>

// Input component
<input className="moss-input" placeholder="Enter text" />

// Button component
<button className="moss-button">Click me</button>

// Collapsible trigger
<button className="collapsible-trigger">
  Show more
  <ChevronDown className="collapsible-chevron" />
</button>

// Bar chart components
<div className="card-bar-row card-bar-row-best">
  <div className="bar-track">
    <div className="bar-fill" style={{ width: '75%' }} />
  </div>
</div>
```

### Typography Utilities

```tsx
<h1 className="text-title-1">Page Title</h1>
<h2 className="text-section-header">Section Header</h2>
<p className="text-body">Body text</p>
<label className="text-label">Form label</label>
<span className="text-helper">Helper text</span>
```

### Responsive Behavior

Typography scales automatically across breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

Shadows adapt based on screen size:
- Mobile: Uses `--shadow-card-mobile`
- Desktop (>1024px): Uses `--shadow-card-desktop`

### Platform-Specific Adaptations

Font family automatically adapts:
- iOS/iPadOS: SF Pro Display, SF Pro Text
- Web/Desktop: Inter with fallbacks

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Use Tailwind utilities** when possible for consistency
3. **Reference tokens in CSS** when custom styling is needed
4. **Test across breakpoints** to ensure responsive behavior
5. **Verify on iOS/iPadOS** to ensure platform-specific styles work

## Migration Guide

When updating existing components:

1. Replace hardcoded colors with token references
2. Replace hardcoded spacing with spacing tokens
3. Replace hardcoded border-radius with radius tokens
4. Use pre-built component classes where applicable
5. Test responsive behavior at all breakpoints
