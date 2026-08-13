"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, RefreshCw, RotateCcw, Loader2, Gamepad2, Wand2, FileText, Brain, Layout, Wrench, Check } from "lucide-react";

const API = "/api/demo2";

const PROGRESS_STEPS = [
  { label: "Loading assets...", icon: FileText, range: [0, 10] },
  { label: "AI reading gameplay spec...", icon: Brain, range: [10, 30] },
  { label: "Designing game layout...", icon: Layout, range: [30, 70] },
  { label: "Assembling playable...", icon: Wrench, range: [70, 95] },
  { label: "Finalizing...", icon: Check, range: [95, 100] },
];

interface Game {
  id: string;
  name: string;
  globalTags: Record<string, string[]>;
  assetCount: number;
  assetIndexUrl: string;
  gameplaySpecUrl: string;
}

interface GenerateResult {
  html: string;
  spec: {
    gameType: string;
    difficulty?: string;
    copy: { headline: string; ctaText?: string };
    theme?: { name: string; colorMood: string; items: string[] };
  };
}

export default function Demo2Page() {
  const [games, setGames] = useState<Game[]>([]);
  const [mode, setMode] = useState<"reskin" | "scratch">("reskin");

  // Mode 1 (reskin)
  const [reskinGame, setReskinGame] = useState<Game | null>(null);
  const [templateType, setTemplateType] = useState("phaser-match");
  const [reskinInstruction, setReskinInstruction] = useState("");

  // Mode 2 (from scratch)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [scratchPrompt, setScratchPrompt] = useState("");

  // Shared
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState(0);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState("");
  const [previewNonce, setPreviewNonce] = useState(0);

  const startProgress = useCallback(() => {
    setProgress(0);
    setProgressStep(0);
    let p = 0;
    let step = 0;
    progressTimer.current = setInterval(() => {
      // Fast early, slow later
      p += p < 70 ? 2 + Math.random() * 3 : 0.3 + Math.random() * 0.5;
      if (p > 95) p = 95; // cap at 95% until real completion
      setProgress(Math.round(p));
      // Update step based on progress
      const newStep = PROGRESS_STEPS.findIndex(s => p >= s.range[0] && p <= s.range[1]);
      if (newStep !== step && newStep >= 0) {
        step = newStep;
        setProgressStep(step);
      }
    }, 200);
  }, []);

  const stopProgress = useCallback((success: boolean) => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setProgress(success ? 100 : 0);
    if (success) setProgressStep(PROGRESS_STEPS.length - 1);
  }, []);

  useEffect(() => {
    fetch(`${API}/games`)
      .then((r) => r.json())
      .then((d) => {
        setGames(d.data || []);
        if (d.data?.length > 0) {
          setSelectedGame(d.data[0]);
          setReskinGame(d.data[0]);
        }
      })
      .catch(() => setError("Cannot connect to API. Make sure the server is running."));
  }, []);

  const generateFromSpec = useCallback(async () => {
    if (!selectedGame) return;
    setLoading(true); setError(""); setResult(null); startProgress();
    try {
      const res = await fetch(`${API}/generate-from-spec`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: selectedGame.id, gameName: selectedGame.name, assetIndexUrl: selectedGame.assetIndexUrl, gameplaySpecUrl: selectedGame.gameplaySpecUrl, userPrompt: scratchPrompt || undefined }) });
      const d = await res.json();
      if (d.success) { setResult(d.data); stopProgress(true); } else { setError(d.message || "Generation failed"); stopProgress(false); }
    } catch (e: any) { setError(e.message); stopProgress(false); }
    setLoading(false);
  }, [selectedGame, startProgress, stopProgress]);

  const doReskin = useCallback(async () => {
    if (!reskinGame) return;
    setLoading(true); setError(""); setResult(null); startProgress();
    try {
      const res = await fetch(`${API}/reskin`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateType: "phaser-match", assetIndexUrl: reskinGame.assetIndexUrl }) });
      const d = await res.json();
      if (d.success) { setResult(d.data); stopProgress(true); } else { setError(d.message || "Reskin failed"); stopProgress(false); }
    } catch (e: any) { setError(e.message); stopProgress(false); }
    setLoading(false);
  }, [reskinGame, startProgress, stopProgress]);

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wand2 size={24} className="text-indigo-400" />
          <h1 className="text-lg font-bold">57Creative Playable Studio</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setMode("reskin"); setResult(null); setError(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === "reskin" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Reskin
          </button>
        </div>
      </header>

      {/* Main: Left preview + Right controls */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Playable Preview */}
        <div className="flex-1 flex flex-col bg-gray-950 border-r border-gray-800">
          <div className="flex-shrink-0 px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>Playable Preview</span>
            <div className="flex items-center gap-3">
              {result && (
                <button
                  onClick={() => setPreviewNonce((n) => n + 1)}
                  title="Replay the playable"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                >
                  <RotateCcw size={13} />
                  <span>Replay</span>
                </button>
              )}
              {result && <span>{result.spec.gameType} · {(result.html?.length || 0).toLocaleString()} chars</span>}
            </div>
          </div>
          <div className="flex-1 relative">
            {result ? (
              <iframe
                key={previewNonce}
                srcDoc={result.html}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title="Playable Preview"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                <div className="text-center">
                  <Gamepad2 size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a mode and generate</p>
                  <p className="text-xs mt-1 text-gray-700">The playable ad will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Controls Panel */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-gray-900 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Mode label */}
            <div>
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-1">
                {mode === "scratch" ? "Generate from Scratch" : "Reskin"}
              </h2>
              <p className="text-xs text-gray-500">
                {mode === "scratch"
                  ? "Creative AI design powered by Claude"
                  : "Fast theme swap powered by DeepSeek"}
              </p>
            </div>

            {/* Game Assets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-gray-500">Game Assets</label>
                <a href="/assets" target="_blank" className="text-[10px] text-indigo-400 hover:text-indigo-300">
                  View Library ↗
                </a>
              </div>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                value={(mode === "scratch" ? selectedGame?.id : reskinGame?.id) || ""}
                onChange={(e) => {
                  const g = games.find((g) => g.id === e.target.value) || null;
                  if (mode === "scratch") setSelectedGame(g);
                  else setReskinGame(g);
                }}
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} ({g.assetCount} assets)</option>
                ))}
              </select>
            </div>

            {/* From Scratch: user prompt */}
            {mode === "scratch" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Describe your game</label>
                <textarea
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white h-16 resize-none"
                  placeholder='Describe the game you want...'
                  value={scratchPrompt}
                  onChange={(e) => setScratchPrompt(e.target.value)}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {[
                    "Candy-themed, bright & sweet",
                    "Dark vampire gothic style",
                    "Neon cyberpunk, fast & flashy",
                    "Ocean underwater treasure hunt",
                    "Space galaxy, cosmic & mystical",
                    "Jungle adventure, wild & colorful",
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => setScratchPrompt(p)}
                      className={`px-2 py-1 text-[10px] rounded-full transition ${
                        scratchPrompt === p
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={mode === "scratch" ? generateFromSpec : doReskin}
              disabled={loading || (mode === "scratch" ? !selectedGame : !reskinGame)}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-sm text-white transition flex items-center justify-center gap-2 disabled:opacity-40 ${
                mode === "scratch" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (mode === "scratch" ? <Wand2 size={18} /> : <RefreshCw size={18} />)}
              {loading ? "Generating..." : (mode === "scratch" ? "Generate Playable" : "Reskin")}
            </button>

            {/* Progress */}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {PROGRESS_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const active = i === progressStep;
                    const done = i < progressStep;
                    return (
                      <div key={i} className={`flex items-center gap-1 ${done ? "text-green-400" : active ? "text-indigo-400" : "text-gray-600"}`}>
                        {done ? <Check size={10} /> : <Icon size={10} />}
                      </div>
                    );
                  })}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-xs">{error}</div>
            )}

            {/* Result Info */}
            {result && (
              <div className="bg-gray-800 rounded-lg p-3 text-xs space-y-1.5">
                <div><span className="text-gray-500">Engine</span> <span className="text-white ml-2">{result.spec.gameType}</span></div>
                <div><span className="text-gray-500">Headline</span> <span className="text-white ml-2">{result.spec.copy.headline}</span></div>
                <div><span className="text-gray-500">Theme</span> <span className="text-white ml-2">{result.spec.theme?.name}</span></div>
                <div><span className="text-gray-500">Mood</span> <span className="text-white ml-2">{result.spec.theme?.colorMood}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
