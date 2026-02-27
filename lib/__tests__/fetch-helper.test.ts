import { describe, it, expect, vi, afterEach } from "vitest";
import { gammaUrl, clobUrl, dataUrl } from "../api/fetch-helper";

// Helper to simulate browser (client-side) environment
function simulateBrowser() {
  vi.stubGlobal("window", { location: { href: "http://localhost:3100" } });
}

// Helper to simulate server-side environment (no window)
function simulateServer() {
  vi.unstubAllGlobals();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── gammaUrl ─────────────────────────────────────────────────────────────────

describe("gammaUrl (server-side)", () => {
  it("returns direct Gamma API URL for /events", () => {
    simulateServer();
    expect(gammaUrl("/events")).toBe("https://gamma-api.polymarket.com/events");
  });

  it("returns direct Gamma API URL for /markets", () => {
    simulateServer();
    expect(gammaUrl("/markets")).toBe("https://gamma-api.polymarket.com/markets");
  });

  it("returns direct Gamma API URL for /public-search", () => {
    simulateServer();
    expect(gammaUrl("/public-search")).toBe(
      "https://gamma-api.polymarket.com/public-search"
    );
  });

  it("returns direct URL for /events/slug/{slug}", () => {
    simulateServer();
    expect(gammaUrl("/events/slug/us-election-2024")).toBe(
      "https://gamma-api.polymarket.com/events/slug/us-election-2024"
    );
  });

  it("returns direct URL for /markets/slug/{slug}", () => {
    simulateServer();
    expect(gammaUrl("/markets/slug/bitcoin-200k")).toBe(
      "https://gamma-api.polymarket.com/markets/slug/bitcoin-200k"
    );
  });

  it("appends query params", () => {
    simulateServer();
    expect(gammaUrl("/events", "limit=10&tag=crypto")).toBe(
      "https://gamma-api.polymarket.com/events?limit=10&tag=crypto"
    );
  });

  it("normalizes path without leading slash", () => {
    simulateServer();
    expect(gammaUrl("events")).toBe("https://gamma-api.polymarket.com/events");
  });

  it("returns URL without query string when params is undefined", () => {
    simulateServer();
    const url = gammaUrl("/events");
    expect(url).not.toContain("?");
  });

  it("returns URL without query string when params is empty string", () => {
    simulateServer();
    const url = gammaUrl("/events", "");
    expect(url).not.toContain("?");
  });
});

describe("gammaUrl (browser/client-side)", () => {
  it("proxies /events through /api/polymarket/events", () => {
    simulateBrowser();
    expect(gammaUrl("/events")).toBe("/api/polymarket/events");
  });

  it("proxies /markets through /api/polymarket/markets", () => {
    simulateBrowser();
    expect(gammaUrl("/markets")).toBe("/api/polymarket/markets");
  });

  it("proxies /public-search through /api/polymarket/search", () => {
    simulateBrowser();
    expect(gammaUrl("/public-search")).toBe("/api/polymarket/search");
  });

  it("proxies /events/slug/{slug} through /api/polymarket/events/{slug}", () => {
    simulateBrowser();
    expect(gammaUrl("/events/slug/us-election-2024")).toBe(
      "/api/polymarket/events/us-election-2024"
    );
  });

  it("proxies /markets/slug/{slug} through /api/polymarket/markets/{slug}", () => {
    simulateBrowser();
    expect(gammaUrl("/markets/slug/bitcoin-200k")).toBe(
      "/api/polymarket/markets/bitcoin-200k"
    );
  });

  it("appends query params when proxying events", () => {
    simulateBrowser();
    expect(gammaUrl("/events", "limit=10&tag=crypto")).toBe(
      "/api/polymarket/events?limit=10&tag=crypto"
    );
  });

  it("appends query params when proxying event slug", () => {
    simulateBrowser();
    expect(gammaUrl("/events/slug/us-election-2024", "fields=title")).toBe(
      "/api/polymarket/events/us-election-2024?fields=title"
    );
  });

  it("appends query params when proxying public-search", () => {
    simulateBrowser();
    expect(gammaUrl("/public-search", "q=bitcoin")).toBe(
      "/api/polymarket/search?q=bitcoin"
    );
  });

  it("normalizes path without leading slash in browser", () => {
    simulateBrowser();
    expect(gammaUrl("events")).toBe("/api/polymarket/events");
  });
});

// ─── clobUrl ──────────────────────────────────────────────────────────────────

describe("clobUrl (server-side)", () => {
  it("returns direct CLOB API URL for /prices-history", () => {
    simulateServer();
    expect(clobUrl("/prices-history")).toBe(
      "https://clob.polymarket.com/prices-history"
    );
  });

  it("returns direct CLOB API URL for /book", () => {
    simulateServer();
    expect(clobUrl("/book")).toBe("https://clob.polymarket.com/book");
  });

  it("returns direct CLOB API URL for unknown paths", () => {
    simulateServer();
    expect(clobUrl("/other")).toBe("https://clob.polymarket.com/other");
  });

  it("appends query params", () => {
    simulateServer();
    expect(clobUrl("/prices-history", "token_id=abc123")).toBe(
      "https://clob.polymarket.com/prices-history?token_id=abc123"
    );
  });

  it("normalizes path without leading slash", () => {
    simulateServer();
    expect(clobUrl("book")).toBe("https://clob.polymarket.com/book");
  });
});

describe("clobUrl (browser/client-side)", () => {
  it("proxies prices-history through /api/polymarket/prices-history", () => {
    simulateBrowser();
    expect(clobUrl("/prices-history")).toBe("/api/polymarket/prices-history");
  });

  it("proxies book through /api/polymarket/book", () => {
    simulateBrowser();
    expect(clobUrl("/book")).toBe("/api/polymarket/book");
  });

  it("falls back to direct CLOB URL for paths without a dedicated proxy route", () => {
    simulateBrowser();
    expect(clobUrl("/other")).toBe("https://clob.polymarket.com/other");
  });

  it("appends query params when proxying prices-history", () => {
    simulateBrowser();
    expect(clobUrl("/prices-history", "token_id=abc123")).toBe(
      "/api/polymarket/prices-history?token_id=abc123"
    );
  });

  it("appends query params when proxying book", () => {
    simulateBrowser();
    expect(clobUrl("/book", "token_id=abc123")).toBe(
      "/api/polymarket/book?token_id=abc123"
    );
  });

  it("path containing 'prices-history' anywhere triggers proxy", () => {
    simulateBrowser();
    // The function uses .includes() so the substring match is intentional
    expect(clobUrl("prices-history")).toBe("/api/polymarket/prices-history");
  });
});

// ─── dataUrl ──────────────────────────────────────────────────────────────────

describe("dataUrl (server-side)", () => {
  it("returns direct Data API URL for /leaderboard", () => {
    simulateServer();
    expect(dataUrl("/leaderboard")).toBe(
      "https://data-api.polymarket.com/leaderboard"
    );
  });

  it("returns direct Data API URL for unknown paths", () => {
    simulateServer();
    expect(dataUrl("/other")).toBe("https://data-api.polymarket.com/other");
  });

  it("appends query params", () => {
    simulateServer();
    expect(dataUrl("/leaderboard", "limit=100")).toBe(
      "https://data-api.polymarket.com/leaderboard?limit=100"
    );
  });

  it("normalizes path without leading slash", () => {
    simulateServer();
    expect(dataUrl("leaderboard")).toBe(
      "https://data-api.polymarket.com/leaderboard"
    );
  });
});

describe("dataUrl (browser/client-side)", () => {
  it("proxies leaderboard through /api/polymarket/leaderboard", () => {
    simulateBrowser();
    expect(dataUrl("/leaderboard")).toBe("/api/polymarket/leaderboard");
  });

  it("falls back to direct Data API URL for paths without a dedicated proxy route", () => {
    simulateBrowser();
    expect(dataUrl("/other")).toBe("https://data-api.polymarket.com/other");
  });

  it("appends query params when proxying leaderboard", () => {
    simulateBrowser();
    expect(dataUrl("/leaderboard", "limit=100&period=weekly")).toBe(
      "/api/polymarket/leaderboard?limit=100&period=weekly"
    );
  });

  it("path containing 'leaderboard' anywhere triggers proxy", () => {
    simulateBrowser();
    expect(dataUrl("leaderboard")).toBe("/api/polymarket/leaderboard");
  });
});
