# Card Art Generator

You are helping the user generate minimalist cartoon-style credit card artwork
for the expense tracking application. The goal is to create consistent, simple
illustrations based on real card images.

## Style Guidelines

All generated card art must follow these consistent style rules:

### Visual Style

- **Art Style**: Flat design, vector-like illustration
- **Complexity**: Minimalist - remove unnecessary details, keep essential brand
  elements
- **Colors**: Simplified color palette (3-5 main colors per card), slightly
  desaturated/muted
- **Lines**: Clean, smooth edges with subtle rounded corners
- **Shadows**: Minimal or no shadows, flat appearance
- **Textures**: None - solid colors only
- **Aspect Ratio**: 1.586:1 (standard credit card ratio: 85.6mm x 53.98mm)

### Elements to Keep

- Card's primary background color/gradient (simplified)
- Issuer/bank logo (simplified/stylized)
- Card network logo position (Visa, Mastercard, Amex)
- Card name/product name placement
- General layout and composition

### Elements to Remove/Simplify

- Chip and contactless symbols (remove or make very subtle)
- Fine print and legal text
- Complex gradients (simplify to 2-3 color gradients max)
- Holographic elements
- Embossed text effects
- Security features
- Detailed patterns (simplify to basic shapes)

## Image Generation Prompt Template

Use this prompt template for consistent results across all cards:

```
Create a minimalist, flat-design illustration of a [CARD NAME] credit card.

Style requirements:
- Flat vector illustration style, no 3D effects
- Simplified color palette using the card's signature colors: [PRIMARY COLORS]
- Clean, smooth edges with subtle rounded corners
- No textures, gradients simplified to 2-3 colors max
- Aspect ratio 1.586:1 (credit card proportions)
- Keep the [BRAND] logo simplified but recognizable
- Position [NETWORK] logo in the [POSITION]
- Background: [DESCRIBE SIMPLIFIED BACKGROUND]
- Remove chip, contactless symbol, fine print
- Modern, clean aesthetic suitable for a mobile app UI

Reference: The original card has [DESCRIBE KEY VISUAL ELEMENTS]
```

## Card-Specific Prompts

### American Express Aeroplan Reserve

```
Create a minimalist, flat-design illustration of an American Express Aeroplan Reserve credit card.

Style requirements:
- Flat vector illustration style, no 3D effects
- Color palette: Deep navy blue (#1a1f4e), silver/grey accents, red Aeroplan maple leaf
- Clean, smooth edges with subtle rounded corners
- No textures, solid colors only
- Aspect ratio 1.586:1 (credit card proportions)
- Simplified American Express centurion logo in white/silver
- Aeroplan logo with stylized red maple leaf on left side
- "RESERVE" text in elegant silver lettering
- Navy blue background with subtle darker gradient at edges
- Remove chip, contactless symbol, fine print
- Premium, sophisticated feel

The original has a dark navy background with the Aeroplan maple leaf logo prominently displayed.
```

### American Express Platinum

```
Create a minimalist, flat-design illustration of an American Express Platinum credit card.

Style requirements:
- Flat vector illustration style, no 3D effects
- Color palette: Metallic silver/platinum grey (#C0C0C0, #A8A8A8), subtle blue-grey tints
- Clean, smooth edges with subtle rounded corners
- Simplified brushed metal effect as subtle horizontal gradient bands
- Aspect ratio 1.586:1 (credit card proportions)
- Simplified American Express centurion logo centered
- "Platinum" text in elegant dark grey lettering
- Silver/platinum background suggesting premium metal card
- Remove chip, contactless symbol, fine print
- Luxurious, premium aesthetic

The original is a metal card with a brushed platinum finish and centered Amex centurion.
```

### American Express Cobalt

