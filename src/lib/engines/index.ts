export type { PlayableEngine, PlayableDesignSpec, PlayableTheme, PlayableCopy } from "./engine.interface";
export { resolveColors } from "./engine.interface";
export { match3Engine } from "./match3.engine";
export { tapEngine } from "./tap.engine";
export { royalMatchEngine } from "./royal-match.engine";
export { phaserMatchEngine } from "./phaser-match.engine";

import { PlayableEngine } from "./engine.interface";
import { match3Engine } from "./match3.engine";
import { tapEngine } from "./tap.engine";
import { royalMatchEngine } from "./royal-match.engine";
import { phaserMatchEngine } from "./phaser-match.engine";

const registry: Record<string, PlayableEngine> = {
  match3: match3Engine,
  tap: tapEngine,
  "royal-match": royalMatchEngine,
  "phaser-match": phaserMatchEngine,
};

export function getEngine(id: string): PlayableEngine {
  const engine = registry[id];
  if (!engine) throw new Error(`Unknown engine: ${id}. Available: ${Object.keys(registry).join(", ")}`);
  return engine;
}

export function getEngineIds(): string[] {
  return Object.keys(registry);
}
