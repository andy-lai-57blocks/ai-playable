import type { NextRequest } from "next/server";

/**
 * Resolve the app's public base URL for building absolute asset URLs.
 *
 * Priority:
 *  1. NEXT_PUBLIC_APP_URL (explicit config, e.g. https://demo.vercel.app)
 *  2. VERCEL_URL (auto-injected by Vercel, e.g. project.vercel.app)
 *  3. Forwarded headers (Vercel / proxies) or the request Host (local dev)
 */
export function getBaseUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = (req.headers.get("x-forwarded-proto") || "http").split(",")[0].trim();
  return `${proto}://${host}`;
}
