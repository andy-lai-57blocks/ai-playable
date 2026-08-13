import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  const baseDir = join(process.cwd(), "public", "playable-assets");
  const games: any[] = [];

  try {
    const entries = await readdir(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const indexPath = join(baseDir, entry.name, "asset-index.json");
      try {
        const raw = await readFile(indexPath, "utf-8");
        const index = JSON.parse(raw);
        games.push({
          id: entry.name,
          name: index.game || entry.name,
          globalTags: index.globalTags || {},
          assetCount: index.totalAssets || index.assets?.length || 0,
          assetIndexUrl: `/playable-assets/${entry.name}/asset-index.json`,
          gameplaySpecUrl: `/playable-assets/${entry.name}/gameplay-spec.md`,
        });
      } catch { /* skip dirs without valid index */ }
    }
  } catch { /* directory may not exist */ }

  return NextResponse.json({ success: true, data: games });
}
