#!/usr/bin/env python3
"""Build match-majiang PNG assets + asset-index.json from screenshot + generated tiles."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent
ASSETS_GEN = Path(
    "/Users/57block/.cursor/projects/Users-57block-57blocks-57creative-apps-demo2-public-playable-assets/assets"
)
SRC = ROOT / "_source.jpg"
OUT = ROOT
TILE_W, TILE_H = 160, 192


def chroma_magenta(im: Image.Image, thresh: float = 70, soft: float = 35) -> Image.Image:
    im = im.convert("RGBA")
    a = np.asarray(im).astype(np.float32)
    r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    dist = np.sqrt((r - 255) ** 2 + (g - 0) ** 2 + (b - 255) ** 2)
    mag_score = (r + b) / 2 - g
    is_mag = (dist < thresh * 3.2) | ((mag_score > 80) & (g < 90) & (r > 140) & (b > 140))
    alpha = np.where(is_mag, 0, al)
    out = a.copy()
    out[:, :, 3] = alpha
    img = Image.fromarray(out.astype(np.uint8), "RGBA")
    bb = img.getbbox()
    return img.crop(bb) if bb else img


def fit_canvas(img: Image.Image, tw: int, th: int, pad: int = 8) -> Image.Image:
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    tmp = img.copy()
    tmp.thumbnail((tw - pad * 2, th - pad * 2), Image.Resampling.LANCZOS)
    canvas.paste(tmp, ((tw - tmp.width) // 2, (th - tmp.height) // 2), tmp)
    return canvas


def entry(aid: str, cat: str, desc: str, tags: list, usage: list, img: Image.Image, outp: Path) -> dict:
    return {
        "file": f"{aid}.png",
        "category": cat,
        "tags": tags,
        "description": desc,
        "usage": usage,
        "path": f"./match-majiang/{aid}.png",
        "size": outp.stat().st_size,
        "dimensions": f"{img.width}x{img.height}",
        "format": "png",
        "url": f"http://localhost:4000/uploads/playable-assets/match-majiang/{aid}.png",
    }


def main() -> None:
    asset_meta: list[dict] = []

    gen_map = [
        (
            "tile_mouse4_gen.png",
            "asset_00",
            "gem",
            "Pink mouse mahjong tile with green number 4",
            ["board-token", "mouse", "animal", "rank-4", "mahjong-tile", "match-pair"],
        ),
        (
            "tile_cat3_gen.png",
            "asset_01",
            "gem",
            "Blue cat mahjong tile with green number 3",
            ["board-token", "cat", "animal", "rank-3", "mahjong-tile", "match-pair"],
        ),
        (
            "tile_rooster2_gen.png",
            "asset_02",
            "gem",
            "Blue rooster mahjong tile with green number 2",
            ["board-token", "rooster", "animal", "rank-2", "mahjong-tile", "match-pair"],
        ),
        (
            "tile_zhong_gen.png",
            "asset_03",
            "gem",
            "Red dragon 中 mahjong tile",
            ["board-token", "zhong", "red-dragon", "honor", "mahjong-tile", "match-pair", "red"],
        ),
        (
            "tile_fa_gen.png",
            "asset_04",
            "gem",
            "Green dragon 發 mahjong tile",
            ["board-token", "fa", "green-dragon", "honor", "mahjong-tile", "match-pair", "green"],
        ),
        (
            "tile_nan_gen.png",
            "asset_05",
            "gem",
            "South wind 南 mahjong tile",
            ["board-token", "nan", "south-wind", "honor", "mahjong-tile", "match-pair", "black"],
        ),
        (
            "tile_sunflower_gen.png",
            "asset_06",
            "gem",
            "Sunflower flower mahjong tile",
            ["board-token", "sunflower", "flower", "mahjong-tile", "match-pair", "yellow"],
        ),
        (
            "tile_blossom_gen.png",
            "asset_07",
            "gem",
            "Pink cherry blossom flower mahjong tile",
            ["board-token", "blossom", "flower", "mahjong-tile", "match-pair", "pink"],
        ),
        (
            "tile_frame_gen.png",
            "asset_08",
            "gem",
            "Blue ornate frame white-dragon style mahjong tile",
            ["board-token", "frame", "white-dragon", "honor", "mahjong-tile", "match-pair", "blue"],
        ),
        (
            "tile_wave_gen.png",
            "asset_09",
            "gem",
            "Green wave/scroll decorative mahjong tile",
            ["board-token", "wave", "ornament", "mahjong-tile", "match-pair", "green"],
        ),
        (
            "tile_dots2_gen.png",
            "asset_10",
            "gem",
            "Two-dots mahjong tile (blue and floral circles)",
            ["board-token", "dots", "circles", "suit", "mahjong-tile", "match-pair"],
        ),
        (
            "tile_bamboo3_gen.png",
            "asset_11",
            "gem",
            "Three-bamboo mahjong tile",
            ["board-token", "bamboo", "suit", "mahjong-tile", "match-pair", "green"],
        ),
        (
            "tile_dot1_gen.png",
            "asset_12",
            "gem",
            "Ornate one-dot floral circle mahjong tile",
            ["board-token", "dot", "circle", "suit", "mahjong-tile", "match-pair"],
        ),
        (
            "tile_yi_gen.png",
            "asset_13",
            "gem",
            "Character 一 (one) blue bar mahjong tile",
            ["board-token", "characters", "yi", "one", "suit", "mahjong-tile", "match-pair", "blue"],
        ),
        (
            "tile_er_gen.png",
            "asset_14",
            "gem",
            "Character 二 (two) blue bars mahjong tile",
            ["board-token", "characters", "er", "two", "suit", "mahjong-tile", "match-pair", "blue"],
        ),
        (
            "tile_peacock_gen.png",
            "asset_15",
            "gem",
            "Peacock bird mahjong tile",
            ["board-token", "peacock", "bird", "animal", "mahjong-tile", "match-pair", "teal"],
        ),
        (
            "tile_bamboo2_gen.png",
            "asset_16",
            "gem",
            "Two-bamboo mahjong tile",
            ["board-token", "bamboo", "suit", "mahjong-tile", "match-pair", "green"],
        ),
    ]

    for src_name, aid, cat, desc, tags in gen_map:
        p = ASSETS_GEN / src_name
        if not p.exists():
            raise SystemExit(f"MISSING {p}")
        img = fit_canvas(chroma_magenta(Image.open(p)), TILE_W, TILE_H)
        outp = OUT / f"{aid}.png"
        img.save(outp, optimize=True)
        asset_meta.append(
            entry(aid, cat, desc, tags, ["board-token", "match-element", "mahjong-tile"], img, outp)
        )
        print("tile", aid, img.size, outp.stat().st_size)

    ui_map = [
        (
            "ui_cta_gen.png",
            "asset_17",
            "ui",
            "Wide jade CTA button with empty center",
            ["cta", "button", "wide", "jade", "green"],
            ["cta-button", "install-button", "action-banner"],
            (512, 180),
        ),
        (
            "ui_win_gen.png",
            "asset_18",
            "ui",
            "Golden victory star win badge",
            ["win", "victory", "star", "end-screen", "large"],
            ["win-display", "end-screen", "victory-icon"],
            (256, 256),
        ),
        (
            "ui_mute_gen.png",
            "asset_19",
            "ui",
            "Mute sound icon",
            ["sound", "mute", "icon", "button", "small"],
            ["sound-toggle", "mute-button", "ui-icon"],
            (128, 128),
        ),
        (
            "ui_unmute_gen.png",
            "asset_20",
            "ui",
            "Unmute sound icon",
            ["sound", "unmute", "icon", "button", "small"],
            ["sound-toggle", "unmute-button", "ui-icon"],
            (128, 128),
        ),
    ]
    for src_name, aid, cat, desc, tags, usage, size in ui_map:
        img = fit_canvas(chroma_magenta(Image.open(ASSETS_GEN / src_name)), size[0], size[1], pad=4)
        outp = OUT / f"{aid}.png"
        img.save(outp, optimize=True)
        asset_meta.append(entry(aid, cat, desc, tags, usage, img, outp))
        print("ui", aid, img.size)

    # Background from screenshot (inpaint tile mass)
    src = Image.open(SRC).convert("RGB")
    bg = src.resize((src.width * 2, src.height * 2), Image.Resampling.LANCZOS)
    arr = np.asarray(bg).astype(np.float32)
    h, w = arr.shape[:2]
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = (mx - mn) / (mx + 1e-6)
    tile_mask = (lum > 140) & (sat < 0.55) & (r > 110)
    board = np.zeros_like(tile_mask)
    board[int(h * 0.25) : int(h * 0.72), int(w * 0.1) : int(w * 0.9)] = True
    tile_mask = ndimage.binary_dilation(tile_mask & board, iterations=8)
    blur = ndimage.gaussian_filter(arr, sigma=(25, 25, 0))
    arr2 = arr.copy()
    arr2[tile_mask] = blur[tile_mask]
    arr2 = np.where(tile_mask[:, :, None], ndimage.gaussian_filter(arr2, sigma=(8, 8, 0)), arr2)
    bg_clean = Image.fromarray(np.clip(arr2, 0, 255).astype(np.uint8))
    bg_out = bg_clean.resize((1152, 2048), Image.Resampling.LANCZOS)

    sq = Image.new("RGB", (2048, 2048))
    tmp = bg_clean.resize((1152, 2048), Image.Resampling.LANCZOS)
    left = tmp.crop((0, 0, 1, 2048)).resize(((2048 - 1152) // 2, 2048))
    right = tmp.crop((1151, 0, 1152, 2048)).resize(((2048 - 1152) // 2, 2048))
    sq.paste(left, (0, 0))
    sq.paste(right, (1152 + (2048 - 1152) // 2, 0))
    sq.paste(tmp, ((2048 - 1152) // 2, 0))

    aid = "asset_21"
    outp = OUT / f"{aid}.png"
    sq.save(outp, optimize=True)
    asset_meta.append(
        entry(
            aid,
            "background",
            "MAIN BACKGROUND: Serene green pond scene with misty sky, tree silhouettes, lily pads and lotus — primary mahjong solitaire backdrop (tiles inpainted out from source screenshot).",
            ["main-background", "pond", "nature", "lily", "primary-bg", "full-size", "scenic"],
            ["main-background", "scene", "game-board-backdrop", "end-screen-background"],
            sq,
            outp,
        )
    )
    print("bg", aid, sq.size, outp.stat().st_size)

    aid = "asset_22"
    outp = OUT / f"{aid}.png"
    bg_out.save(outp, optimize=True)
    asset_meta.append(
        entry(
            aid,
            "background",
            "BOARD BACKGROUND: Portrait pond scene for the mahjong layout area.",
            ["board-background", "portrait", "pond", "nature", "primary-board-bg", "vertical", "large"],
            ["board-background", "game-board-surface", "primary-board-bg"],
            bg_out,
            outp,
        )
    )
    print("board-bg", aid, bg_out.size)

    # Lily pads & lotus from pond
    h0, w0 = src.size[1], src.size[0]
    pond = src.crop((0, int(h0 * 0.72), w0, h0)).convert("RGBA")
    pa = np.asarray(pond).astype(np.float32)
    pr, pg, pb = pa[:, :, 0], pa[:, :, 1], pa[:, :, 2]
    plum = 0.299 * pr + 0.587 * pg + 0.114 * pb
    pad_mask = (pg > pr + 15) & (pg > pb + 10) & (pg > 70) & (pg < 170) & (plum > 55) & (plum < 160)
    lotus_mask = (pr > pg + 25) & (pr > pb + 10) & (pr > 140) & (pg > 80)
    pad_mask = ndimage.binary_closing(ndimage.binary_opening(pad_mask, iterations=1), iterations=2)
    lotus_mask = ndimage.binary_closing(ndimage.binary_opening(lotus_mask, iterations=1), iterations=2)

    labeled, n = ndimage.label(pad_mask)
    pad_imgs: list[Image.Image] = []
    for i in range(1, n + 1):
        ys, xs = np.where(labeled == i)
        if len(xs) < 120:
            continue
        x0, x1 = int(xs.min()), int(xs.max())
        y0, y1 = int(ys.min()), int(ys.max())
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        if bw < 25 or bh < 18 or bw > 220 or bh > 160:
            continue
        aspect = bw / max(bh, 1)
        if aspect < 0.7 or aspect > 2.2:
            continue
        m = labeled == i
        rgba = np.zeros((bh, bw, 4), np.uint8)
        rgba[:, :, :3] = np.asarray(pond)[y0 : y1 + 1, x0 : x1 + 1, :3]
        rgba[:, :, 3] = (m[y0 : y1 + 1, x0 : x1 + 1] * 255).astype(np.uint8)
        pad_imgs.append(Image.fromarray(rgba, "RGBA"))
    print("lily pads found", len(pad_imgs))
    pad_imgs.sort(key=lambda im: im.width * im.height, reverse=True)
    for idx, aid in enumerate(["asset_23", "asset_24"]):
        if idx >= len(pad_imgs):
            break
        im = pad_imgs[idx]
        scale = max(2, int(round(180 / max(im.height, 1))))
        im = im.resize((im.width * scale, im.height * scale), Image.Resampling.LANCZOS)
        outp = OUT / f"{aid}.png"
        im.save(outp, optimize=True)
        asset_meta.append(
            entry(
                aid,
                "decoration",
                "Green lily pad decoration extracted from pond scene.",
                ["lily-pad", "pond", "nature", "decor", "green"],
                ["scene-decoration", "foreground-prop"],
                im,
                outp,
            )
        )
        print("pad", aid, im.size)

    labeled, n = ndimage.label(lotus_mask)
    lotus_imgs: list[Image.Image] = []
    for i in range(1, n + 1):
        ys, xs = np.where(labeled == i)
        if len(xs) < 40:
            continue
        x0, x1 = int(xs.min()), int(xs.max())
        y0, y1 = int(ys.min()), int(ys.max())
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        if bw < 12 or bh < 12 or bw > 120 or bh > 120:
            continue
        x0e = max(0, x0 - 4)
        y0e = max(0, y0 - 4)
        x1e = min(pond.width - 1, x1 + 4)
        y1e = min(pond.height - 1, y1 + 4)
        m = ndimage.binary_dilation(labeled == i, iterations=3)
        rgba = np.zeros((y1e - y0e + 1, x1e - x0e + 1, 4), np.uint8)
        rgba[:, :, :3] = np.asarray(pond)[y0e : y1e + 1, x0e : x1e + 1, :3]
        rgba[:, :, 3] = (m[y0e : y1e + 1, x0e : x1e + 1] * 255).astype(np.uint8)
        lotus_imgs.append(Image.fromarray(rgba, "RGBA"))
    print("lotus found", len(lotus_imgs))
    lotus_imgs.sort(key=lambda im: im.width * im.height, reverse=True)
    for idx, aid in enumerate(["asset_25", "asset_26"]):
        if idx >= len(lotus_imgs):
            break
        im = lotus_imgs[idx]
        scale = max(3, int(round(140 / max(im.height, 1))))
        im = im.resize((im.width * scale, im.height * scale), Image.Resampling.LANCZOS)
        outp = OUT / f"{aid}.png"
        im.save(outp, optimize=True)
        asset_meta.append(
            entry(
                aid,
                "decoration",
                "Pink lotus / water lily decoration extracted from pond scene.",
                ["lotus", "water-lily", "flower", "pond", "nature", "decor", "pink"],
                ["scene-decoration", "foreground-prop"],
                im,
                outp,
            )
        )
        print("lotus", aid, im.size)

    # Lose badge
    lose = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    d = ImageDraw.Draw(lose)
    d.ellipse([20, 20, 236, 236], fill=(90, 90, 90, 255), outline=(60, 60, 60, 255), width=6)
    d.ellipse([50, 50, 206, 206], fill=(120, 120, 120, 255))
    d.line([(80, 80), (176, 176)], fill=(200, 60, 60, 255), width=14)
    d.line([(176, 80), (80, 176)], fill=(200, 60, 60, 255), width=14)
    aid = "asset_27"
    outp = OUT / f"{aid}.png"
    lose.save(outp, optimize=True)
    asset_meta.append(
        entry(
            aid,
            "ui",
            "Lose/failure badge — gray medallion with red X for end screen.",
            ["lose", "failure", "end-screen", "large"],
            ["lose-display", "end-screen", "failure-icon"],
            lose,
            outp,
        )
    )

    dim = Image.new("RGBA", (TILE_W, TILE_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(dim)
    d.rounded_rectangle([4, 4, TILE_W - 5, TILE_H - 5], radius=18, fill=(30, 50, 40, 110))
    aid = "asset_28"
    outp = OUT / f"{aid}.png"
    dim.save(outp, optimize=True)
    asset_meta.append(
        entry(
            aid,
            "effect",
            "Semi-transparent dim overlay for locked/buried mahjong tiles.",
            ["dim", "locked", "overlay", "blocked-tile"],
            ["locked-overlay", "blocked-state"],
            dim,
            outp,
        )
    )

    glow = Image.new("RGBA", (TILE_W + 24, TILE_H + 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    d.rounded_rectangle([4, 4, TILE_W + 19, TILE_H + 19], radius=22, outline=(255, 230, 90, 220), width=6)
    d.rounded_rectangle([8, 8, TILE_W + 15, TILE_H + 15], radius=20, outline=(255, 255, 200, 120), width=3)
    aid = "asset_29"
    outp = OUT / f"{aid}.png"
    glow.save(outp, optimize=True)
    asset_meta.append(
        entry(
            aid,
            "effect",
            "Golden selection highlight frame for free/selected mahjong tile.",
            ["glow", "select", "highlight", "overlay"],
            ["selection-highlight", "free-tile-glow", "overlay"],
            glow,
            outp,
        )
    )

    panel = Image.new("RGBA", (512, 720), (0, 0, 0, 0))
    d = ImageDraw.Draw(panel)
    d.rounded_rectangle([16, 16, 496, 704], radius=36, fill=(245, 250, 240, 235), outline=(70, 140, 90, 255), width=8)
    d.rounded_rectangle([28, 28, 484, 692], radius=30, outline=(180, 210, 160, 200), width=3)
    aid = "asset_30"
    outp = OUT / f"{aid}.png"
    panel.save(outp, optimize=True)
    asset_meta.append(
        entry(
            aid,
            "ui",
            "Jade-framed end-screen panel for win/lose overlay text.",
            ["panel", "end-screen", "rounded", "jade"],
            ["end-screen-panel", "dialog-background"],
            panel,
            outp,
        )
    )

    # Keep original screenshot reference
    ref = src.copy()
    aid = "asset_31"
    outp = OUT / f"{aid}.png"
    ref.save(outp, optimize=True)
    asset_meta.append(
        entry(
            aid,
            "reference",
            "ORIGINAL SCREENSHOT reference — butterfly mahjong layout on pond scene (source for theme extraction).",
            ["reference", "screenshot", "layout", "source"],
            ["layout-reference", "theme-source"],
            ref,
            outp,
        )
    )

    def aid_num(a: dict) -> int:
        return int(a["file"].split("_")[1].split(".")[0])

    asset_meta.sort(key=aid_num)
    board_gems = [f"asset_{i:02d}" for i in range(0, 17)]
    index = {
        "$schema": "57creative-playable-asset-index",
        "source": {
            "url": "screenshot-extract://match-majiang",
            "engine": "Screenshot + Theme Spec Pack",
            "extractedAt": "2026-08-13",
            "totalAssets": len(asset_meta),
            "format": "png",
            "note": "Mahjong solitaire theme from pond screenshot. Unique tile faces recreated to match screenshot style (source tiles too small/overlapped for clean crop). Background, lily pads and lotus extracted from source image.",
        },
        "globalTags": {
            "theme": ["mahjong", "pond", "nature", "lotus", "zen", "asian"],
            "colorPalette": ["leaf-green", "white", "jade", "pink", "teal", "golden"],
            "mood": ["calm", "peaceful", "casual", "serene"],
            "artStyle": ["2d-cartoon", "casual-game", "flat-icon"],
            "gameGenre": ["mahjong-solitaire", "pair-match", "puzzle"],
            "gameMechanics": {
                "type": "mahjong-pair-match",
                "description": "Tap two identical free tiles (not blocked on left and right) to remove them as a matching pair. Clear the board to win.",
                "boardGems": board_gems,
                "specialObjects": [],
                "specialGlowEffects": {},
                "winDisplay": "asset_18",
                "loseDisplay": "asset_27",
                "endScreenPanel": "asset_30",
                "lockedOverlay": "asset_28",
                "selectionHighlight": "asset_29",
                "decorations": {"lilyPads": ["asset_23", "asset_24"], "lotus": ["asset_25", "asset_26"]},
                "soundIcons": {"mute": "asset_19", "unmute": "asset_20"},
            },
            "targetPlatforms": ["meta", "google-ads", "tiktok", "applovin", "liftoff"],
        },
        "assets": asset_meta,
        "baseUrl": "http://localhost:4000/uploads/playable-assets/match-majiang",
        "game": "match-majiang",
        "gameplaySpec": "gameplay-spec.md",
    }
    (OUT / "asset-index.json").write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n")
    print("Wrote asset-index.json with", len(asset_meta), "assets")
    print("Files:", sorted(p.name for p in OUT.glob("asset_*.png")))


if __name__ == "__main__":
    main()
