/**
 * Playable Engine Interface
 *
 * Each engine is a self-contained game logic module.
 * LLM never writes game code — it only designs the skin (theme + copy + difficulty).
 * The engine generates the code that gets assembled into the final HTML.
 */

// ── Theme (LLM designs this) ──

export interface PlayableTheme {
  /** Display name for logging */
  name: string;
  /** Emoji items on the board (6 items recommended) */
  items: string[];
  /** Mood drives color palette selection */
  colorMood: "vibrant" | "dark" | "light" | "premium";
  /** CSS gradient for body background */
  bgGradient: string;
  /** Accent color for UI elements */
  accentColor: string;
  /** Board panel visual style */
  boardStyle: "solid" | "glass" | "dark" | "light";
  /** Gem/item rendering style */
  gemStyle: "rounded" | "flat" | "glow" | "glass";
  /** Particle effect style */
  particleStyle: "gold" | "colored" | "neon" | "shatter";
  /** Animation easing style */
  animationStyle: "bounce" | "elastic" | "smooth";
}

// ── Copy (LLM designs this) ──

export interface PlayableCopy {
  headline: string;
  subhead?: string;
  ctaText: string;
  /** CTA button background color */
  ctaColor: string;
  /** Win screen message */
  endWin: string;
  /** Lose screen message */
  endLose: string;
  /** CTA text on end screen */
  endCta: string;
}

// ── Design Spec (LLM outputs this JSON) ──

export type LayoutPreset = "classic" | "hero" | "compact" | "split";

export interface PlayableDesignSpec {
  /** Engine to use */
  gameType: string;
  /** Difficulty level */
  difficulty: "easy" | "normal" | "hard";
  /** Industry insight (optional, for display only) */
  industryInsight?: string;
  /** User-provided logo URL */
  logoUrl?: string;
  /** User-provided background image URL */
  bgImageUrl?: string;
  /** Board background image URL (shown behind the game board) */
  boardBgUrl?: string;
  /** Image URLs for board token items (overrides emoji text rendering) */
  itemImages?: string[];
  /** Character/mascot portrait URL */
  characterUrl?: string;
  /** Cat shelf platform URL (cat stands on top of this) */
  catShelfUrl?: string;
  /** Decorative frame URL (shown around board or as UI accent) */
  frameUrl?: string;
  /** Whether to show the moves counter (default true) */
  showMoves?: boolean;
  /** Layout preset — changes the visual arrangement */
  layout?: LayoutPreset;
  /** Game mode: score-based (fixed moves), timed, or endless */
  gameMode?: "score" | "timed" | "endless";
  /** Time limit in seconds (only for timed mode) */
  timeLimit?: number;
  /** Number of gem types on board (overrides difficulty default) */
  gemCount?: number;
  /** Power-up frequency: none, rare, normal, frequent */
  powerUpLevel?: "none" | "rare" | "normal" | "frequent";
  /** Visual theme */
  theme: PlayableTheme;
  /** Copy strategy */
  copy: PlayableCopy;
  /** Engine-specific game params */
  gameplay: Record<string, any>;
}

// ── Engine interface ──

export interface PlayableEngine {
  /** Unique engine ID */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Default items per difficulty */
  readonly defaultItems: Record<string, string[]>;
  /** Default gameplay params per difficulty */
  readonly defaultGameplay: Record<string, Record<string, any>>;
  /** Generate CSS required by this engine */
  generateStyles(spec: PlayableDesignSpec): string;
  /** Generate HTML markup (canvas or DOM containers) */
  generateMarkup(spec: PlayableDesignSpec): string;
  /** Generate JS init code (game loop, input, particles) */
  generateInit(spec: PlayableDesignSpec): string;
}

// ── Mood → color mappings ──

