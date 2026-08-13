# Match Game — Gameplay Specification

> Semantic gameplay reference. AI should resolve assets by matching the **tags** and **descriptions** below against `asset-index.json`. No filenames are hardcoded.

---

## 1. Overview

A **royal treasure-themed** gem-collection playable ad. The player collects gems in a palace setting, opens treasure chests for rewards, and is guided toward downloading the advertised app.

- **Genre**: Gem collection / match-style casual game
- **Duration**: ~30 seconds per round
- **Objective**: Reach the target score within limited moves

---

## 2. Scene Layout

```
┌──────────────────────────────┐
│  [palace background]         │
│                              │
│  ┌─ [title banner] ────────┐│
│  │     GAME TITLE           ││
│  └──────────────────────────┘│
│                              │
│  ┌─── Game Board ───────────┐│
│  │  💎  💠  🔮  💎  💠     │ │  [board texture]
│  │  🔮  💎  💠  🔮  💎     │ │
│  │  💠  🔮  💎  💠  🔮     │ │
│  │  💎  💠  🔮  💎  💠     │ │
│  │  🔮  💎  💠  🔮  💎     │ │
│  └──────────────────────────┘ │
│                              │
│  ⭐ Score: 150  🎯 Target: 300│
│  🔄 Moves left: 8            │
│                              │
│  ┌──────────────────────┐    │
│  │    [CTA button]       │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

---

## 3. Core Mechanics

### 3.1 Base Rules

| Aspect | Detail |
|--------|--------|
| **Input** | Tap/swap adjacent gems |
| **Scoring** | Match 3+ gems in a row/column to score |
| **Win condition** | Reach target score |
| **Lose condition** | Run out of moves before reaching target |

### 3.2 Gem Tokens

Select from assets tagged `category: gem` in the index. Required colors and suggested matches:

| Color | Tags to match | Rarity |
|-------|--------------|--------|
| Red | `ruby`, `red` | Common |
| Blue | `sapphire`, `blue` | Common |
| Pink | `pink`, `diamond` | Uncommon |
| Orange | `topaz`, `orange`, `amber` | Common |
| Green | `emerald`, `green` | Common |
| Purple | `amethyst`, `purple` | Common |
| White | `white`, `diamond`, `clear`, `special` | Rare (wildcard) |
| Gold | `golden`, `crown`, `large`, `bonus` | Legendary (bonus score) |

### 3.3 Difficulty Levels

| Difficulty | Board | Gem types | Moves | Target | Includes special gems |
|------------|-------|-----------|-------|--------|----------------------|
| Easy | 5×5 | 6 (common only) | 20 | 200 | No |
| Normal | 6×6 | 8 (common + uncommon) | 15 | 300 | No |
| Hard | 7×7 | 8 (includes rare + legendary) | 12 | 400 | Yes |

---

## 4. Visual Design

### 4.1 Scene Assets

Resolve from index by matching the tags listed below:

| Role | Category | Tags to match | Notes |
|------|----------|--------------|-------|
| Main background | `background` | `palace`, `interior`, `primary-bg`, `full-size` | The primary scene backdrop |
| Board texture | `background` | `pattern`, `texture`, `repeatable`, `golden` | Tileable pattern for the game board area |
| Title banner | `ui` | `banner`, `ribbon`, `golden`, `horizontal`, `wide` | Top-of-screen title bar |
| Score panel | `ui` | `panel`, `card`, `golden-border` | Score/moves info container |
| Result panel | `ui` | `panel`, `scroll`, `parchment`, `vertical`, `end-screen` | End-game results overlay |
| Portrait frame | `frame` | `ornate`, `circular`, `medallion`, `large` | Character avatar container |
| CTA button | `ui` | `cta`, `button`, `banner`, `wide`, `golden` | Primary download call-to-action |
| Small button | `button` | `button`, `golden`, `small`, `rounded` | Secondary action buttons |
| Progress bar | `ui` | `bar`, `horizontal`, `golden` | Moves/time indicator |

### 4.2 Decorations

| Role | Category | Tags to match | Notes |
|------|----------|--------------|-------|
| Corner ornaments | `frame` | `decorative`, `frame`, `ornament`, `golden` | UI border flourishes |
| Glow / highlight | `icon` | `glow`, `sparkle`, `golden` | Selection or match effect |
| Crown icon | `icon` | `crown`, `golden`, `royal` | Rank / achievement badge |
| Key icon | `icon` | `key`, `golden`, `royal` | Unlock / completion badge |

### 4.3 Color Palette

```
Background: deep purple gradient (#1a1a2e → #2d1b4e → #1a1a2e)
Accent:     gold (#ffd700)
Panel:      translucent dark (rgba(255,255,255,0.08))
Text:       white (#ffffff)
```

---

## 5. Game Flow

```
  START
    │
    ▼
┌──────────────┐
│ Round start   │  Show [main background] + [title banner]
│ Init board    │  Randomly place [gem tokens] on grid
│ Show UI       │  Score panel, moves counter
└────┬─────────┘
     │
     ▼
┌──────────────┐
│ Player input  │  Tap/swap gems
│ Match check   │  3+ in row/column → remove, add score
│ Play effect   │  [glow effect] particles at match positions
│ Cascade       │  Gravity fill empty cells → re-check for chains
└────┬─────────┘
     │
     ├── Score ≥ target ──► ┌──────────────┐
     │                      │ WIN SCREEN     │
     │                      │  [result panel] as overlay
     │                      │  [open chest]: coins spilling
     │                      │  [star badges] for rating
     │                      │  [CTA button]: "Install Now"
     │                      └────┬─────────┘
     │                           │
     ├── Moves exhausted ─► ┌──────────────┐
     │                      │ LOSE SCREEN    │
     │                      │  [result panel] as overlay
     │                      │  [closed chest]
     │                      │  Retry prompt
     │                      └────┬─────────┘
     │                           │
     ▼                           ▼
┌──────────────┐          ┌──────────────┐
│ Continue play │          │ Tap CTA       │
└──────────────┘          │ → download    │
                          └──────────────┘
```

---

## 6. Characters

Three character portraits available. Match via `category: character`:

| Role | Tags to match | Suggested personality |
|------|--------------|----------------------|
| Protagonist | `boy`, `red-hair`, `protagonist` | Brave treasure hunter |
| Companion | `girl`, `purple-hair` | Wise mage |
| Guide | `boy`, `blonde-hair` | Royal guard |

Characters may appear in: opening dialogue, combo streak reactions, result screen.

---

## 7. Rewards & Feedback

### 7.1 Treasure Chest

Two states, match via `category: chest`:

| State | Tags to match | When |
|-------|--------------|------|
| Closed | `closed`, `treasure-chest`, `sparkle` | During gameplay, on loss |
| Open | `open`, `coins`, `gems`, `spilling` | On win |

### 7.2 Star Ratings

Match via `category: reward`, `tags: star, golden`:

| Stars | Condition |
|-------|-----------|
| ⭐ | Score ≥ target |
| ⭐⭐ | Score ≥ target × 1.5 |
| ⭐⭐⭐ | Score ≥ target × 2 |

### 7.3 Sound (suggested)

- Gem match → crisp clink
- Chest open → coins clattering
- Victory → triumphant fanfare
- Defeat → gentle chime

---

## 8. CTA

Displayed on the end screen:

- **Asset**: match `category: ui`, `tags: cta, button, wide, golden`
- **Copy**: "Install Now" / "Play Now" / "Get the Game"
- **Action**: `parent.postMessage("download", "*")`

---

## 9. AI Generation Guide

1. **Load** `asset-index.json` — all assets with tags, categories, and HTTP URLs.
2. **Resolve each scene role** by matching category + tags from the tables in §4 and §7 against the index.
3. **Pick gem set** from `category: gem` — choose the right count per difficulty (§3.3).
4. **Pick difficulty params** — board size, move count, target score (§3.3).
5. **Assemble HTML** — layer background, board, UI, and tokens using resolved asset URLs.
6. **Implement logic** — swap → match → remove → gravity fill → cascade → end check.
7. **End screen** — show the appropriate chest state, star rating, and CTA.
8. **Output** — single self-contained HTML file.
