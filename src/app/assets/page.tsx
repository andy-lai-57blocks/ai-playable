"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, ImageOff } from "lucide-react";

interface Asset {
  file: string;
  size: number;
  dimensions: string;
  format: string;
  category: string;
  tags: string[];
  description: string;
  usage: string[];
  url: string;
}

interface GameAssets {
  id: string;
  name: string;
  assets: Asset[];
  globalTags: any;
}

export default function AssetViewerPage() {
  const [games, setGames] = useState<GameAssets[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  // Build local static path: files always live under public/playable-assets/<gameId>/
  function localUrl(asset: Asset, gameId?: string): string {
    if (gameId) return `/playable-assets/${gameId}/${asset.file}`;
    // Fallback: strip the /playable-assets/... part from the recorded URL
    const match = asset.url.match(/\/playable-assets\/.+/);
    return match ? match[0] : asset.url;
  }

  useEffect(() => {
    fetch("/api/demo2/games")
      .then((r) => r.json())
      .then(async (d) => {
        const gameList = d.data || [];
        const loaded: GameAssets[] = [];
        for (const g of gameList) {
          try {
            const res = await fetch(g.assetIndexUrl);
            const index = await res.json();
            loaded.push({ id: g.id, name: g.name, assets: index.assets || [], globalTags: index.globalTags });
          } catch {}
        }
        setGames(loaded);
        if (loaded.length > 0) setSelected(loaded[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const current = games.find((g) => g.id === selected);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Asset Library Viewer</h1>
        <a href="/" className="text-sm text-gray-400 hover:text-white transition">
          ← Back to Studio
        </a>
      </header>

      {/* Game selector */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-4">
        <span className="text-sm text-gray-500">Game:</span>
        <select
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.assets.length} assets)
            </option>
          ))}
        </select>
        {current && (
          <div className="text-xs text-gray-600">
            Theme: {(current.globalTags?.theme || []).join(", ")} · Mood: {(current.globalTags?.mood || []).join(", ")}
          </div>
        )}
      </div>

      {/* Asset Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {current?.assets.map((a) => (
          <div
            key={`${current.id}-${a.file}`}
            onClick={() => { setPreviewUrl(localUrl(a, current.id)); setPreviewAsset(a); }}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-indigo-500/50 cursor-pointer transition group"
          >
            {/* Thumbnail */}
            <div className="aspect-square bg-gray-800 flex items-center justify-center overflow-hidden">
              <img
                src={localUrl(a, current.id)}
                alt={a.file}
                className="max-w-full max-h-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                }}
              />
              <ImageOff size={24} className="text-gray-600 hidden" />
            </div>
            {/* Info */}
            <div className="p-2">
              <div className="text-xs font-mono text-indigo-400 truncate">{a.file}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{a.dimensions} · {a.category}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {a.tags.slice(0, 3).map((t) => (
                  <span key={t} className="px-1 py-px bg-gray-800 rounded text-[9px] text-gray-400">{t}</span>
                ))}
                {a.tags.length > 3 && <span className="text-[9px] text-gray-600">+{a.tags.length - 3}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewUrl && previewAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => { setPreviewUrl(null); setPreviewAsset(null); }}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-semibold text-sm">{previewAsset.file}</h3>
              <button onClick={() => { setPreviewUrl(null); setPreviewAsset(null); }} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            {/* Image */}
            <div className="bg-gray-800 flex items-center justify-center p-6">
              <img src={previewUrl} alt={previewAsset.file} className="max-w-full max-h-64 object-contain" />
            </div>
            {/* Details */}
            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Category</span><div className="text-white">{previewAsset.category}</div></div>
                <div><span className="text-gray-500">Dimensions</span><div className="text-white">{previewAsset.dimensions}</div></div>
                <div><span className="text-gray-500">Format</span><div className="text-white">{previewAsset.format}</div></div>
                <div><span className="text-gray-500">Size</span><div className="text-white">{(previewAsset.size / 1024).toFixed(1)} KB</div></div>
              </div>
              <div>
                <span className="text-gray-500">Description</span>
                <p className="text-white mt-0.5">{previewAsset.description}</p>
              </div>
              <div>
                <span className="text-gray-500">Tags</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {previewAsset.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Usage</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {previewAsset.usage.map((u) => (
                    <span key={u} className="px-2 py-0.5 bg-indigo-900/50 border border-indigo-800 rounded text-xs text-indigo-300">{u}</span>
                  ))}
                </div>
              </div>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs">
                <ExternalLink size={12} /> Open original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
