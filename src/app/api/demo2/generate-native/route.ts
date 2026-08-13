import { NextRequest, NextResponse } from "next/server";
import { llmChat } from "@/lib/llm";
import { resolveAssets, readPublicFile } from "@/lib/playable-helper";
import { getBaseUrl } from "@/lib/base-url";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { gameName, assetIndexUrl, gameplaySpecUrl } = body;
  const baseUrl = getBaseUrl(req);

  try {
    const { gemUrls, mainBgUrl, characterUrl, index } = await resolveAssets(assetIndexUrl, baseUrl);
    const gameplaySpec = await readPublicFile(gameplaySpecUrl);

    const system = `Generate a complete, self-contained playable ad as a SINGLE HTML file.

GAME: ${gameName}
SPEC: ${gameplaySpec.slice(0, 2000)}
THEME: ${JSON.stringify(index.globalTags || {})}

ASSET URLs — use these EXACTLY:
Background: ${mainBgUrl}
Character: ${characterUrl}
Gem tokens: ${JSON.stringify(gemUrls)}

RULES:
- Output ONLY the HTML code. Start with <!DOCTYPE html>. No markdown, no explanations.
- Use the gem images as <img> in a CSS grid (not canvas — simpler and more reliable)
- 6x6 grid, click to select, click adjacent to swap
- Match 3+ → remove matched, gravity drop from top
- Score tracking, win at 300, show "Install Now" overlay
- Simple CSS animations for swap and match (transition: transform 0.2s, opacity 0.3s)
- Use gold (#ffd700) on dark (#1a1a2e) color scheme`;

    const raw = await llmChat(system, "Output only the HTML code.", {
      temperature: 0.2,
      maxTokens: 6000,
    });

    let html = raw.trim();
    html = html.replace(/^```[\w]*\s*\n?/gm, "").replace(/\n?```\s*$/gm, "");
    const startIdx = Math.max(html.indexOf("<!DOCTYPE"), html.indexOf("<html"));
    if (startIdx > 0) html = html.slice(startIdx);
    if (!html.startsWith("<!DOCTYPE") && !html.startsWith("<html")) {
      return NextResponse.json({
        success: false,
        message: "LLM didn't generate valid HTML. Native mode is experimental — try Engine mode for reliable results.",
        debug: { len: raw.length, preview: raw.slice(0, 300) }
      });
    }

    return NextResponse.json({ success: true, data: { html, spec: { gameType: "native" } } });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
