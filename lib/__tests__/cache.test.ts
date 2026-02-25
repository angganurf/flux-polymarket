import { describe, it, expect, beforeEach, vi } from "vitest";
import { LRUCache, CACHE_TTL } from "../cache";

describe("LRUCache", () => {
  let cache: LRUCache;

  beforeEach(() => {
    cache = new LRUCache(3);
  });

  describe("get / set", () => {
    it("returns null for missing key", () => {
      expect(cache.get("missing")).toBeNull();
    });

    it("stores and retrieves a value", () => {
      cache.set("key1", { foo: "bar" }, 60_000);
      expect(cache.get("key1")).toEqual({ foo: "bar" });
    });

    it("returns correct size", () => {
      cache.set("a", 1, 60_000);
      cache.set("b", 2, 60_000);
      expect(cache.size).toBe(2);
    });
  });

  describe("LRU eviction", () => {
    it("evicts oldest entry when maxSize is exceeded", () => {
      cache.set("a", 1, 60_000);
      cache.set("b", 2, 60_000);
      cache.set("c", 3, 60_000);
      // Cache is full (3 items). Adding a 4th should evict "a".
      cache.set("d", 4, 60_000);

      expect(cache.get("a")).toBeNull();
      expect(cache.get("b")).toBe(2);
      expect(cache.get("c")).toBe(3);
      expect(cache.get("d")).toBe(4);
      expect(cache.size).toBe(3);
    });

    it("accessing a key moves it to most-recently-used", () => {
      cache.set("a", 1, 60_000);
      cache.set("b", 2, 60_000);
      cache.set("c", 3, 60_000);

      // Access "a" — moves it to end
      cache.get("a");

      // Now "b" is oldest. Adding "d" should evict "b", not "a".
      cache.set("d", 4, 60_000);

      expect(cache.get("b")).toBeNull();
      expect(cache.get("a")).toBe(1);
      expect(cache.get("c")).toBe(3);
      expect(cache.get("d")).toBe(4);
    });

    it("updating an existing key does not increase size", () => {
      cache.set("a", 1, 60_000);
      cache.set("b", 2, 60_000);
      cache.set("a", 10, 60_000);

      expect(cache.size).toBe(2);
      expect(cache.get("a")).toBe(10);
    });
  });

  describe("TTL expiry", () => {
    it("returns null for expired entries", () => {
      vi.useFakeTimers();
      try {
        cache.set("key", "value", 1000); // 1s TTL
        expect(cache.get("key")).toBe("value");

        vi.advanceTimersByTime(1001);
        expect(cache.get("key")).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it("returns value before TTL expires", () => {
      vi.useFakeTimers();
      try {
        cache.set("key", "value", 5000);

        vi.advanceTimersByTime(4999);
        expect(cache.get("key")).toBe("value");
      } finally {
        vi.useRealTimers();
      }
    });

    it("expired entry is removed from cache", () => {
      vi.useFakeTimers();
      try {
        cache.set("key", "value", 100);
        vi.advanceTimersByTime(200);
        cache.get("key"); // triggers removal
        expect(cache.size).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("invalidate", () => {
    beforeEach(() => {
      cache.set("events:limit=10", "data1", 60_000);
      cache.set("events:limit=20", "data2", 60_000);
      cache.set("market:btc-price", "data3", 60_000);
    });

    it("clears all entries when no pattern is given", () => {
      const count = cache.invalidate();
      expect(count).toBe(3);
      expect(cache.size).toBe(0);
    });

    it("clears entries matching a pattern", () => {
      const count = cache.invalidate("events:");
      expect(count).toBe(2);
      expect(cache.size).toBe(1);
      expect(cache.get("market:btc-price")).toBe("data3");
    });

    it("returns 0 when no entries match pattern", () => {
      const count = cache.invalidate("nonexistent");
      expect(count).toBe(0);
      expect(cache.size).toBe(3);
    });
  });

  describe("CACHE_TTL", () => {
    it("has expected TTL values", () => {
      expect(CACHE_TTL.EVENTS_LIST).toBe(60_000);
      expect(CACHE_TTL.EVENT_DETAIL).toBe(30_000);
      expect(CACHE_TTL.SEARCH).toBe(120_000);
      expect(CACHE_TTL.LEADERBOARD).toBe(300_000);
      expect(CACHE_TTL.ORDER_BOOK).toBe(10_000);
      expect(CACHE_TTL.PRICES_HISTORY).toBe(60_000);
    });
  });
});