```
Create a minimalist, flat-design illustration of an American Express Cobalt credit card.

Style requirements:
- Flat vector illustration style, no 3D effects
- Color palette: Deep cobalt blue (#0047AB), purple undertones (#2E1A47), subtle gradients
- Clean, smooth edges with subtle rounded corners
- No textures, simplified gradient from deep blue to purple
- Aspect ratio 1.586:1 (credit card proportions)
- Simplified American Express logo in silver/white
- "COBALT" text in silver metallic lettering
- Rich blue-purple gradient background
- Remove chip, contactless symbol, fine print
- Modern, vibrant feel

The original has a striking cobalt blue to purple gradient with the Amex logo.
```

## Workflow

### Step 1: Gather Reference

Ask the user for:

1. The card they want to create art for
2. A reference image URL (if not already known)
3. Any specific style preferences

### Step 2: Generate Prompt

Create a customized prompt based on the template above, incorporating:

- Card's specific colors (use color picker on reference image)
- Brand elements and their positions
- Any unique design features

### Step 3: Recommend Tools

Suggest image generation tools:

- **DALL-E 3** (via ChatGPT Plus or API) - Good for flat design
- **Midjourney** - Excellent for stylized illustrations (use `--style raw` and
  `--stylize 50`)
- **Adobe Firefly** - Good for clean vector-like results
- **Ideogram** - Good text rendering if card name is important

### Step 4: Post-Processing Instructions

After generating:

1. Resize to 856 x 540 pixels (or 428 x 270 for 2x display)
2. Export as PNG with transparency or solid background
3. Optimize file size (should be under 100KB)
4. Save to `/public/cards/` directory

### Step 5: Update Code

After saving the image, update `PaymentCardFace.tsx`:

```typescript
const CARD_IMAGES: Record<string, string> = {
  "american express:aeroplan reserve": "/cards/amex-aeroplan-reserve.png",
  "american express:platinum": "/cards/amex-platinum.png",
  "american express:cobalt": "/cards/amex-cobalt.png",
  // Add new card here
};
```

## Example Conversation

**User**: Generate card art for my TD Aeroplan Visa Infinite

**Assistant**: I'll help you create minimalist card art for the TD Aeroplan Visa
Infinite. Let me first understand the card's design.

Do you have a reference image URL for this card? If not, I can search for the
official card image.

**User**:
https://www.td.com/content/dam/tdct/images/personal-banking/credit-cards/td-aeroplan-visa-infinite-card.png

**Assistant**: Great! Based on the TD Aeroplan Visa Infinite design, here's your
customized image generation prompt:

```
Create a minimalist, flat-design illustration of a TD Aeroplan Visa Infinite credit card.

Style requirements:
- Flat vector illustration style, no 3D effects
- Color palette: TD green (#2E8B57), black, white, red Aeroplan maple leaf
- Clean, smooth edges with subtle rounded corners
- No textures, solid colors only
- Aspect ratio 1.586:1 (credit card proportions)
- TD shield logo simplified in top left (green and white)
- Aeroplan logo with red maple leaf on right side
- "VISA INFINITE" text in small silver lettering bottom right
- Split design: TD green on left portion, transitioning to black on right
- Remove chip, contactless symbol, fine print
- Professional, travel-focused aesthetic

The original has a distinctive split green/black design with both TD and Aeroplan branding.
```

**Recommended tool**: DALL-E 3 or Midjourney with
`--style raw --ar 159:100 --stylize 50`

After generating, save the image to
`/public/cards/td-aeroplan-visa-infinite.png` and I'll help you update the code.

## Tips for Consistency

1. **Batch generate**: Create all card images in one session to maintain style
   consistency
2. **Use same seed**: In Midjourney, use `--seed [number]` to keep similar style
   across cards
3. **Color calibration**: Extract exact colors from original cards using a color
   picker
4. **Test at size**: Preview images at the actual display size (around 300px
   wide) to ensure details are visible
5. **Fallback gradient**: Keep the gradient-based fallback for cards without
   custom art

---

Now, which card would you like to create artwork for? Provide the card name and
a reference image if available.
