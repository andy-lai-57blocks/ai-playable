# Match Candy — Asset Prompts

Original glossy candy match-3 assets. **Important generation rule:** always render on a **flat solid chroma key background** (`#FF00FF` magenta). Never draw checkerboards. Never claim transparency in the prompt.

Post-process with rembg / chroma key to produce real RGBA PNGs.

---

## Style Lock

- 3D glossy casual-game candy look
- Bright saturated colors, wet highlights, soft contact shadows on the candy itself only
- No logos, no brand names, no readable UI text
- Tokens/icons: centered subject, large, clean silhouette

---

## Prompt List

### asset_00 — Blue striped sphere candy
`A single glossy blue spherical hard candy with thick horizontal white stripes, juicy 3D casual game asset, soft self-shadow, centered, flat solid magenta background #FF00FF, no checkerboard, no text`

### asset_01 — Green striped vertical candy
`A single glossy green rounded rectangular candy with thick vertical white stripes, 3D casual match-3 token, soft glow, centered, flat solid magenta background #FF00FF, no checkerboard, no text`

### asset_02 — Yellow lemon-drop candy
`A single glossy yellow lemon-drop teardrop candy, Candy Crush Soda soft jelly style, chunky rounded, juicy specular highlight, centered, flat solid magenta background #FF00FF, no checkerboard, no text, no aura, NOT a star, NOT a gem`


### asset_03 — Cyan soft hexagon candy
`A single glossy cyan-teal soft hexagonal pillow candy, Candy Crush Soda soft jelly style, chunky rounded corners, juicy specular highlight, centered, flat solid magenta background #FF00FF, no checkerboard, no text, no aura, NOT a diamond gem, NOT faceted`


### asset_04 — Color bomb sprinkle chocolate
`A dark chocolate sphere covered in dense multicolor candy sprinkles red yellow blue green pink, glossy special power-up candy, centered, flat solid magenta background #FF00FF, no checkerboard, no text`

### asset_05 — Purple heart candy
`A single glossy purple heart-shaped hard candy, juicy 3D casual match-3 token, soft self-shadow, centered, flat solid green background #00FF00, no checkerboard, no text, no aura`

### asset_06 — Red wrapped power-up
`A glowing activated red wrapped candy power-up with warm red aura and sparkles, match-3 special piece, centered, flat solid magenta background #FF00FF, no checkerboard, no text`

### asset_07 — Rainbow glow overlay
`A soft rainbow sparkle burst radial glow with tiny glitter particles only, no solid candy body, visual effect overlay, flat solid magenta background #FF00FF, no checkerboard`

### asset_08 — Cyan glow overlay
`A soft cyan sparkle radial glow burst with tiny particles only, effect overlay for special candy, flat solid magenta background #FF00FF, no checkerboard`

### asset_09 — Red glow overlay
`A soft red-orange sparkle radial glow burst with tiny particles only, effect overlay for wrapped candy, flat solid magenta background #FF00FF, no checkerboard`

### asset_10 — Main candy-world background
Candy Crush-like scenic candy kingdom backdrop, **2048×2048** (same as `match/asset_08` primary bg). Pastel sugar hills, whipped-cream clouds, distant candy props, clear-ish center for board overlay. No UI/text/logos/characters/checkerboard. Full-bleed scenic main background, not a flat solid blue board.

### asset_20 — Board background panel
**Programmatic preferred.** Candy Crush-inspired juicy jelly-blue rounded board tray: soft candy rim, subtle recessed cell wells (6×8), light specular gloss (not a HUD bar), minimal contact shadow, true RGBA outside. Aspect matched to `match/asset_21` (562×754), render at 3× (**1686×2262**), 4× supersample then Lanczos downsample for clean AA. This is the candy tray surface; scenic world stays on `asset_10`.

### asset_11 — Bear candy collection box (pink frosting)
Soft pink frosting candy collection tray matching `asset_10` candy-kingdom backdrop. Cream whipped rim, red-white candy-cane bows, three round empty wells, tiny mint-teal gummy bear head + paw accents only. Natural ~2.5:1 proportions, no stretch. Flat solid magenta `#FF00FF` for chroma key. No items inside, no text, no checkerboard.

### asset_12 — Chocolate objective icon
`A small glossy chocolate bar icon with bite mark optional, cute collectible objective for match-3 HUD, centered, flat solid magenta background #FF00FF, no text, no checkerboard`

### asset_13 — End screen panel
`A tall rounded candy-style UI panel with soft pastel frame and glossy border, empty center for text, casual game popup, flat solid magenta background #FF00FF, no text, no checkerboard`

### asset_14 — CTA button
`A wide glossy candy-pink call-to-action button with rounded pill shape and shiny highlight, empty center for text overlay, flat solid magenta background #FF00FF, no text, no checkerboard`

### asset_15 — Win star badge
`A large golden shiny victory star badge with soft glow, casual game win icon, centered, flat solid magenta background #FF00FF, no text, no checkerboard`

### asset_16 — Lose broken candy badge
`A cracked broken colorful candy badge with sad but cute look, casual game lose icon, centered, flat solid magenta background #FF00FF, no text, no checkerboard`

### asset_17 — Mute icon
`A simple glossy blue circular mute speaker-off icon with slash, candy UI style, centered, flat solid magenta background #FF00FF, no text, no checkerboard`

### asset_18 — Unmute icon
`A simple glossy blue circular speaker-on icon with sound waves, candy UI style, centered, flat solid magenta background #FF00FF, no text, no checkerboard`

### asset_19 — Moves counter badge
`A circular blue moves-counter badge with white looping arrows around an empty center for a number, casual puzzle HUD, centered, flat solid magenta background #FF00FF, no numbers, no text, no checkerboard`
