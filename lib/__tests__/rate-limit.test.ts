import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "../rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("return type shape", () => {
    it("returns an object with limited, remaining, and resetIn fields", () => {
      const result = checkRateLimit("shape-test", { maxRequests: 5, windowMs: 60000 });
      expect(result).toHaveProperty("limited");
      expect(result).toHaveProperty("remaining");
      expect(result).toHaveProperty("resetIn");
      expect(typeof result.limited).toBe("boolean");
      expect(typeof result.remaining).toBe("number");
      expect(typeof result.resetIn).toBe("number");
    });
  });

  describe("allowing requests", () => {
    it("allows the first request and decrements remaining", () => {
      const result = checkRateLimit("allow1", { maxRequests: 3, windowMs: 60000 });
      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(2);
    });

    it("allows requests up to the limit", () => {
      const opts = { maxRequests: 3, windowMs: 60000 };
      checkRateLimit("allow2", opts); // 1st
      checkRateLimit("allow2", opts); // 2nd
      const result = checkRateLimit("allow2", opts); // 3rd (last allowed)
      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("resetIn is approximately the full window on first request", () => {
      const result = checkRateLimit("resetin1", { maxRequests: 5, windowMs: 60000 });
      expect(result.resetIn).toBe(60000);
    });
  });

  describe("blocking requests", () => {
    it("blocks requests exceeding the limit", () => {
      const opts = { maxRequests: 2, windowMs: 60000 };
      checkRateLimit("block1", opts); // 1st allowed
      checkRateLimit("block1", opts); // 2nd allowed
      const result = checkRateLimit("block1", opts); // 3rd → blocked
      expect(result.limited).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it("resetIn is positive when blocked", () => {
      const opts = { maxRequests: 1, windowMs: 5000 };
      checkRateLimit("block2", opts); // consume the only slot
      vi.advanceTimersByTime(2000);   // 2s elapsed
      const result = checkRateLimit("block2", opts);
      expect(result.limited).toBe(true);
      // resetIn should be approximately 3000ms (5000 - 2000)
      expect(result.resetIn).toBeGreaterThan(0);
      expect(result.resetIn).toBeLessThanOrEqual(5000);
    });

    it("remaining is 0 when blocked", () => {
      const opts = { maxRequests: 2, windowMs: 60000 };
      checkRateLimit("block3", opts);
      checkRateLimit("block3", opts);
      const result = checkRateLimit("block3", opts);
      expect(result.remaining).toBe(0);
    });
  });

  describe("window reset", () => {
    it("resets after window expires", () => {
      const opts = { maxRequests: 1, windowMs: 1000 };
      checkRateLimit("reset1", opts); // use up the quota
      const blocked = checkRateLimit("reset1", opts);
      expect(blocked.limited).toBe(true);

      vi.advanceTimersByTime(1001); // advance past the window
      const reset = checkRateLimit("reset1", opts);
      expect(reset.limited).toBe(false);
      expect(reset.remaining).toBe(0); // 1 max, 1 used = 0 remaining
    });

    it("remaining counts down as requests are made within a window", () => {
      const opts = { maxRequests: 5, windowMs: 60000 };
      const r1 = checkRateLimit("countdown1", opts);
      expect(r1.remaining).toBe(4);
      const r2 = checkRateLimit("countdown1", opts);
      expect(r2.remaining).toBe(3);
      const r3 = checkRateLimit("countdown1", opts);
      expect(r3.remaining).toBe(2);
    });
  });

  describe("key isolation", () => {
    it("tracks different keys independently", () => {
      const opts = { maxRequests: 1, windowMs: 60000 };
      checkRateLimit("iso-a", opts); // exhaust key A
      const result = checkRateLimit("iso-b", opts); // key B should be fresh
      expect(result.limited).toBe(false);
    });

    it("same key shares quota", () => {
      const opts = { maxRequests: 2, windowMs: 60000 };
      checkRateLimit("shared", opts);
      const result = checkRateLimit("shared", opts); // 2nd request, should be at limit
      expect(result.remaining).toBe(0);
    });
  });
});
