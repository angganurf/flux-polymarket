export const GAMMA_API_URL = "https://gamma-api.polymarket.com";
export const CLOB_API_URL = "https://clob.polymarket.com";
export const DATA_API_URL = "https://data-api.polymarket.com";
export const WS_MARKET_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";

// Use proxy routes in the browser to avoid CORS; use direct URLs on the server
export const USE_PROXY = typeof window !== "undefined";
export const PROXY_BASE_URL = "/api/polymarket";

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "politics", label: "Politics" },
  { id: "sports", label: "Sports" },
  { id: "crypto", label: "Crypto" },
  { id: "pop-culture", label: "Culture" },
  { id: "science", label: "Science" },
  { id: "business", label: "Business" },
] as const;

export const SORT_OPTIONS = [
  { id: "volume24hr", label: "Volume" },
  { id: "liquidity", label: "Liquidity" },
  { id: "startDate", label: "Newest" },
  { id: "endDate", label: "Ending Soon" },
] as const;

export const CHART_INTERVALS = [
  { id: "1h", label: "1H", fidelity: 1 },
  { id: "6h", label: "6H", fidelity: 5 },
  { id: "1d", label: "1D", fidelity: 15 },
  { id: "1w", label: "1W", fidelity: 60 },
  { id: "max", label: "ALL", fidelity: 360 },
] as const;

export const LEADERBOARD_CATEGORIES = [
  "OVERALL", "POLITICS", "SPORTS", "CRYPTO", "CULTURE",
] as const;

export const LEADERBOARD_PERIODS = [
  "DAY", "WEEK", "MONTH", "ALL",
] as const;
