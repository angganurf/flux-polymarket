// Allowlisted query parameters for each Polymarket proxy endpoint
const ALLOWED_PARAMS: Record<string, string[]> = {
  events: [
    "limit", "offset", "order", "ascending",
    "tag", "slug", "id", "active", "closed", "archived",
    "start_date_min", "start_date_max", "end_date_min", "end_date_max",
    "volume_num_min", "volume_num_max",
  ],
  markets: [
    "limit", "offset", "order", "ascending",
    "tag", "slug", "id", "active", "closed", "archived",
    "clob_token_ids",
  ],
  leaderboard: [
    "limit", "offset", "window", "rank_by",
  ],
  "prices-history": [
    "market", "interval", "fidelity", "startTs", "endTs",
  ],
};

/**
 * Filter query parameters against an allowlist for a given proxy endpoint.
 * Only known-safe params are forwarded to the upstream API.
 */
export function filterProxyParams(
  searchParams: URLSearchParams,
  endpoint: keyof typeof ALLOWED_PARAMS
): string {
  const allowed = ALLOWED_PARAMS[endpoint];
  if (!allowed) return "";

  const filtered = new URLSearchParams();
  for (const key of allowed) {
    const value = searchParams.get(key);
    if (value !== null) {
      filtered.set(key, value);
    }
  }
  return filtered.toString();
}

/**
 * Validate a slug parameter: alphanumeric + hyphens only, max 200 chars.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-zA-Z0-9][-a-zA-Z0-9]{0,199}$/.test(slug);
}

/**
 * Validate a CLOB token ID: hex string, max 80 chars.
 */
export function isValidTokenId(tokenId: string): boolean {
  return /^[a-zA-Z0-9]{1,80}$/.test(tokenId);
}