export const MOOD_COLORS: Record<string, { bg: string; panel: string; cell: string; text: string; accent: string }> = {
  vibrant: { bg: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)", panel: "rgba(255,255,255,0.08)", cell: "rgba(255,255,255,0.04)", text: "#ffffff", accent: "#ffd700" },
  dark:    { bg: "linear-gradient(135deg, #0d0d0d, #1a1a1a, #2d2d2d)", panel: "rgba(255,255,255,0.06)", cell: "rgba(255,255,255,0.03)", text: "#e0e0e0", accent: "#bb86fc" },
  light:   { bg: "linear-gradient(135deg, #f5f7fa, #c3cfe2, #e8ecf1)", panel: "rgba(0,0,0,0.04)", cell: "rgba(0,0,0,0.02)", text: "#1a1a2e", accent: "#6c5ce7" },
  premium: { bg: "linear-gradient(135deg, #1a1a1a, #2d1b4e, #1a1a2e)", panel: "rgba(255,215,0,0.08)", cell: "rgba(255,215,0,0.04)", text: "#f5f5f5", accent: "#ffd700" },
};

/** Resolve mood-driven colors, with LLM overrides */
export function resolveColors(spec: PlayableDesignSpec) {
  const mood = MOOD_COLORS[spec.theme.colorMood] || MOOD_COLORS.vibrant;
  return {
    bg: spec.theme.bgGradient || mood.bg,
    panel: mood.panel,
    cell: mood.cell,
    text: mood.text,
    accent: spec.theme.accentColor || mood.accent,
    cta: spec.copy.ctaColor || mood.accent,
  };
}

// ── Particle style → color palettes ──

export const PARTICLE_PALETTES: Record<string, number[]> = {
  gold:    [0xffd700, 0xffaa00, 0xff8c00, 0xffffff],
  candy:   [0xff69b4, 0xff1493, 0xffa500, 0xffff00, 0xffffff],
  neon:    [0x00ffff, 0xff00ff, 0xffff00, 0x00ff88, 0xffffff],
  royal:   [0xffd700, 0xdaa520, 0xffaa00, 0xffffff],
  emerald: [0x00ff88, 0x00cc66, 0xaaff00, 0xffffff],
  default: [0xffd700, 0xffaa00, 0xff6600, 0xffffff],
};

/** Resolve particle colors from theme */
export function resolveParticleColors(spec: PlayableDesignSpec): number[] {
  const style = spec.theme.particleStyle || 'default';
  return PARTICLE_PALETTES[style] || PARTICLE_PALETTES.default;
}

/** Resolve UI accent color (hex string) for text/score */
export function resolveAccentHex(spec: PlayableDesignSpec): string {
  return spec.theme.accentColor || '#ffd700';
}

/** Resolve text stroke color: white for dark themes, black for light */
export function resolveStrokeColor(spec: PlayableDesignSpec): string {
  return spec.theme.colorMood === 'light' ? '#000000' : '#ffffff';
}

// ── Badge style → background + border for UI score/timer pills ──

export interface BadgeStyle {
  bgColor: string;    // hex background color
  bgAlpha: number;    // background opacity
  borderAlpha: number; // accent border opacity
}

export const BADGE_STYLES: Record<string, BadgeStyle> = {
  dark:     { bgColor: '#000000', bgAlpha: 0.45, borderAlpha: 0.3 },
  premium:  { bgColor: '#1a1a2e', bgAlpha: 0.6, borderAlpha: 0.4 },
  vibrant:  { bgColor: '#0f3460', bgAlpha: 0.5, borderAlpha: 0.35 },
  light:    { bgColor: '#ffffff', bgAlpha: 0.7, borderAlpha: 0.5 },
  candy:    { bgColor: '#ff69b4', bgAlpha: 0.25, borderAlpha: 0.4 },
  neon:     { bgColor: '#1a0030', bgAlpha: 0.55, borderAlpha: 0.5 },
  default:  { bgColor: '#000000', bgAlpha: 0.45, borderAlpha: 0.3 },
};

export function resolveBadgeStyle(spec: PlayableDesignSpec): BadgeStyle {
  const mood = spec.theme.colorMood || 'default';
  return BADGE_STYLES[mood] || BADGE_STYLES.default;
}
