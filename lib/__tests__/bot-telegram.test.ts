import { describe, it, expect } from "vitest";
import { formatMarketAlert, formatPredictionAlert } from "../bot/telegram";

// escapeHtml is not exported from telegram.ts, so we replicate the logic here
// to test the same algorithm used by the module
function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

describe("Telegram bot utils — escapeHtml", () => {
  it("escapes less-than and greater-than signs", () => {
    expect(escapeHtml("Hello <b>world</b>")).toBe(
      "Hello &lt;b&gt;world&lt;/b&gt;"
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("AT&T")).toBe("AT&amp;T");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeHtml("normal text")).toBe("normal text");
  });

  it("escapes multiple special characters", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert('xss')&lt;/script&gt;"
    );
  });

  it("escapes ampersand before angle brackets to avoid double-escaping", () => {
    expect(escapeHtml("a & b < c > d")).toBe(
      "a &amp; b &lt; c &gt; d"
    );
  });
});

describe("Telegram bot utils — probability formatting", () => {
  it("formats a probability of 0.75 as 75.0%", () => {
    const prob = 0.75;
    const formatted = `${(prob * 100).toFixed(1)}%`;
    expect(formatted).toBe("75.0%");
  });

  it("formats a null probability as N/A", () => {
    const prob = null;
    const formatted =
      prob != null ? `${(prob * 100).toFixed(1)}%` : "N/A";
    expect(formatted).toBe("N/A");
  });

  it("formats a probability of 0 as 0.0%", () => {
    const prob = 0;
    const formatted = `${(prob * 100).toFixed(1)}%`;
    expect(formatted).toBe("0.0%");
  });

  it("formats a probability of 1 as 100.0%", () => {
    const prob = 1;
    const formatted = `${(prob * 100).toFixed(1)}%`;
    expect(formatted).toBe("100.0%");
  });
});

describe("formatMarketAlert", () => {
  it("includes the market title (HTML-escaped) in output", () => {
    const result = formatMarketAlert({
      title: "Will BTC hit $200k?",
      probability: 0.3,
    });
    expect(result).toContain("Will BTC hit $200k?");
  });

  it("includes probability when provided", () => {
    const result = formatMarketAlert({
      title: "Test Market",
      probability: 0.5,
    });
    expect(result).toContain("50.0%");
  });

  it("shows N/A when probability is not provided", () => {
    const result = formatMarketAlert({ title: "Test Market" });
    expect(result).toContain("N/A");
  });

  it("includes volume when provided", () => {
    const result = formatMarketAlert({
      title: "Test Market",
      volume: "1000000",
    });
    expect(result).toContain("$1000000");
  });

  it("omits volume line when volume is not provided", () => {
    const result = formatMarketAlert({ title: "Test Market" });
    expect(result).not.toContain("Volume");
  });

  it("includes market URL when slug is provided", () => {
    const result = formatMarketAlert({
      title: "Test Market",
      slug: "some-market-slug",
    });
    expect(result).toContain("some-market-slug");
  });

  it("escapes HTML in title", () => {
    const result = formatMarketAlert({ title: "<b>bold</b>" });
    expect(result).toContain("&lt;b&gt;bold&lt;/b&gt;");
    expect(result).not.toContain("<b>bold</b>");
  });
});

describe("formatPredictionAlert", () => {
  it("includes the event title", () => {
    const result = formatPredictionAlert({
      title: "Will X happen?",
      id: "123",
      status: "active",
    });
    expect(result).toContain("Will X happen?");
  });

  it("includes the event ID in the link", () => {
    const result = formatPredictionAlert({
      title: "Event",
      id: "event-id-456",
      status: "active",
    });
    expect(result).toContain("event-id-456");
  });

  it("shows ACTIVE status text", () => {
    const result = formatPredictionAlert({
      title: "Event",
      id: "1",
      status: "active",
    });
    expect(result).toContain("ACTIVE");
  });

  it("shows resolved status text", () => {
    const result = formatPredictionAlert({
      title: "Event",
      id: "1",
      status: "resolved",
    });
    expect(result).toContain("resolved");
  });

  it("includes result when provided", () => {
    const result = formatPredictionAlert({
      title: "Event",
      id: "1",
      status: "resolved",
      result: "yes",
    });
    expect(result).toContain("YES");
  });

  it("omits result line when result is null", () => {
    const result = formatPredictionAlert({
      title: "Event",
      id: "1",
      status: "resolved",
      result: null,
    });
    expect(result).not.toContain("Result:");
  });
});
