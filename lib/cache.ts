interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class LRUCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private maxSize: number;

  constructor(maxSize: number = 500) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    // If key already exists, delete it first so it moves to end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    if (this.cache.size >= this.maxSize) {
      // Delete oldest entry (first in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  invalidate(pattern?: string): number {
    if (!pattern) {
      const size = this.cache.size;
      this.cache.clear();
      return size;
    }
    let count = 0;
    for (const key of [...this.cache.keys()]) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  get size(): number {
    return this.cache.size;
  }
}

// Singleton instance — survives HMR in development
const globalForCache = globalThis as unknown as { apiCache: LRUCache | undefined };
export const apiCache = globalForCache.apiCache ?? new LRUCache(500);
if (process.env.NODE_ENV !== "production") globalForCache.apiCache = apiCache;

// TTL presets in milliseconds
export const CACHE_TTL = {
  EVENTS_LIST: 60_000,       // 1 min  — event listings
  EVENT_DETAIL: 30_000,      // 30s    — single event/market detail
  SEARCH: 120_000,           // 2 min  — search results
  LEADERBOARD: 300_000,      // 5 min  — leaderboard
  ORDER_BOOK: 10_000,        // 10s    — order book (fast-changing)
  PRICES_HISTORY: 60_000,    // 1 min  — price history
} as const;

// Re-export class for testing
export { LRUCache };
