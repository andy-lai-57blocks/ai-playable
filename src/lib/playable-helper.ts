import { assemblePlayable } from "@/lib/playable-shell";
import { getEngineIds } from "@/lib/engines";
import type { PlayableDesignSpec } from "@/lib/engines/engine.interface";
import { llmChat } from "@/lib/llm";
import { readFile } from "fs/promises";
import { join } from "path";

/** Read a file from the app's public folder (works locally and on Vercel). */
export async function readPublicFile(relativePath: string): Promise<string> {
  const clean = relativePath.replace(/^\/+/, "");
  return readFile(join(process.cwd(), "public", clean), "utf-8");
}

export async function resolveAssets(assetIndexUrl: string, baseUrl: string) {
  const raw = await readPublicFile(assetIndexUrl);
  const index = JSON.parse(raw);
  const assets = index.assets || [];
  const game = index.game || "match";
  const mechanics = index.globalTags?.gameMechanics || {};

  const assetUrl = (file: string) => `${baseUrl}/playable-assets/${game}/${file}`;

  // ── Board tokens: gems tagged as "board-token" (asset_00,01,03,27) ──
  const boardTokens = (assets as any[])
    .filter((a: any) =>
      a.category === "gem" &&
      a.tags?.includes("board-token")
    )
    .slice(0, 8);

  // ── Board background: background tagged "board-background" (asset_21) ──
  const boardBgAsset = assets.find((a: any) =>
    a.category === "background" && a.tags?.includes("board-background")
  );

  // ── Main scene background: prefer palace interior (asset_08) ──
  const bgAssets = assets.filter((a: any) => a.category === "background" && !a.tags?.includes("board-background"));
  const mainBg = bgAssets.find((a: any) =>
    a.tags?.includes("primary-bg") || a.tags?.includes("interior") || a.tags?.includes("palace")
  );

  // ── Character: prefer 'cat' tagged, fallback to any character with protagonist/mascot tag ──
  const charAssets = assets.filter((a: any) => a.category === "character" && a.tags?.includes("cat"));
  const character = charAssets.find((a: any) => a.tags?.includes("protagonist"))
    || charAssets[0]
    || assets.find((a: any) => a.category === "character" && (a.tags?.includes("mascot") || a.tags?.includes("protagonist")));

  // ── Cat shelf: platform the cat stands on (asset_15) ──
  const catShelf = assets.find((a: any) => a.category === "platform" && a.tags?.includes("cat-shelf"));

  // ── Cat states: all cat character images (asset_06,09,17) ──
  const catStates = charAssets.sort((a: any, b: any) => {
    const aState = a.tags?.find((t: string) => t.startsWith("cat-state-")) || "";
    const bState = b.tags?.find((t: string) => t.startsWith("cat-state-")) || "";
    return aState.localeCompare(bState);
  });

  // ── Special objects: items that need to be collected to bottom (asset_22,23,26) ──
  let specialObjects = (assets as any[])
    .filter((a: any) =>
      a.category === "special" && a.tags?.includes("collect-to-bottom")
    );
  // Fallback: use gameMechanics.specialObjects declaration when tags are missing
  if (specialObjects.length < 3 && Array.isArray(mechanics?.specialObjects)) {
    const declared = mechanics.specialObjects
      .map((id: string) => assets.find((a: any) => String(a.file).replace(/\.\w+$/, "") === id))
      .filter(Boolean);
    if (declared.length >= 3) specialObjects = declared;
  }

  // ── Collection stool: where collected special objects are placed (asset_28) ──
  const stool = assets.find((a: any) => a.tags?.includes("collect-stool"));

  // ── Glow effects: sparkle overlays for special objects ──
  const glowEffects = (assets as any[])
    .filter((a: any) => a.category === "effect" && a.tags?.includes("glow"));

  // Build glow map from mechanics or tag patterns
  const glowMap: Record<string, string> = {};
  for (const g of glowEffects) {
    const targetTag = g.tags?.find((t: string) => t.startsWith("glow-for-"));
    if (targetTag) {
      const targetAsset = targetTag.replace("glow-for-", "");
      glowMap[targetAsset] = assetUrl(g.file);
    }
  }

  // ── Win/Lose display icons ──
  const winIcon = assets.find((a: any) => a.category === "ui" && a.tags?.includes("win"));
  const loseIcon = assets.find((a: any) => a.category === "ui" && a.tags?.includes("lose"));

  // ── Sound icons ──
  const muteIcon = assets.find((a: any) => a.category === "ui" && a.tags?.includes("mute"));
  const unmuteIcon = assets.find((a: any) => a.category === "ui" && a.tags?.includes("unmute"));

  // ── Decorative frame (asset_14 was lose, so none now, but keep for compat) ──
  const frameAssets = assets.filter((a: any) => a.category === "frame");
  const frame = frameAssets[0];

  // ── Stool layout overrides (theme-driven) ──
  const stoolLift = typeof mechanics?.stoolLift === "number" ? mechanics.stoolLift : 6;
  const stoolLandOffset = typeof mechanics?.stoolLandOffset === "number" ? mechanics.stoolLandOffset : -30;
  const charYOffset = typeof mechanics?.charYOffset === "number" ? mechanics.charYOffset : 0;
  const boardYOffset = typeof mechanics?.boardYOffset === "number" ? mechanics.boardYOffset : 0;

  return {
    index,
    assets,
    game,
    mechanics,
    gemUrls: boardTokens.map((a: any) => assetUrl(a.file)),
    boardBgUrl: boardBgAsset ? assetUrl(boardBgAsset.file) : (mainBg ? assetUrl(mainBg.file) : ""),
    mainBgUrl: mainBg ? assetUrl(mainBg.file) : "",
    characterUrl: character ? assetUrl(character.file) : "",
    catShelfUrl: catShelf ? assetUrl(catShelf.file) : "",
    catStateUrls: catStates.map((a: any) => assetUrl(a.file)),
    specialObjectUrls: specialObjects.map((a: any) => assetUrl(a.file)),
    specialGlowMap: glowMap,
    stoolUrl: stool ? assetUrl(stool.file) : "",
    stoolLift,
    stoolLandOffset,
    charYOffset,
    boardYOffset,
    winIconUrl: winIcon ? assetUrl(winIcon.file) : "",
    loseIconUrl: loseIcon ? assetUrl(loseIcon.file) : "",
    muteIconUrl: muteIcon ? assetUrl(muteIcon.file) : "",
    unmuteIconUrl: unmuteIcon ? assetUrl(unmuteIcon.file) : "",
    frameUrl: frame ? assetUrl(frame.file) : "",
    assetUrl,
  };
}

