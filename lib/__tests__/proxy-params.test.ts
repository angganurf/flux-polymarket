import { describe, it, expect } from "vitest";
import { filterProxyParams, isValidSlug, isValidTokenId } from "../api/proxy-params";

describe("filterProxyParams", () => {
  it("filters events params to allowlist", () => {
    const params = new URLSearchParams("limit=10&offset=0&evil=malicious&tag=crypto");
    const result = filterProxyParams(params, "events");
    expect(result).toContain("limit=10");
    expect(result).toContain("tag=crypto");
    expect(result).not.toContain("evil");
  });

  it("filters markets params", () => {
    const params = new URLSearchParams("limit=5&__proto__=bad");
    const result = filterProxyParams(params, "markets");
    expect(result).toContain("limit=5");
    expect(result).not.toContain("__proto__");
  });

  it("returns empty string for unknown endpoint", () => {
    const params = new URLSearchParams("limit=10");
    const result = filterProxyParams(params, "unknown" as any);
    expect(result).toBe("");
  });

  it("handles empty params", () => {
    const params = new URLSearchParams();
    const result = filterProxyParams(params, "events");
    expect(result).toBe("");
  });
});

describe("isValidSlug", () => {
  it("accepts valid slugs", () => {
    expect(isValidSlug("us-election-2024")).toBe(true);
    expect(isValidSlug("bitcoin-200k")).toBe(true);
    expect(isValidSlug("a")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("-starts-with-dash")).toBe(false);
    expect(isValidSlug("has spaces")).toBe(false);
    expect(isValidSlug("has/slash")).toBe(false);
    expect(isValidSlug("../traversal")).toBe(false);
    expect(isValidSlug("a".repeat(201))).toBe(false);
  });
});

describe("isValidTokenId", () => {
  it("accepts valid token IDs", () => {
    expect(isValidTokenId("abc123")).toBe(true);
    expect(isValidTokenId("A1B2C3")).toBe(true);
  });

  it("rejects invalid token IDs", () => {
    expect(isValidTokenId("")).toBe(false);
    expect(isValidTokenId("has-dashes")).toBe(false);
    expect(isValidTokenId("has spaces")).toBe(false);
    expect(isValidTokenId("a".repeat(81))).toBe(false);
  });
});
