const PROXY_BASE = "/api/polymarket";

function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Returns the correct URL for Gamma API paths.
 * On the server: direct to https://gamma-api.polymarket.com
 * In the browser: routed through the local Next.js proxy to avoid CORS
 *
 * Proxy route mapping:
 *   /events?...              -> /api/polymarket/events?...
 *   /events/slug/{slug}      -> /api/polymarket/events/{slug}
 *   /markets?...             -> /api/polymarket/markets?...
 *   /markets/slug/{slug}     -> /api/polymarket/markets/{slug}
 *   /public-search?query=... -> /api/polymarket/search?query=...
 */
export function gammaUrl(path: string, params?: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const query = params ? `?${params}` : "";
  if (isClient()) {
    // Map Gamma API paths to proxy route paths
    const eventSlugMatch = normalizedPath.match(/^\/events\/slug\/(.+)$/);
    if (eventSlugMatch) {
      return `${PROXY_BASE}/events/${eventSlugMatch[1]}${query}`;
    }
    const marketSlugMatch = normalizedPath.match(/^\/markets\/slug\/(.+)$/);
    if (marketSlugMatch) {
      return `${PROXY_BASE}/markets/${marketSlugMatch[1]}${query}`;
    }
    if (normalizedPath === "/public-search") {
      return `${PROXY_BASE}/search${query}`;
    }
    return `${PROXY_BASE}${normalizedPath}${query}`;
  }
  return `https://gamma-api.polymarket.com${normalizedPath}${query}`;
}

/**
 * Returns the correct URL for CLOB API paths.
 * On the server: direct to https://clob.polymarket.com
 * In the browser: routed through the local Next.js proxy to avoid CORS
 */
export function clobUrl(path: string, params?: string): string {
  const query = params ? `?${params}` : "";
  if (isClient()) {
    if (path.includes("prices-history")) {
      return `${PROXY_BASE}/prices-history${query}`;
    }
    if (path.includes("book")) {
      return `${PROXY_BASE}/book${query}`;
    }
    // Paths without a dedicated proxy route fall back to direct (non-CORS-sensitive)
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `https://clob.polymarket.com${normalizedPath}${query}`;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://clob.polymarket.com${normalizedPath}${query}`;
}

/**
 * Returns the correct URL for Data API paths.
 * On the server: direct to https://data-api.polymarket.com
 * In the browser: routed through the local Next.js proxy to avoid CORS
 */
export function dataUrl(path: string, params?: string): string {
  const query = params ? `?${params}` : "";
  if (isClient()) {
    if (path.includes("leaderboard")) {
      return `${PROXY_BASE}/leaderboard${query}`;
    }
    // Paths without a dedicated proxy route fall back to direct
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `https://data-api.polymarket.com${normalizedPath}${query}`;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://data-api.polymarket.com${normalizedPath}${query}`;
}
