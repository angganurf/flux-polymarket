// === Gamma API Types ===

export interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  questionID: string;
  category: string;
  description: string;
  resolutionSource: string;
  outcomes: string; // JSON stringified array like '["Yes","No"]'
  outcomePrices: string; // JSON stringified array like '["0.72","0.28"]'
  clobTokenIds: string; // JSON stringified array of token IDs
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  oneDayPriceChange: number;
  oneHourPriceChange: number;
  oneWeekPriceChange: number;
  oneMonthPriceChange: number;
  volume: string;
  volumeNum: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  liquidity: string;
  liquidityNum: number;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  acceptingOrders: boolean;
  enableOrderBook: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  closedTime: string | null;
  image: string;
  icon: string;
}

export interface GammaEvent {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  description: string;
  active: boolean;
  closed: boolean;
  featured: boolean;
  volume: number;
  volume24hr: number;
  liquidity: number;
  startDate: string;
  endDate: string;
  markets: GammaMarket[];
  tags: GammaTag[];
}

export interface GammaTag {
  id: number;
  label: string;
  slug: string;
}

// === CLOB API Types ===

export interface ClobOrderBookEntry {
  price: string;
  size: string;
}

export interface ClobOrderBook {
  market: string;
  asset_id: string;
  bids: ClobOrderBookEntry[];
  asks: ClobOrderBookEntry[];
  hash: string;
}

export interface ClobPriceHistoryPoint {
  t: number; // unix timestamp
  p: number; // price
}

export interface ClobPriceHistory {
  history: ClobPriceHistoryPoint[];
}

export interface ClobMarket {
  condition_id: string;
  tokens: {
    token_id: string;
    outcome: string;
    price: number;
    winner: boolean;
  }[];
  min_incentive_size: string;
  max_incentive_spread: string;
  active: boolean;
  closed: boolean;
  accepting_orders: boolean;
  accepting_order_timestamp: string;
  minimum_order_size: string;
  minimum_tick_size: string;
  description: string;
  end_date_iso: string;
  game_start_time: string;
  question: string;
  market_slug: string;
  icon: string;
  image: string;
  neg_risk: boolean;
}

// === Data API Types ===

export interface LeaderboardEntry {
  rank: number;
  proxyWallet: string;
  userName: string;
  profileImage: string;
  vol: number;
  pnl: number;
  xUsername: string;
}

export interface MarketHolder {
  proxyWallet: string;
  userName: string;
  profileImage: string;
  amount: number;
  outcome: string;
}

export interface OpenInterest {
  market: string;
  value: number;
}

// === WebSocket Types ===

export interface WsSubscription {
  assets_ids: string[];
  type: string;
  custom_feature_enabled?: boolean;
}

export interface WsPriceChange {
  event_type: "price_change";
  asset_id: string;
  price: string;
  size: string;
  side: string;
  timestamp: string;
}

export interface WsLastTradePrice {
  event_type: "last_trade_price";
  asset_id: string;
  price: string;
  size: string;
  side: string;
  timestamp: string;
}

export interface WsBookSnapshot {
  event_type: "book";
  asset_id: string;
  market: string;
  bids: ClobOrderBookEntry[];
  asks: ClobOrderBookEntry[];
}

export type WsMessage = WsPriceChange | WsLastTradePrice | WsBookSnapshot;

// === Parsed/Normalized Types (for frontend use) ===

export interface ParsedMarket {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  description: string;
  category: string;
  image: string;
  icon: string;
  outcomes: string[];
  outcomePrices: number[];
  clobTokenIds: string[];
  yesPrice: number;
  noPrice: number;
  volume: number;
  volume24h: number;
  liquidity: number;
  priceChange24h: number;
  priceChange1w: number;
  active: boolean;
  closed: boolean;
  featured: boolean;
  endDate: string;
  resolutionSource: string;
}

export interface ParsedEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  volume: number;
  volume24h: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  featured: boolean;
  markets: ParsedMarket[];
  tags: GammaTag[];
}