export function parseSpec(raw: string, defaultGameType: string): PlayableDesignSpec {
  let cleaned = raw.replace(/```json\s?/g, "").replace(/```\s?/g, "").trim();
  try { return JSON.parse(cleaned) as PlayableDesignSpec; } catch { /* try recovery */ }
  const lastComma = cleaned.lastIndexOf('",');
  if (lastComma > 0) cleaned = cleaned.substring(0, lastComma + 2) + "\n  }\n}";
  let spec: PlayableDesignSpec;
  try {
    spec = JSON.parse(cleaned) as PlayableDesignSpec;
  } catch {
    spec = {
      gameType: defaultGameType, difficulty: "normal",
      theme: { name: "Default", items: ["💎","🔮","💠","⚡","🌟","🔷"], colorMood: "vibrant", bgGradient: "linear-gradient(135deg, #1a1a2e, #16213e)", accentColor: "#ffd700", boardStyle: "glass", gemStyle: "glow", particleStyle: "gold", animationStyle: "bounce" },
      copy: { headline: "Play Now!", ctaText: "Install Now", ctaColor: "#ffd700", endWin: "Amazing! 🎉", endLose: "Try again!", endCta: "Get the game!" },
      gameplay: { cols: 6, rows: 6, maxMoves: 15, targetScore: 300 },
    };
  }
  if (!getEngineIds().includes(spec.gameType)) spec.gameType = defaultGameType;
  if (!spec.theme.items || spec.theme.items.length < 6) spec.theme.items = ["💎","🔮","💠","⚡","🌟","🔷"];
  return spec;
}
