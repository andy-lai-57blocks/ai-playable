# Match Game — Candy Theme Gameplay Specification

> Semantic gameplay reference. Resolve assets by matching **category + tags** against `asset-index.json`. No filenames are hardcoded.
>
> Original candy match-3 theme for playable ads. Not affiliated with any commercial candy puzzle brand.

---

## 1. Overview

A **glossy candy match-3** playable ad. The player swaps sugary pieces on a bright blue board, triggers special candies, and clears chocolate objectives before moves run out.

- **Genre**: Match-3 casual puzzle
- **Duration**: ~30 seconds per round
- **Objective**: Reach target score and/or collect chocolate goals within limited moves

---

## 2. Scene Layout

```
┌──────────────────────────────┐
│ [bear candy collection box]  │
│ score | moves | objectives   │
├──────────────────────────────┤
│ [sky-blue board background]  │
│                              │
│   ○ ▬ ▢ ● ▬                 │
│   ▢ ● ○ ▢ ●                 │
│   ● ▬ ▢ ○ ▬                 │
│   ○ ● ▬ ▢ ●                 │
│                              │
│        [CTA button]          │
└──────────────────────────────┘
```

Suggested board size for playable: **6×8** (portrait) or **6×6** (compact).

---

## 3. Core Mechanics

### 3.1 Base Rules

| Aspect | Detail |
|--------|--------|
| **Input** | Tap/swap adjacent candies |
| **Scoring** | Match 3+ in a row/column |
| **Special creation** | Match 4 → striped; Match 5 / L/T → wrapped; Match 5+ line → color bomb |
| **Win** | Score ≥ target AND objectives complete (or either, per difficulty) |
| **Lose** | Moves exhausted with goals incomplete |

### 3.2 Board Tokens

Resolve from `category: gem`:

| Candy | Tags |
|-------|------|
| Blue striped sphere | `blue`, `striped`, `sphere` |
| Green striped bar | `green`, `striped`, `vertical` |
| Yellow lemon-drop | `yellow`, `teardrop` |
| Cyan soft hexagon | `cyan`, `hexagon` |
| Chocolate sprinkle sphere | `chocolate`, `sprinkles`, `sphere` |
| Purple heart | `purple`, `heart` |
| Red wrapped candy | `red`, `wrapped` |

### 3.3 Special Candies

Resolve from `category: special`:

| Special | Tags | Effect |
|---------|------|--------|
| Color bomb | `color-bomb`, `sprinkles` | Clears all candies of one chosen color |
| Striped power-up | `striped`, `power-up` | Clears entire row or column |
| Wrapped power-up | `wrapped`, `power-up` | Clears a local blast area |

Each special should optionally use mapped glow overlays from `globalTags.gameMechanics.specialGlowEffects`.

### 3.4 Objectives

- Primary collectible: `category: collectible`, tags `chocolate`, `objective`
- HUD shows progress like `collected / target` (e.g. `2/10`)

---

## 4. Visual Mapping Rules

| Role | Category | Tags to match |
|------|----------|---------------|
| Main background | `background` | `main-background`, `candy-world`, `primary-bg` |
| Board surface | `background` | `board-background`, `primary-board-bg`, `panel` |
| Collection box | `ui` | `collection-box`, `pink`, `frosting`, `cream` |
| Moves badge | `ui` | `moves`, `counter`, `circle` |
| Objective icon | `collectible` | `chocolate`, `objective` |
| End panel | `ui` | `panel`, `end-screen` |
| CTA | `ui` | `cta`, `button`, `wide` |
| Win badge | `ui` | `win`, `star` |
| Lose badge | `ui` | `lose`, `broken-candy` |
| Sound mute/unmute | `ui` | `sound`, `mute` / `unmute` |

### Color Palette

```
Board BG:   sky blue (#3B6FB8 → #2F5FA8)
HUD:        mint teal (#44D4B5)
Accent CTA: candy pink (#FF5FA2)
Text:       white (#FFFFFF)
```

---

## 5. Difficulty Presets

| Difficulty | Board | Candy types | Moves | Score target | Chocolate goal |
|------------|-------|-------------|-------|--------------|----------------|
| Easy | 6×6 | 4 | 25 | 150 | 5 |
| Normal | 6×8 | 4 | 20 | 300 | 10 |
| Hard | 6×8 | 4 + specials | 15 | 450 | 12 |

Default for playable ads: **Normal**.

---

## 6. End Screen Logic

### Win
- Show `win` star badge + end panel + CTA
- Copy: **"Sweet Victory! Play Now"**

### Lose
- Show `lose` broken-candy badge + retry + CTA
- Copy: **"Almost There! Try Again"**

---

## 7. CTA Contract

- **Asset**: `category: ui`, tags `cta`, `button`, `wide`
- **Action**: `parent.postMessage("download", "*")`
- **Copy candidates**: "Play Now" / "Install" / "Crush More Levels"

---

## 8. AI Generation Guide

1. Load `asset-index.json`.
2. Resolve HUD + board roles via tags (§4).
3. Place board tokens from `category: gem`.
4. Inject specials from `category: special` for Hard / late-game moments.
5. Implement swap → match → clear → gravity → cascade.
6. Track score, moves, and chocolate objective progress.
7. Render win/lose panel with CTA.
8. Output a single self-contained HTML playable.
