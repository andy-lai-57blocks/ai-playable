import { NextRequest, NextResponse } from "next/server";
import { llmChat } from "@/lib/llm";
import { assemblePlayable } from "@/lib/playable-shell";
import { getEngineIds } from "@/lib/engines";
import { resolveAssets, parseSpec } from "@/lib/playable-helper";
import { getBaseUrl } from "@/lib/base-url";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { templateType, assetIndexUrl, instruction } = body;
  const baseUrl = getBaseUrl(req);

  if (!getEngineIds().includes(templateType)) {
    return NextResponse.json({ success: false, message: `Unknown template: ${templateType}` }, { status: 400 });
  }

  try {
    const {
      gemUrls, mainBgUrl, boardBgUrl, characterUrl, catShelfUrl, catStateUrls,
      specialObjectUrls, specialGlowMap, winIconUrl, loseIconUrl,
      muteIconUrl, unmuteIconUrl, frameUrl, stoolUrl, stoolLift, stoolLandOffset,
      charYOffset, boardYOffset, mechanics, index
    } = await resolveAssets(assetIndexUrl, baseUrl);
    const assetSummary = (index.assets || []).slice(0, 25).map((a: any) =>
      `- ${a.file}: ${a.description} (cat:${a.category}, tags:[${(a.tags||[]).join(",")}])`
    ).join("\n");
    const extra = instruction ? `\nUSER INSTRUCTION: ${instruction}` : "";

    const system = `You are a playable ad reskin designer. Re-theme the "${templateType}" template.

AVAILABLE ASSETS: ${assetSummary}
GLOBAL TAGS: ${JSON.stringify(index.globalTags || {})}
GEM URLs: ${JSON.stringify(gemUrls)}
CHARACTER URL: ${JSON.stringify(characterUrl)}
FRAME URL: ${JSON.stringify(frameUrl)}${extra}

Return ONLY valid JSON:
{
  "gameType": "${templateType}",
  "difficulty": "normal",
  "logoUrl": "",
  "bgImageUrl": "${mainBgUrl}",
  "boardBgUrl": "${boardBgUrl}",
  "itemImages": ${JSON.stringify(gemUrls)},
  "characterUrl": "${characterUrl}",
  "catShelfUrl": "${catShelfUrl}",
  "frameUrl": "${frameUrl}",
  "winIconUrl": "${winIconUrl}",
  "loseIconUrl": "${loseIconUrl}",
  "muteIconUrl": "${muteIconUrl}",
  "unmuteIconUrl": "${unmuteIconUrl}",
  "catStateUrls": ${JSON.stringify(catStateUrls)},
  "specialObjects": ${JSON.stringify(specialObjectUrls)},
  "specialGlowMap": ${JSON.stringify(specialGlowMap)},
  "showMoves": false,
  "theme": { "name":"...","items":["💎","💠","🔮","⚡","🌟","🔷"],"colorMood":"premium","bgGradient":"linear-gradient(135deg, #1a1a2e, #2d1b4e)","accentColor":"#ffd700","boardStyle":"glass","gemStyle":"glow","particleStyle":"gold","animationStyle":"bounce" },
  "copy": { "headline":"...","ctaText":"Install Now","ctaColor":"#ffd700","endWin":"Amazing! Download now!","endLose":"Almost! Try again!","endCta":"Get the Game!" },
  "gameplay": { "cols":6,"rows":8,"targetScore":400 }
}

RULES:
- Use EXACT URLs as provided — do NOT modify any URLs
- 4 gem types only (match asset count)
- colorMood and particleStyle must match the asset aesthetic
- Keep gameType as "${templateType}"`;

    const raw = await llmChat(system, `Reskin ${templateType} with this theme.`, {
      provider: "deepseek",
      model: process.env.RESKIN_MODEL || "deepseek-v4-pro",
    });
    const spec = parseSpec(raw, templateType);

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
    // Force 6x8 board to match engine layout
    spec.gameplay = spec.gameplay || {};
    spec.gameplay.cols = 6;
    spec.gameplay.rows = 8;
    spec.gameplay.targetScore = spec.gameplay.targetScore || 400;
    spec.gameplay.timeLimit = 180;
    // Ensure at least 6 item types
    spec.theme = spec.theme || {};
    spec.theme.items = spec.theme.items || [];
    const defaultEmoji = ["💎","🔮","💠","⚡","🌟","🔷","💖"];
    while (spec.theme.items.length < 6) {
      spec.theme.items.push(defaultEmoji[spec.theme.items.length % defaultEmoji.length]);
    }

    const html = assemblePlayable(spec);

    return NextResponse.json({ success: true, data: { html, spec } });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
