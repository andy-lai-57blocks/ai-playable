# Match Cat — Gameplay Specification

> Semantic gameplay reference. Resolve assets by matching **category + tags** against `asset-index.json`. No filenames are hardcoded.
>
> This spec mirrors the actual `phaser-match` engine: **collect-to-bottom** mode.

---

## 1. Overview

A **royal palace treasure** match-3 playable ad. The player swaps crown-jewel gems on a golden 6×8 board. Three jewel collectibles (amethyst, diamond, citrine) start near the top of the board; clearing gems beneath them makes them fall. When each reaches the bottom row it is collected onto a golden collection banner. A royal cat mascot — whose treasure chest opens as you progress — watches from a tall pedestal beside the board.

- **Genre**: Match-3 / collect-to-bottom puzzle
- **Duration**: 3-minute round (180s timer)
- **Objective**: Drop and collect all **3** jewels to win; timeout = lose

---

## 2. Scene Layout

```
┌──────────────────────────────┐
│ 💎 🔮 🌟  (mini HUD slots)  │
│                              │
│  [golden board 6×8]  [🐱cat] │
│   ● ○ ● ○ ● ○ ● ○           │  [tall pedestal]
│   💎 🔮 🌟  (specials)       │
│   ○ ● ○ ● ○ ● ○ ●           │
│   ...                        │
│                              │
│   [golden collection banner] │
│        [CTA button]          │
└──────────────────────────────┘
```

Board: **6×8 portrait**. Collection banner (stool) at the bottom; royal cat on its pedestal shelf beside the board.

---

## 3. Core Mechanics

### 3.1 Base Rules

| Aspect | Detail |
|--------|--------|
| **Input** | Tap two adjacent gems to swap, or tap and drag/swipe one cell |
| **Match** | 3+ identical crown jewels in a row/column clear with a golden particle burst |
| **Fall & refill** | Gems above fall down; new gems refill from the top; chains resolve automatically |
| **Invalid swap** | Swaps that create no match revert automatically |
| **Special objects** | Cannot be swapped and never match; they fall one row whenever the cell below empties |
| **Win** | All 3 jewels reach the bottom row and land on the collection banner |
| **Lose** | 180-second timer runs out before all 3 are collected |

### 3.2 Board Tokens

Resolve from `category: gem` + `board-token` (4 types, mapped in `gameMechanics.boardGems`):

| Crown jewel | Tags to match |
|-------------|---------------|
| Pink crown jewel | `crown`, `pink`, `crown-jewel` |
| Blue crown jewel | `crown`, `blue`, `crown-jewel` |
| Gold glowing jewel | `golden`, `glow`, `sparkle` |
| Gold crown gem | `crown`, `golden`, `match-element` |

### 3.3 Special Objects (Collectibles)

Resolve from `category: special` + `collect-to-bottom` (mapped in `gameMechanics.specialObjects`):

| Jewel | Tags to match | Glow overlay |
|-------|---------------|--------------|
| Amethyst (purple) | `purple`, `amethyst` | `glow-for-asset-22` |
| Diamond (white) | `white`, `diamond` | `glow-for-asset-23` |
| Citrine (yellow) | `yellow`, `citrine` | `glow-for-asset-26` |

- Glow overlays come from `category: effect` + `glow-for-*` (`gameMechanics.specialGlowEffects`); render behind each jewel.
- Spawn near the top of the board (rows 0–1, distinct columns).
- Each lands in a slot on the golden **collection banner** (`category: ui` + `collect-stool`).
- Mini HUD icons top-left show collection progress (dim → lit).

### 3.4 Cat Mascot States

Resolve from `category: character` + `cat` (`gameMechanics.character.catStates`, sorted by `cat-state-N`):

| State | Tags | When |
|-------|------|------|
| Closed chest | `treasure-chest`, `closed`, `cat-state-1` | Round start |
| Open chest (coins spilling) | `treasure-chest`, `open`, `cat-state-2` | 1–2 jewels collected |
| Royal protagonist | `protagonist`, `royal`, `cat-state-3` | All collected / win |

The cat stands on the tall pedestal shelf (`category: platform` + `cat-shelf`).

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
| Main background | `background` | `palace`, `interior`, `primary-bg` |
| Board surface | `background` | `board-background`, `primary-board-bg`, `golden-frame` |
| Cat mascot | `character` | `cat`, `mascot` |
| Pedestal shelf | `platform` | `cat-shelf`, `cat-platform` |
| Collection banner (stool) | `ui` | `collect-stool`, `cta`, `golden`, `wide` |
| Special jewels | `special` | `collect-to-bottom` |
| Glow effects | `effect` | `glow-for-*`, `sparkle` |
| Win medallion | `ui` | `win`, `victory`, `crown-jewel` |
| Lose medallion | `ui` | `lose`, `failure`, `medallion` |
| End panel | `ui` | `panel`, `card`, `golden-border` |
| CTA button | `ui` | `cta`, `button`, `wide` |
| Mute / unmute | `ui` | `mute` / `unmute` |

### 4.2 Art Direction

- 2D-cartoon, stylized casual-game style
- Premium royal palette: gold, purple, deep-blue, amber, warm-brown
- Palace interior with golden arches, chandelier, damask texture accents

---

## 5. Playable Flow

1. Show palace backdrop, golden board, cat with closed chest on its pedestal, empty collection banner (3 slots)
2. Board fills with 4 crown-jewel types; 3 glowing jewels appear near the top
3. Player swaps gems; matches burst with golden particles; jewels drop as cells below clear
4. Each jewel reaching the bottom row tweens into a banner slot (mini HUD icons light up); cat's chest opens as progress advances
5. All 3 collected → victory medallion + CTA; timer out → failure medallion + CTA
6. CTA posts `parent.postMessage("download", "*")`

---

## 6. Asset Resolution Rules

1. Prefer `globalTags.gameMechanics` mappings when present
2. Otherwise resolve by `category` + `tags` + `usage`
3. Never hardcode filenames in gameplay code — always go through the index
