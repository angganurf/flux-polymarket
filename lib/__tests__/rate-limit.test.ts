import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "../rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests within limit", () => {
    const result = checkRateLimit("user1", { maxRequests: 3, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks requests exceeding limit", () => {
    const opts = { maxRequests: 2, windowMs: 60000 };
    checkRateLimit("user2", opts);
    checkRateLimit("user2", opts);
    const result = checkRateLimit("user2", opts);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const opts = { maxRequests: 1, windowMs: 1000 };
    checkRateLimit("user3", opts);
    const blocked = checkRateLimit("user3", opts);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(1001);
    const reset = checkRateLimit("user3", opts);
    expect(reset.allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    const opts = { maxRequests: 1, windowMs: 60000 };
    checkRateLimit("userA", opts);
    const result = checkRateLimit("userB", opts);
    expect(result.allowed).toBe(true);
  });
});
