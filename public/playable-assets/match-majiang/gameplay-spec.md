# Match Majiang — Gameplay Specification

> Semantic gameplay reference. Resolve assets by matching **category + tags** against `asset-index.json`. No filenames are hardcoded.

---

## 1. Overview

A **zen pond-themed mahjong solitaire** playable ad. The player matches free identical tiles on a stacked butterfly-style layout above a lotus pond, feeds the panda three special foods, and is guided toward downloading the advertised app.

- **Genre**: Mahjong solitaire / pair-match puzzle
- **Duration**: ~30 seconds per round
- **Objective**: Collect all **3** panda foods (bamboo shoot, apple, carrot) into the collection box to win

---

## 2. Scene Layout

```
┌──────────────────────────────┐
│ [panda collection box]       │
│  🎋  🍎  🥕   (3 wells)      │
│                              │
│      🀫 🀪   🀫 🀪            │
│    🀩 🀨 🀧 🀨 🀩              │  stacked tiles
│      🀫 🀪   🀫 🀪            │  (butterfly shape)
│                              │
│  🐼 panda   🍃 lily  🌸      │
│        [CTA button]          │
└──────────────────────────────┘
```

Suggested layout for playable: compact **butterfly / X stack** (3–4 layers), portrait mobile. Place the panda mascot beside the board; collection box at top (or near panda).

---

## 3. Core Mechanics

### 3.1 Base Rules

| Aspect | Detail |
|--------|--------|
| **Input** | Tap a free tile, then tap its matching free pair |
| **Free tile** | No tile immediately covering it, and at least one of left/right sides open |
| **Match** | Two tiles with the same face remove from the board |
| **Win** | Collect all 3 special objects (bamboo shoot, apple, carrot) into the panda collection box |
| **Lose** | No free matching pairs left, or timer/moves exhausted before all 3 collected |

### 3.2 Board Tokens

Resolve from `category: gem` / tags `mahjong-tile`, `match-pair`:

| Face | Tags to match |
|------|---------------|
| Mouse 4 | `mouse`, `animal`, `rank-4` |
| Cat 3 | `cat`, `animal`, `rank-3` |
| Rooster 2 | `rooster`, `animal`, `rank-2` |
| Red dragon 中 | `zhong`, `red-dragon` |
| Green dragon 發 | `fa`, `green-dragon` |
| South wind 南 | `nan`, `south-wind` |
| Sunflower | `sunflower`, `flower` |
| Blossom | `blossom`, `flower` |
| Blue frame | `frame`, `white-dragon` |
| Green wave | `wave`, `ornament` |
| Two dots | `dots`, `circles` |
| Bamboo 3 / 2 | `bamboo` |
| One dot floral | `dot`, `circle` |
| Character 一 / 二 | `characters`, `yi` / `er` |
| Peacock | `peacock`, `bird` |

Use **pairs of each face** on the board (standard mahjong solitaire). For short playables, use 6–10 unique faces (12–20 tiles).

### 3.3 Special Objects (Panda Foods)

Resolve from `category: special` / tags `collectible`, `panda-food`. Mapped in `gameMechanics.specialObjects`:

| Object | Tags |
|--------|------|
| Bamboo shoot | `bamboo-shoot`, `bamboo` |
| Apple | `apple`, `fruit` |
| Carrot | `carrot`, `vegetable` |

- Place one of each on/near the board as collect targets (or reveal as pairs are cleared).
- When collected, animate into the matching well on the panda **collection box** (`category: ui`, tags `collection-box`).
- **Collect all 3 → win.**

### 3.4 Visual States

| State | Resolve by | Notes |
|-------|------------|-------|
| Locked / buried | `category: effect` + `locked` / `dim` | Tint buried tiles darker |
| Selected / free highlight | `category: effect` + `select` / `highlight` | Show on currently tapped free tile |
| Match remove | scale-out / fade | Optional sparkle; no hard-coded particle asset required |

### 3.5 Difficulty

| Difficulty | Unique faces | Layers | Timer / moves |
|------------|--------------|--------|---------------|
| Easy | 6 | 2 | 45s or unlimited |
| Normal | 8–10 | 3 | 35s |
| Hard | 12–14 | 4 | 25s |

---

## 4. Visual Design

### 4.1 Scene Assets

| Role | Category | Tags to match |
|------|----------|---------------|
| Main background | `background` | `primary-bg`, `pond`, `scenic` |
| Board tray panel | `background` | `board-background`, `primary-board-bg`, `bamboo`, `simple` |
| Panda mascot | `character` | `mascot`, `panda` |
| Collection box | `ui` | `collection-box`, `jade`, `panda-theme` |
| Special objects | `special` | `panda-food`, `collectible` |
| Lily pad decor | `decoration` | `lily-pad` |
| Lotus decor | `decoration` | `lotus`, `water-lily` |
| CTA button | `ui` | `cta`, `button`, `wide` |
| Win badge | `ui` | `win`, `victory` |
| Lose badge | `ui` | `lose`, `failure` |
| End panel | `ui` | `panel`, `end-screen` |
| Mute / unmute | `ui` | `mute` / `unmute` |
| Layout reference | `reference` | `screenshot`, `layout` |

### 4.2 Art Direction

- White tile faces with **leaf-green 3D rims**
- Calm pond palette: jade, mist green, soft pink lotus
- Flat casual-game icons (animals, flowers, classic mahjong honors)
- Soft 3D panda mascot + food collectibles matching jade collection tray

---

## 5. Playable Flow

1. Show pond backdrop + panda + empty collection box (3 wells) + stacked tiles
2. Brief hint: highlight one free matching pair / first collectible
3. Player clears pairs; each special food collected pops into a box well
4. All 3 foods collected → victory badge + CTA; fail → failure badge + CTA
5. CTA always visible near bottom after first interaction

---

## 6. Asset Resolution Rules

1. Prefer `globalTags.gameMechanics` mappings when present
2. Otherwise resolve by `category` + `tags` + `usage`
3. Never hardcode filenames in gameplay code — always go through the index
