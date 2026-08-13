import { NextRequest, NextResponse } from "next/server";
import { llmChat } from "@/lib/llm";
import { assemblePlayable } from "@/lib/playable-shell";
import { getEngineIds } from "@/lib/engines";
import { resolveAssets, parseSpec } from "@/lib/playable-helper";
import { getBaseUrl } from "@/lib/base-url";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { gameName, assetIndexUrl, gameplaySpecUrl, userPrompt } = body;
  const baseUrl = getBaseUrl(req);

  try {
    const {
      gemUrls, mainBgUrl, boardBgUrl, characterUrl, catShelfUrl, catStateUrls,
      specialObjectUrls, specialGlowMap, winIconUrl, loseIconUrl,
      muteIconUrl, unmuteIconUrl, frameUrl, stoolUrl, stoolLift, stoolLandOffset,
      charYOffset, boardYOffset, mechanics, index
    } = await resolveAssets(assetIndexUrl, baseUrl);
    const specRes = await fetch(baseUrl + gameplaySpecUrl);
    const gameplaySpec = await specRes.text();
    const engines = getEngineIds().join(", ");
    const assetSummary = (index.assets || []).slice(0, 12).map((a: any) =>
      `${a.file}: ${a.category} [${(a.tags||[]).slice(0,4).join(",")}]`
    ).join(" | ");

    const userInstruction = userPrompt
      ? `\n━━━ USER'S VISION ━━━\n${userPrompt}\n\nDesign a game that fulfills this vision using the assets and spec below.`
      : "";

    const system = `You are a PLAYABLE AD GAME DESIGNER. Your job: read the game design spec, study the assets, and DESIGN an original playable ad. You output a JSON config consumed by a game engine — you do NOT write code.
${userInstruction}

━━━ GAME DESIGN SPEC ━━━
${gameplaySpec.slice(0, 1500)}

━━━ ASSET LIBRARY (the visual building blocks) ━━━
${assetSummary}

━━━ THEME & STYLE ━━━
Tags: ${JSON.stringify(index.globalTags?.theme || [])}
Mood: ${JSON.stringify(index.globalTags?.mood || [])}
Art: ${JSON.stringify(index.globalTags?.artStyle || [])}

━━━ GAME MECHANICS SUMMARY ━━━
${JSON.stringify(mechanics)}

━━━ ASSET URLS (use EXACTLY — do NOT modify) ━━━
Main BG: ${mainBgUrl}
Board BG: ${boardBgUrl}
Character: ${characterUrl}
Cat Shelf: ${catShelfUrl}
Gems: ${JSON.stringify(gemUrls)}
Win: ${winIconUrl}  Lose: ${loseIconUrl}

━━━ DESIGN TASK ━━━
Based on the game design spec, make CREATIVE decisions:

🎮 GAME FEEL (vary these — do NOT default to the same values every time):
- difficulty: easy (relaxed) / normal (balanced) / hard (challenging) — choose based on spec
- gameMode: "timed" (urgency) or "score" (strategy) — what fits the spec better?
- timeLimit: 30-90s for timed, or set maxMoves for score mode
- targetScore: match the difficulty level (easy=200-300, normal=300-500, hard=500+)

🎨 VISUAL IDENTITY (be bold, not safe):
- colorMood: vibrant/dark/light/premium — which one amplifies the spec's emotional tone?
- particleStyle: gold/candy/neon/royal/emerald — which fits the asset art style?
- accentColor: pick a hex color that POPS against the background
- bgGradient: a CSS gradient that blends with the main background image
- gem items: pick 4 emoji that match the asset visual style

📝 COPY (be specific, not generic):
- headline: reference the SPEC's game mechanics, NOT generic "Match & Collect!"
- endWin: exciting, specific to winning condition
- endLose: encouraging, not generic

DO NOT just fill defaults. Every decision should be intentional based on the spec.`;

    const model = process.env.FROM_SCRATCH_MODEL || "anthropic/claude-sonnet-4";
    const provider = model.includes("deepseek") ? "deepseek" : "openrouter";

    const raw = await llmChat(system, userPrompt ? `Design a playable ad for ${gameName} matching this vision: ${userPrompt}` : `Design a playable ad for ${gameName}.`, {
      provider,
      model,
    });
    const spec = parseSpec(raw, getEngineIds()[0]);

    // ── Use the dedicated Phaser match-3 engine ──
    spec.gameType = getEngineIds().includes("phaser-match") ? "phaser-match" : getEngineIds()[0];

    // ── FORCE inject exact asset URLs ──
    spec.itemImages = gemUrls;
    spec.bgImageUrl = mainBgUrl;
    spec.boardBgUrl = boardBgUrl;
    spec.characterUrl = characterUrl;
    spec.catShelfUrl = catShelfUrl;
    spec.frameUrl = frameUrl;
    (spec as any).specialObjects = specialObjectUrls;
    (spec as any).specialGlowMap = specialGlowMap;
    (spec as any).stoolUrl = stoolUrl;
    (spec as any).stoolLift = stoolLift;
    (spec as any).stoolLandOffset = stoolLandOffset;
    (spec as any).charYOffset = charYOffset;
    (spec as any).boardYOffset = boardYOffset;
    (spec as any).winIconUrl = winIconUrl;
    (spec as any).loseIconUrl = loseIconUrl;
    (spec as any).muteIconUrl = muteIconUrl;
    (spec as any).unmuteIconUrl = unmuteIconUrl;
    (spec as any).catStateUrls = catStateUrls;
    // Ensure 4 gem types
    spec.theme = spec.theme || {};
    spec.theme.items = ["👑","💎","🔶","⭐"];
    spec.gemCount = 4;
    // Force 6x8 board
    spec.gameplay = spec.gameplay || {};
    spec.gameplay.cols = 6;
    spec.gameplay.rows = 8;
    spec.gameplay.targetScore = spec.gameplay.targetScore || 400;
    // Collect mode: 3 minutes timeout
    spec.gameplay.timeLimit = 180;

    const html = assemblePlayable(spec);
    return NextResponse.json({ success: true, data: { html, spec } });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
