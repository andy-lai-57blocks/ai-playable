import type { NextRequest } from "next/server";

/**
 * Resolve the app's public base URL for building absolute asset URLs.
 *
 * Priority:
 *  1. Forwarded headers (x-forwarded-host / host) — always matches the domain
 *     the client actually requested, including production aliases, custom
 *     domains and local dev (localhost:3002). This is the most reliable source.
 *  2. VERCEL_URL (auto-injected by Vercel, e.g. project.vercel.app)
 *  3. NEXT_PUBLIC_APP_URL (explicit config fallback)
 */
export function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host")?.split(",")[0].trim() || req.headers.get("host") || "";
  const proto = (req.headers.get("x-forwarded-proto") || "http").split(",")[0].trim();
  if (host) return `${proto}://${host}`;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");

  return `${proto}://localhost:3002`;
}
