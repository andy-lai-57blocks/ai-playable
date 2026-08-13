# Match Candy — Gameplay Specification

> Semantic gameplay reference. Resolve assets by matching **category + tags** against `asset-index.json`. No filenames are hardcoded.
>
> This spec mirrors the actual `phaser-match` engine: **collect-to-bottom** mode.

---

## 1. Overview

A **glossy candy match-3** playable ad. The player swaps candies on a jelly-blue 6×8 board. Three special collectibles (lemon drop, heart candy, chocolate bar) start near the top of the board; as the player clears candies beneath them, they fall one row at a time. When each reaches the bottom row it is collected onto the pink frosting collection box. A cute candy bear mascot cheers beside the board.

- **Genre**: Match-3 / collect-to-bottom puzzle
- **Duration**: 3-minute round (180s timer)
- **Objective**: Drop and collect all **3** special objects to win; timeout = lose

---

## 2. Scene Layout

```
┌──────────────────────────────┐
│ 🍋 ♥ 🍫  (mini HUD slots)   │
│                              │
│  [jelly-blue board 6×8]   🐻 │
│   ○ ▬ ● ▢ ● ○ ▬             │
│   🍋 ♥ 🍫  (specials)       │
│   ● ○ ▬ ● ○ ▢               │
│   ...                        │
│                              │
│   [pink frosting box 3 wells]│
│        [CTA button]          │
└──────────────────────────────┘
```

Board: **6×8 portrait**. Collection box (stool) at the bottom; bear mascot beside the board.

---

## 3. Core Mechanics

### 3.1 Base Rules

| Aspect | Detail |
|--------|--------|
| **Input** | Tap two adjacent candies to swap, or tap and drag/swipe one cell |
| **Match** | 3+ identical candies in a row/column clear with a particle burst |
| **Fall & refill** | Candies above fall down; new candies refill from the top; chains resolve automatically |
| **Invalid swap** | Swaps that create no match revert automatically |
| **Special objects** | Cannot be swapped and never match; they fall one row whenever the cell below empties |
| **Win** | All 3 specials reach the bottom row and land on the collection box |
| **Lose** | 180-second timer runs out before all 3 are collected |

### 3.2 Board Tokens

Resolve from `category: gem` + `board-token` (5 types, mapped in `gameMechanics.boardGems`):

| Candy | Tags to match |
|-------|---------------|
| Blue striped sphere | `blue`, `striped`, `sphere` |
| Green striped bar | `green`, `striped`, `vertical` |
| Cyan hexagon pillow | `cyan`, `hexagon` |
| Chocolate sprinkle sphere | `chocolate`, `sprinkles`, `sphere` |
| Red wrapped square | `red`, `wrapped`, `square` |

### 3.3 Special Objects (Collectibles)

Resolve from `category: special` + `collect-to-bottom` (mapped in `gameMechanics.specialObjects`):

| Object | Tags to match |
|--------|---------------|
| Lemon drop (yellow teardrop) | `lemon`, `yellow`, `teardrop` |
| Heart candy (purple) | `heart`, `purple` |
| Chocolate bar (objective icon) | `chocolate`, `bar`, `objective` |

- Spawn near the top of the board (rows 0–1, distinct columns).
- Each lands in its own well on the pink frosting **collection box** (`category: ui` + `collection-box`, `collect-stool`; `gameMechanics.collectionShelf`).
- Mini HUD icons top-left show collection progress (dim → lit).

### 3.4 Layout Tunables (from `gameMechanics`)

| Key | Value | Meaning |
|-----|-------|---------|
| `stoolLift` | 36 | Lifts the collection box above the bottom edge |
| `stoolLandOffset` | 0 | Vertical offset when a special lands |
| `charYOffset` | 50 | Vertical offset for the bear mascot |
| `boardYOffset` | 20 | Board vertical offset |

### 3.5 Difficulty

| Difficulty | Board | Target score | Timer |
|------------|-------|--------------|-------|
| Easy | 6×8 | 300 | 180s |
| Normal | 6×8 | 400 | 180s |
| Hard | 6×8 | 500 | 180s |

Collect mode always ends at 3/3 collected (win) or timeout (lose).

---

## 4. Visual Design

### 4.1 Scene Assets

| Role | Category | Tags to match |
|------|----------|---------------|
| Main background | `background` | `main-background`, `candy-world`, `primary-bg` |
| Board surface | `background` | `board-background`, `primary-board-bg`, `grid-6x8` |
| Bear mascot | `character` | `bear`, `mascot`, `protagonist` |
| Collection box (stool) | `ui` | `collection-box`, `collect-stool`, `pink`, `frosting` |
| Special objects | `special` | `collect-to-bottom` |
| Win badge | `ui` | `win`, `victory`, `star` |
| Lose badge | `ui` | `lose`, `failure`, `broken-candy` |
| End panel | `ui` | `panel`, `end-screen` |
| CTA button | `ui` | `cta`, `button`, `wide` |
| Mute / unmute | `ui` | `mute` / `unmute` |

### 4.2 Art Direction

- 3D-glossy, candy-coated casual style
- Bright pastel palette: candy-blue, candy-green, candy-red, mint-teal, chocolate-brown, sky-blue
- Soft rounded shapes, glossy highlights, sprinkles

---

## 5. Playable Flow

1. Show candy-world backdrop, jelly-blue board, bear mascot, empty collection box (3 wells)
2. Board fills with 5 candy types; 3 specials appear near the top
3. Player swaps candies; matches burst with particles; specials drop as cells below clear
4. Each special reaching the bottom row tweens into a collection-box well (mini HUD icons light up)
5. All 3 collected → "Sweet!" win badge + CTA; timer out → "Failed!" lose badge + CTA
6. CTA posts `parent.postMessage("download", "*")`

---

## 6. Asset Resolution Rules

1. Prefer `globalTags.gameMechanics` mappings when present
2. Otherwise resolve by `category` + `tags` + `usage`
3. Never hardcode filenames in gameplay code — always go through the index
