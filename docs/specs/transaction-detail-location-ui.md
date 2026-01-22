# Transaction Detail Dialog - Location UI Enhancement

## Overview

Enhance the transaction detail dialog to better display merchant location
information using the new `display_location` field and add an interactive map.

## Current UI

```
┌─────────────────────────────────────────────────┐
│                  Juice Truck                  X │
├─────────────────────────────────────────────────┤
│                                                 │
│                   C$13.64                       │
│                                                 │
│  2025-10-06 · 510 W 8th Ave, Vancouver, BC  · Dining │
│              (Whole Foods)                   Out  ✎ │
│                                                 │
├─────────────────────────────────────────────────┤
│ PAYMENT METHOD                                  │
│ [Card Image] Cobalt                             │
│              American Express                   │
├─────────────────────────────────────────────────┤
│ REWARDS                                         │
│ [Logo] + 68 Membership Rewards Points (CA)      │
├─────────────────────────────────────────────────┤
│ ADDITIONAL DETAILS                           ∨  │
│ Transaction ID    512d191e-1675-4fba-...        │
│ MCC               5812 - Restaurants & Eating   │
└─────────────────────────────────────────────────┘
```

## Proposed UI Changes

### 1. Display Location (Inline with Date/Category)

Replace the full address with the shorter `display_location` field.

**Before:**

```
2025-10-06 · 510 W 8th Ave, Vancouver, BC (Whole Foods) · Dining Out
```

**After:**

```
2025-10-06 · Cambie, Vancouver · Dining Out
```

- Use `display_location` if available
- Fall back to `address` if `display_location` is null
- If merchant is online (`isOnline: true`), show "Online" instead

### 2. Interactive Map in Additional Details

Add a Leaflet map showing the merchant location when coordinates are available.

```
┌─────────────────────────────────────────────────┐
│                  Juice Truck                  X │
├─────────────────────────────────────────────────┤
│                                                 │
│                   C$13.64                       │
│                                                 │
│     2025-10-06 · Cambie, Vancouver · Dining Out ✎ │
│                                                 │
├─────────────────────────────────────────────────┤
│ PAYMENT METHOD                                  │
│ [Card Image] Cobalt                             │
│              American Express                   │
├─────────────────────────────────────────────────┤
│ REWARDS                                         │
│ [Logo] + 68 Membership Rewards Points (CA)      │
├─────────────────────────────────────────────────┤
│ ADDITIONAL DETAILS                           ∧  │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ │           [OpenStreetMap Tile]              │ │
│ │                    📍                        │ │
│ │              Tap to open in                 │ │
│ │              Google Maps                    │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Transaction ID    512d191e-1675-4fba-...        │
│ MCC               5812 - Restaurants & Eating   │
└─────────────────────────────────────────────────┘
```

### 3. Online Transaction (No Map)

For online merchants, show "Online" as the location and hide the map entirely.

```
┌─────────────────────────────────────────────────┐
│                    Airalo                     X │
├─────────────────────────────────────────────────┤
│                                                 │
│                   US$8.00                       │
│                                                 │
│         2025-10-15 · Online · Travel          ✎ │
│                                                 │
├─────────────────────────────────────────────────┤
│ PAYMENT METHOD                                  │
│ [Card Image] Cobalt                             │
│              American Express                   │
├─────────────────────────────────────────────────┤
│ REWARDS                                         │
│ [Logo] + 16 Membership Rewards Points (CA)      │
├─────────────────────────────────────────────────┤
│ ADDITIONAL DETAILS                           ∧  │
│                                                 │
│ Transaction ID    abc123-def456-...             │
│ MCC               4814 - Telecommunication      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key differences for online merchants:**

- Location shows "Online" instead of address/display_location
- No map is rendered in Additional Details
- All other sections remain the same

### Comparison: Physical vs Online

| Aspect               | Physical Merchant                             | Online Merchant                |
| -------------------- | --------------------------------------------- | ------------------------------ |
| **Location line**    | `2025-10-06 · Cambie, Vancouver · Dining Out` | `2025-10-15 · Online · Travel` |
| **Map in details**   | Shown with pin at coordinates                 | Hidden                         |
| **Map click action** | Opens Google Maps URL                         | N/A                            |

## Technical Specification

### Dependencies

- `leaflet` - Map library
- `react-leaflet` - React bindings for Leaflet

### Component Changes

#### File: `src/components/transactions/TransactionDetailDialog.tsx`

1. **Import Leaflet CSS and components**

   ```tsx
   import { MapContainer, TileLayer, Marker } from "react-leaflet";
   import "leaflet/dist/leaflet.css";
   ```

2. **Display Location Logic**

   ```tsx
   const getLocationDisplay = (merchant: Merchant) => {
     if (merchant.isOnline) return "Online";
     if (merchant.display_location) return merchant.display_location;
     if (merchant.address) return merchant.address;
     return null;
   };
   ```

3. **Map Component**

   - Height: 150px
   - Zoom level: 15 (street level)
   - Show marker at merchant coordinates
   - Disable scroll zoom (prevent accidental zoom while scrolling dialog)
   - On click: Open `google_maps_url` in new tab
   - Only render if `coordinates` exist and merchant is not online

4. **Conditional Rendering**
   - If `isOnline`: No map, show "Online" as location
   - If no `coordinates`: No map, show address/display_location only
   - If `coordinates` exist: Show map with pin

### Map Styling

```css
.transaction-map {
  height: 150px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.transaction-map-overlay {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}
```

### Data Flow

```
Transaction
  └── merchant_id
        └── Merchant
              ├── display_location  → Shown inline with date/category
              ├── coordinates       → Used for map pin
              ├── google_maps_url   → Opened on map click
              └── isOnline          → Determines if map is shown
```

## Edge Cases

| Scenario                                     | Location Display | Map    |
| -------------------------------------------- | ---------------- | ------ |
| Online merchant                              | "Online"         | Hidden |
| Physical, has display_location & coords      | display_location | Shown  |
| Physical, has address only (no coords)       | address          | Hidden |
| Physical, has coords but no display_location | address          | Shown  |
| No location data                             | Hidden           | Hidden |

## Acceptance Criteria

- [ ] Display location shows `display_location` instead of full address
- [ ] "Online" shown for online merchants
- [ ] Map appears in Additional Details when coordinates exist
- [ ] Map shows correct location with pin marker
- [ ] Clicking map opens Google Maps URL in new tab
- [ ] Map does not appear for online merchants
- [ ] Map does not appear when no coordinates
- [ ] Leaflet CSS loads correctly (no broken tiles)
- [ ] Map is not zoomable via scroll (prevents scroll hijacking)
